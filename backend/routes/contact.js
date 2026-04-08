const express = require('express');
const router  = express.Router();
const nodemailer = require('nodemailer');
const { ContactMessage, CommunityJoin } = require('../database');

// ─── Mailer Setup ──────────────────────────────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── POST /api/contact ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, school, message, type } = req.body;

    if (!name || !email || !message)
      return res.status(400).json({ error: 'Name, email, and message are required.' });

    // Save to MongoDB
    await ContactMessage.create({
      name, email,
      phone:   phone   || null,
      school:  school  || null,
      message,
      type:    type    || 'general',
    });

    // Send email notification (non-fatal)
    if (process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_gmail_app_password_here') {
      try {
        const transporter = createTransporter();
        const typeLabels = {
          school:   '🏫 School Partnership Inquiry',
          workshop: '📚 Workshop Booking Request',
          general:  '💬 General Inquiry',
        };
        const label = typeLabels[type] || '📩 New Contact Message';

        await transporter.sendMail({
          from: `"AIcyberX Website" <${process.env.EMAIL_USER}>`,
          to:   process.env.EMAIL_TO || process.env.EMAIL_USER,
          subject: `${label} from ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #010a14; color: #e8f4ff; padding: 30px; border-radius: 12px; border: 1px solid #00d4ff33;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #00d4ff; font-size: 24px; margin: 0;">AIcyberX</h1>
                <p style="color: #6b8cae; margin: 4px 0 0;">New Message from Website</p>
              </div>
              <div style="background: #0a1628; border: 1px solid #0077ff33; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                <h2 style="color: #00d4ff; font-size: 18px; margin: 0 0 16px;">${label}</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #6b8cae; width: 120px;">Name</td><td style="color: #e8f4ff;">${name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b8cae;">Email</td><td style="color: #00d4ff;"><a href="mailto:${email}" style="color: #00d4ff;">${email}</a></td></tr>
                  ${phone  ? `<tr><td style="padding: 8px 0; color: #6b8cae;">Phone</td><td style="color: #e8f4ff;">${phone}</td></tr>`  : ''}
                  ${school ? `<tr><td style="padding: 8px 0; color: #6b8cae;">School</td><td style="color: #e8f4ff;">${school}</td></tr>` : ''}
                </table>
              </div>
              <div style="background: #0a1628; border: 1px solid #0077ff33; border-radius: 8px; padding: 20px;">
                <p style="color: #6b8cae; margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Message</p>
                <p style="color: #e8f4ff; line-height: 1.6; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              <p style="color: #6b8cae; font-size: 12px; text-align: center; margin-top: 24px;">Sent from AIcyberX Community Website • ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
            </div>
          `,
        });

        // Auto-reply
        await transporter.sendMail({
          from:    `"AIcyberX Team" <${process.env.EMAIL_USER}>`,
          to:      email,
          subject: `Thanks for reaching out, ${name}! — AIcyberX`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #010a14; color: #e8f4ff; padding: 30px; border-radius: 12px; border: 1px solid #00d4ff33;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #00d4ff; font-size: 28px; margin: 0;">AIcyberX</h1>
                <p style="color: #6b8cae; font-size: 13px; margin: 4px 0 0;">AI & Cyber Community</p>
              </div>
              <h2 style="color: #e8f4ff; font-size: 20px;">Hey ${name}! 👋</h2>
              <p style="color: #b0c8e0; line-height: 1.8;">Thanks for getting in touch with AIcyberX! We've received your message and our team will get back to you within <strong style="color: #00d4ff;">24–48 hours</strong>.</p>
              <p style="color: #b0c8e0; line-height: 1.8;">In the meantime, join our growing community on WhatsApp and Instagram to stay updated on the latest workshops, hackathons, and competitions!</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://instagram.com/aicyberx60" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #0077ff); color: #000; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; margin: 8px;">Follow on Instagram</a>
              </div>
              <p style="color: #6b8cae; font-size: 13px; border-top: 1px solid #0a1628; padding-top: 16px; margin-top: 24px;">Learn AI. Master Cyber. Lead Tomorrow. 🚀</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Email error (non-fatal):', emailErr.message);
      }
    }

    res.status(201).json({ message: "Message sent successfully! We'll get back to you soon. 🚀" });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

// ─── POST /api/contact/community ──────────────────────────────────────────────
router.post('/community', async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });

    // Upsert — don't create duplicate entries for the same email
    await CommunityJoin.findOneAndUpdate(
      { email: email.toLowerCase() },
      { name, phone: phone || null, city: city || null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "You've been added to the AIcyberX community list! 🎉 Check your WhatsApp." });
  } catch (err) {
    console.error('Community join error:', err);
    res.status(500).json({ error: 'Failed to join. Please try again.' });
  }
});

module.exports = router;
