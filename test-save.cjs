const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function testSave() {
  console.log('Intentando guardar un proyecto de prueba...');
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Name': { title: [{ text: { content: 'Proyecto Test' } }] },
        'ProjectID': { rich_text: [{ text: { content: 'test-123' } }] },
        'Date': { rich_text: [{ text: { content: 'Hoy' } }] },
        'JSONData': { rich_text: [{ text: { content: '{"status": "ok"}' } }] }
      }
    });
    console.log('✅ ¡Proyecto guardado con éxito! ID de página:', response.id);
  } catch (error) {
    console.error('❌ Error al guardar:', error.message);
    console.log('Sugerencia: Asegúrate de que las columnas Name, ProjectID, Date y JSONData existan en tu Notion y sean de tipo "Texto" (excepto Name que es el título).');
  }
}

testSave();
