const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function test() {
  try {
    const response = await notion.databases.retrieve({ database_id: databaseId });
    console.log('Nombre:', response.title[0]?.plain_text);
    console.log('Props JSON:', JSON.stringify(response.properties, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}
test();
