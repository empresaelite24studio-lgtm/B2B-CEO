import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

export default async function handler(req, res) {
  if (!process.env.NOTION_KEY || !process.env.NOTION_DATABASE_ID) {
    return res.status(500).json({ error: 'Faltan variables de entorno NOTION_KEY o NOTION_DATABASE_ID' });
  }

  try {
    if (req.method === 'GET') {
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
      const jsonString = JSON.stringify(data);
      
      // Dividir el JSON en fragmentos de 2000 caracteres para Notion
      const chunks = [];
      for (let i = 0; i < jsonString.length; i += 2000) {
        chunks.push({
          type: 'text',
          text: { content: jsonString.substring(i, i + 2000) }
        });
      }

      // Buscar si ya existe para actualizar o crear
      const existing = await notion.databases.query({
        database_id: databaseId,
        filter: { property: 'ProjectID', rich_text: { equals: id } }
      });

      if (existing.results.length > 0) {
        // Actualizar
        const pageId = existing.results[0].id;
        await notion.pages.update({
          page_id: pageId,
          properties: {
            Name: { title: [{ text: { content: name } }] },
            Date: { rich_text: [{ text: { content: date } }] },
            JSONData: { rich_text: chunks }
          }
        });
        return res.status(200).json({ success: true, action: 'updated' });
      } else {
        // Crear nuevo
        await notion.pages.create({
          parent: { database_id: databaseId },
          properties: {
            Name: { title: [{ text: { content: name } }] },
            ProjectID: { rich_text: [{ text: { content: id } }] },
            Date: { rich_text: [{ text: { content: date } }] },
            JSONData: { rich_text: chunks }
          }
        });
        return res.status(200).json({ success: true, action: 'created' });
      }
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
