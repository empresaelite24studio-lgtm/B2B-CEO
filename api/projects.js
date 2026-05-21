import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// Recursively strip base64 data URLs from project data before saving to Notion.
// This ensures the JSON always fits within Notion's 200KB rich_text limit.
// External URLs (http/https) are preserved.
function stripBase64Images(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // If it's a base64 data URL, replace with empty string
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

      if (fetchId) {
        const existing = await notion.databases.query({
          database_id: databaseId,
          filter: { property: 'ProjectID', rich_text: { equals: fetchId } }
        });
        if (existing.results.length === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
        
        const page = existing.results[0];
        let blocks = [];
        let cursor;
        do {
          const response = await notion.blocks.children.list({ block_id: page.id, start_cursor: cursor });
          blocks = blocks.concat(response.results);
          cursor = response.next_cursor;
        } while (cursor);
        
        const fullJsonString = blocks.map(b => b.paragraph?.rich_text.map(t => t.plain_text).join('') || '').join('');
        let fullData = {};
        try { fullData = JSON.parse(fullJsonString); } catch(e) {}
        
        return res.status(200).json({ id: fetchId, data: fullData });
      }

      // Leer proyectos
      const response = await notion.databases.query({ database_id: databaseId });
      
      const projects = response.results.map(page => {
        const properties = page.properties;
        const id = properties.ProjectID?.rich_text[0]?.plain_text || page.id;
        const name = properties.Name?.title[0]?.plain_text || 'Sin nombre';
        const date = properties.Date?.rich_text[0]?.plain_text || '';
        
        // Reconstruir el JSON desde los bloques de texto (Notion tiene límite de 2000 por bloque)
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
      // Guardar o actualizar proyecto
      const { id, name, date, data } = req.body;
      const safeName = name || 'Sin nombre';
      const safeDate = date || '';
      const safeId = String(id || Date.now());
      // Strip base64 images so the project fits in Notion's text fields
      const cleanData = stripBase64Images(data || {});
      const jsonString = JSON.stringify(cleanData);
      
      const chunks = [];
      for (let i = 0; i < jsonString.length; i += 2000) {
        chunks.push({
          type: 'text',
          text: { content: jsonString.substring(i, i + 2000) }
        });
      }

      if (chunks.length > 100) {
        return res.status(400).json({ 
          error: 'El proyecto es demasiado pesado para la base de datos (máx 200KB). Intenta subir imágenes más pequeñas o eliminar algunos renders.',
          size: jsonString.length 
        });
      }

      // Buscar si ya existe para actualizar o crear
      const existing = await notion.databases.query({
        database_id: databaseId,
        filter: { property: 'ProjectID', rich_text: { equals: safeId } }
      });

      if (existing.results.length > 0) {
        // Archivar versión anterior
        for (const page of existing.results) {
          await notion.pages.update({ page_id: page.id, archived: true });
        }
      }

      // Crear nuevo con los datos básicos
      const newPage = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: safeName } }] },
          ProjectID: { rich_text: [{ text: { content: safeId } }] },
          Date: { rich_text: [{ text: { content: safeDate } }] },
          JSONData: { rich_text: chunks }
        }
      });

      // Añadir la data completa con imágenes en los bloques
      const fullJsonString = JSON.stringify(data || {});
      const blockChunks = [];
      for (let i = 0; i < fullJsonString.length; i += 2000) {
        blockChunks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: fullJsonString.substring(i, i + 2000) } }] }
        });
      }

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
