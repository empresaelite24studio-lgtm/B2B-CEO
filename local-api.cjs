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
    const { id: fetchId } = req.query;

    // Single project fetch by ID
    if (fetchId) {
      const existing = await notion.databases.query({
        database_id: databaseId,
        filter: { property: 'ProjectID', rich_text: { equals: fetchId } }
      });
      if (existing.results.length === 0) return res.status(404).json({ error: 'No encontrado' });

      const page = existing.results[0];
      const properties = page.properties;
      const id = properties.ProjectID?.rich_text[0]?.plain_text || page.id;
      const name = properties.Name?.title[0]?.plain_text || 'Sin nombre';
      const date = properties.Date?.rich_text[0]?.plain_text || '';

      // Try blocks first
      let blocks = [];
      let cursor;
      try {
        do {
          const response = await notion.blocks.children.list({ block_id: page.id, start_cursor: cursor });
          blocks = blocks.concat(response.results);
          cursor = response.next_cursor;
        } while (cursor);
      } catch (e) {
        console.error(e);
      }

      let data = {};
      if (blocks.length > 0) {
        const fullJsonString = blocks.map(b => b.paragraph?.rich_text?.map(t => t.plain_text).join('') || '').join('');
        try {
          data = JSON.parse(fullJsonString);
        } catch (e) { }
      }

      if (!data || Object.keys(data).length === 0) {
        const jsonDataRaw = properties.JSONData?.rich_text.map(t => t.plain_text).join('') || '{}';
        try { data = JSON.parse(jsonDataRaw); } catch (e) { }
      }

      return res.json({ id, name, date, data });
    }

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

// ============================================
// FUNCIÓN MODIFICADA - YA NO BORRA LAS IMÁGENES
// ============================================
// Ahora las imágenes son URLs de PicDB (https://picdb.me/...)
// No necesitamos borrar nada, solo devolver el objeto intacto
function stripBase64Images(obj) {
  return obj;
}

app.post('/api/projects', async (req, res) => {
  const { id, name, date, data } = req.body;
  const safeId = String(id || Date.now());
  const safeName = name || 'Sin nombre';
  const safeDate = date || '';
  const cleanData = stripBase64Images(data || {});
  const jsonString = JSON.stringify(cleanData);
  const chunks = [];
  for (let i = 0; i < jsonString.length; i += 2000) {
    chunks.push({ type: 'text', text: { content: jsonString.substring(i, i + 2000) } });
  }

  try {
    const existing = await notion.databases.query({
      database_id: databaseId,
      filter: { property: 'ProjectID', rich_text: { equals: safeId } }
    });

    if (existing.results.length > 0) {
      for (const page of existing.results) {
        await notion.pages.update({ page_id: page.id, archived: true });
      }
    }

    const newPage = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: { title: [{ text: { content: safeName } }] },
        ProjectID: { rich_text: [{ text: { content: safeId } }] },
        Date: { rich_text: [{ text: { content: safeDate } }] },
        JSONData: { rich_text: chunks }
      }
    });

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

    console.log('✅ Proyecto guardado en Notion');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error:', error);
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

const nodemailer = require('nodemailer');

app.post('/api/send-email', async (req, res) => {
  const { name, role, email, whatsapp, brandName, studioName } = req.body;

  const transporter = nodemailer.createTransport({
    host: (process.env.SMTP_HOST || '').trim(),
    port: parseInt((process.env.SMTP_PORT || '587').trim()),
    secure: (process.env.SMTP_PORT || '').trim() === '465',
    auth: {
      user: (process.env.SMTP_USER || '').trim(),
      pass: (process.env.SMTP_PASS || '').trim(),
    },
  });

  try {
    const mailOptions = {
      from: `"B2B CEO - ${studioName}" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      replyTo: email,
      subject: `Nueva solicitud de contacto - ${brandName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
          <h2 style="color: #8A05BE;">Nueva Solicitud de Contacto</h2>
          <p>Se ha recibido una nueva respuesta del formulario para la propuesta de <strong>${brandName}</strong>.</p>
          <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #8A05BE;">
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Cargo:</strong> ${role}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>WhatsApp:</strong> ${whatsapp}</p>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            Este es un correo automático enviado desde la plataforma B2B CEO de ${studioName}.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('Error enviando correo:', error);
    res.status(500).json({ error: 'Error enviando el correo', details: error.message });
  }
});

app.listen(3001, () => {
  console.log('✅ API corriendo en http://localhost:3001');
  console.log('📸 PicDB integrado - Las imágenes se guardan como URLs');
});