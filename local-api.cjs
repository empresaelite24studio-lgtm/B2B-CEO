const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

app.get('/api/projects', async (req, res) => {
  try {
    const response = await notion.databases.query({ database_id: databaseId });
    const projects = response.results.map(page => {
      const properties = page.properties;
      const id = properties.ProjectID?.rich_text[0]?.plain_text || page.id;
      const name = properties.Name?.title[0]?.plain_text || 'Sin nombre';
      const date = properties.Date?.rich_text[0]?.plain_text || '';
      const jsonDataRaw = properties.JSONData?.rich_text.map(t => t.plain_text).join('') || '{}';
      try {
        return { id, name, date, data: JSON.parse(jsonDataRaw) };
      } catch (e) {
        return { id, name, date, data: {} };
      }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  const { id, name, date, data } = req.body;
  const jsonString = JSON.stringify(data);
  const chunks = [];
  for (let i = 0; i < jsonString.length; i += 2000) {
    chunks.push({ type: 'text', text: { content: jsonString.substring(i, i + 2000) } });
  }

  try {
    const existing = await notion.databases.query({
      database_id: databaseId,
      filter: { property: 'ProjectID', rich_text: { equals: id } }
    });

    if (existing.results.length > 0) {
      await notion.pages.update({
        page_id: existing.results[0].id,
        properties: {
          Name: { title: [{ text: { content: name } }] },
          Date: { rich_text: [{ text: { content: date } }] },
          JSONData: { rich_text: chunks }
        }
      });
    } else {
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: name } }] },
          ProjectID: { rich_text: [{ text: { content: id } }] },
          Date: { rich_text: [{ text: { content: date } }] },
          JSONData: { rich_text: chunks }
        }
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects', async (req, res) => {
  const { id } = req.body;
  try {
    const existing = await notion.databases.query({
      database_id: databaseId,
      filter: { property: 'ProjectID', rich_text: { equals: id } }
    });
    if (existing.results.length > 0) {
      await notion.pages.update({ page_id: existing.results[0].id, archived: true });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Local API running on http://localhost:3001');
});
