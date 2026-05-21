const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function run() {
  console.log("Creating test page...");
  const page = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: { title: [{ text: { content: 'Test Large Data' } }] },
      ProjectID: { rich_text: [{ text: { content: 'test-large-123' } }] },
      Date: { rich_text: [{ text: { content: 'Hoy' } }] }
    }
  });
  console.log("Page created:", page.id);

  // Generate 500KB of random-ish string (simulating base64 images)
  console.log("Generating 500KB of dummy data...");
  const dummyStr = 'A'.repeat(500 * 1024);
  const chunks = [];
  for (let i = 0; i < dummyStr.length; i += 2000) {
    chunks.push(dummyStr.substring(i, i + 2000));
  }

  console.log(`Split into ${chunks.length} chunks. Appending blocks...`);
  const blockObjects = chunks.map(chunk => ({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: chunk } }]
    }
  }));

  // Append in batches of 100
  for (let i = 0; i < blockObjects.length; i += 100) {
    const batch = blockObjects.slice(i, i + 100);
    console.log(`Appending batch ${i / 100 + 1}...`);
    await notion.blocks.children.append({
      block_id: page.id,
      children: batch
    });
  }
  console.log("Append complete!");

  console.log("Reading blocks back...");
  let blocks = [];
  let cursor;
  let pageCount = 1;
  do {
    console.log(`Fetching blocks page ${pageCount}...`);
    const response = await notion.blocks.children.list({
      block_id: page.id,
      start_cursor: cursor
    });
    blocks = blocks.concat(response.results);
    cursor = response.next_cursor;
    pageCount++;
  } while (cursor);

  console.log("Total blocks retrieved:", blocks.length);
  const reconstructed = blocks.map(b => b.paragraph?.rich_text[0]?.plain_text || '').join('');
  console.log("Reconstructed data length:", reconstructed.length);
  console.log("Matches original?", reconstructed === dummyStr);

  // Clean up
  console.log("Archiving test page...");
  await notion.pages.update({
    page_id: page.id,
    archived: true
  });
  console.log("Done!");
}

run().catch(console.error);
