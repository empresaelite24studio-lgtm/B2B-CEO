import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// Recursively strip base64 data URLs from project data before saving to Notion's property.
function stripBase64Images(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    if (obj.startsWith('data:image/')) return '';
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(stripBase64Images);
  if (typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      result[key] = stripBase64Images(obj[key]);
    }
    return result;
  }
  return obj;
}

export default async function handler(req, res) {
  if (!process.env.NOTION_KEY || !process.env.NOTION_DATABASE_ID) {
    return res.status(500).json({ error: 'Faltan variables de entorno NOTION_KEY o NOTION_DATABASE_ID' });
  }

  try {
    if (req.method === 'GET') {
      const { id: fetchId } = req.query;

      // Single project fetch by ID (used for share links and loading active project details)
      if (fetchId) {
        const existing = await notion.databases.query({
          database_id: databaseId,
          filter: { property: 'ProjectID', rich_text: { equals: fetchId } }
        });

        if (existing.results.length === 0) {
          return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        const page = existing.results[0];
        const properties = page.properties;
        const id = properties.ProjectID?.rich_text[0]?.plain_text || page.id;
        const name = properties.Name?.title[0]?.plain_text || 'Sin nombre';
        const date = properties.Date?.rich_text[0]?.plain_text || '';

        // 1. Try to load the full data from the page's block children
        let blocks = [];
        let cursor;
        try {
          do {
            const response = await notion.blocks.children.list({ block_id: page.id, start_cursor: cursor });
            blocks = blocks.concat(response.results);
            cursor = response.next_cursor;
          } while (cursor);
        } catch (e) {
          console.error("Error listing block children:", e);
        }

        let data = {};
        if (blocks.length > 0) {
          const fullJsonString = blocks.map(b => b.paragraph?.rich_text?.map(t => t.plain_text).join('') || '').join('');
          try { 
            data = JSON.parse(fullJsonString); 
          } catch (e) {
            console.error("Error parsing block JSON:", e);
          }
        }

        // 2. Fallback: If no blocks or parsing failed, fall back to the property JSONData (stripped images)
        if (!data || Object.keys(data).length === 0) {
          const jsonDataRaw = properties.JSONData?.rich_text.map(t => t.plain_text).join('') || '{}';
          try { 
            data = JSON.parse(jsonDataRaw); 
          } catch (e) {}
        }

        return res.status(200).json({ id, name, date, data });
      }

      // List all projects (lightweight, returns stripped property data for fast loading)
      const response = await notion.databases.query({ database_id: databaseId });
      
      const projects = response.results.map(page => {
        const properties = page.properties;
        const id = properties.ProjectID?.rich_text[0]?.plain_text || page.id;
        const name = properties.Name?.title[0]?.plain_text || 'Sin nombre';
        const date = properties.Date?.rich_text[0]?.plain_text || '';
        const jsonDataRaw = properties.JSONData?.rich_text.map(t => t.plain_text).join('') || '{}';
        
        try {
          const data = JSON.parse(jsonDataRaw);
          return { id, name, date, data, notionPageId: page.id };
        } catch (e) {
          return { id, name, date, data: {}, error: 'Error parseando JSON' };
        }
      });

      return res.status(200).json(projects);
    } 

    if (req.method === 'POST') {
      const { id, name, date, data } = req.body;
      const safeName = name || 'Sin nombre';
      const safeDate = date || '';
      const safeId = String(id || Date.now());

      // 1. Prepare stripped data for the property
      const cleanData = stripBase64Images(data || {});
      const jsonString = JSON.stringify(cleanData);
      const propertyChunks = [];
      for (let i = 0; i < jsonString.length; i += 2000) {
        propertyChunks.push({
          type: 'text',
          text: { content: jsonString.substring(i, i + 2000) }
        });
      }

      if (propertyChunks.length > 100) {
        return res.status(400).json({ 
          error: 'El proyecto es demasiado pesado para la base de datos (máx 200KB).',
          size: jsonString.length 
        });
      }

      // 2. Check if page already exists
      const existing = await notion.databases.query({
        database_id: databaseId,
        filter: { property: 'ProjectID', rich_text: { equals: safeId } }
      });

      // Archiving older versions to prevent block append clutter
      if (existing.results.length > 0) {
        for (const page of existing.results) {
          await notion.pages.update({ page_id: page.id, archived: true });
        }
      }

      // 3. Create the new page
      const newPage = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: safeName } }] },
          ProjectID: { rich_text: [{ text: { content: safeId } }] },
          Date: { rich_text: [{ text: { content: safeDate } }] },
          JSONData: { rich_text: propertyChunks }
        }
      });

      // 4. Save the FULL JSON (with images) inside the page's block children
      const fullJsonString = JSON.stringify(data || {});
      const blockChunks = [];
      for (let i = 0; i < fullJsonString.length; i += 2000) {
        blockChunks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: fullJsonString.substring(i, i + 2000) } }]
          }
        });
      }

      // Append blocks in batches of 100
      for (let i = 0; i < blockChunks.length; i += 100) {
        await notion.blocks.children.append({
          block_id: newPage.id,
          children: blockChunks.slice(i, i + 100)
        });
      }

      return res.status(200).json({ success: true, action: existing.results.length > 0 ? 'updated' : 'created' });
    }

    if (req.method === 'DELETE') {
        const { id } = req.body;
        const existing = await notion.databases.query({
            database_id: databaseId,
            filter: { property: 'ProjectID', rich_text: { equals: id } }
        });

        if (existing.results.length > 0) {
            await notion.pages.update({
                page_id: existing.results[0].id,
                archived: true
            });
            return res.status(200).json({ success: true });
        }
        return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error Notion API:', error);
    return res.status(500).json({ error: error.message });
  }
}
