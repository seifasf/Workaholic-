const nodemailer = require('nodemailer');

/**
 * Brevo SMTP:
 *   EMAIL_SMTP_USER = SMTP login (e.g. xxxxx@smtp-brevo.com) — never use as "From"
 *   EMAIL_PASS      = SMTP key
 *   EMAIL_FROM      = A real address you verified in Brevo (Senders) — this is the visible sender
 *
 * If EMAIL_FROM is missing, we fall back to EMAIL_USER (works for Gmail; breaks for Brevo if USER is smtp-brevo.com).
 */
const smtpUser = process.env.EMAIL_SMTP_USER || process.env.EMAIL_USER;
const fromAddr = process.env.EMAIL_FROM || process.env.EMAIL_USER;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  requireTLS: true,
  auth: {
    user: smtpUser,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!smtpUser || !process.env.EMAIL_PASS) {
    console.error('Email send skipped: EMAIL_SMTP_USER/EMAIL_USER or EMAIL_PASS not set');
    return;
  }
  if (fromAddr && fromAddr.includes('smtp-brevo.com')) {
    console.error(
      'Email "from" cannot be smtp-brevo.com — set EMAIL_FROM to a verified sender in Brevo.'
    );
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Workaholic HR" <${fromAddr}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

module.exports = { sendEmail };
