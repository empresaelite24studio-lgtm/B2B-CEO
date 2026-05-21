import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { name, role, email, whatsapp, brandName, studioName } = req.body;

  // Configuración de SMTP
  const transporter = nodemailer.createTransport({
    host: (process.env.SMTP_HOST || '').trim(),
    port: parseInt((process.env.SMTP_PORT || '587').trim()),
    secure: (process.env.SMTP_PORT || '').trim() === '465', // true para 465, false para otros puertos
    auth: {
      user: (process.env.SMTP_USER || '').trim(),
      pass: (process.env.SMTP_PASS || '').trim(),
    },
  });

  try {
    // Cuerpo del correo
    const mailOptions = {
      from: `"B2B CEO - ${studioName}" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Enviar al mismo correo SMTP
      replyTo: email, // Para poder responder fácilmente al cliente
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
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error enviando correo:', error);
    return res.status(500).json({ error: 'Error enviando el correo', details: error.message });
  }
}
