const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function prepareDB() {
  console.log('Intentando configurar las columnas en tu base de datos de Notion...');
  try {
    await notion.databases.update({
      database_id: databaseId,
      properties: {
        'ProjectID': { rich_text: {} },
        'Date': { rich_text: {} },
        'JSONData': { rich_text: {} }
        // 'Name' suele ser el título por defecto, si no, se puede configurar así:
        // 'Name': { title: {} }
      }
    });
    console.log('✅ ¡Columnas configuradas con éxito!');
    console.log('Ahora tu base de datos tiene: Name (Título), ProjectID (Texto), Date (Texto) y JSONData (Texto).');
  } catch (error) {
    console.error('❌ Error configurando columnas:', error.message);
    console.log('Intenta crear las columnas manualmente en Notion si este error persiste.');
  }
}

prepareDB();
