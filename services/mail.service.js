const nodemailer = require('nodemailer');

/**
 * Mail-Service für den E-Mail-Versand
 * Verwendet Nodemailer mit SMTP-Konfiguration
 */

let transporter = null;

/**
 * Initialisiert den Mail-Transporter mit den Konfigurationseinstellungen
 */
const initializeTransporter = () => {
  if (transporter) return;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Sendet eine E-Mail
 * @param {Object} options - E-Mail-Optionen
 * @param {string} options.to - Empfänger-E-Mail
 * @param {string} options.subject - Betreff
 * @param {string} [options.text] - Text-Version der E-Mail
 * @param {string} [options.html] - HTML-Version der E-Mail
 * @param {Object} [options.attachments] - Anhänge
 * @returns {Promise} - Versand-Ergebnis
 */
const sendMail = async (options) => {
  try {
    if (!transporter) {
      initializeTransporter();
    }

    const mailOptions = {
      from: process.env.MAIL_FROM || '"Rising BSM" <noreply@risingbsm.de>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Fehler beim E-Mail-Versand:', error);
    throw new Error('E-Mail konnte nicht gesendet werden: ' + error.message);
  }
};

/**
 * Sendet eine Kontaktformular-Benachrichtigung
 * @param {Object} data - Kontaktformular-Daten
 * @returns {Promise} - Versand-Ergebnis
 */
const sendContactNotification = async (data) => {
  const text = `
Neue Kontaktanfrage erhalten:

Name: ${data.name}
E-Mail: ${data.email}
Telefon: ${data.telefon || 'Nicht angegeben'}
Nachricht:
${data.nachricht}

Gesendet am: ${new Date().toLocaleString('de-DE')}
`;

  const html = `
<h2>Neue Kontaktanfrage erhalten</h2>
<table>
  <tr><td><strong>Name:</strong></td><td>${data.name}</td></tr>
  <tr><td><strong>E-Mail:</strong></td><td>${data.email}</td></tr>
  <tr><td><strong>Telefon:</strong></td><td>${data.telefon || 'Nicht angegeben'}</td></tr>
</table>
<h3>Nachricht:</h3>
<p>${data.nachricht.replace(/\n/g, '<br>')}</p>
<p><small>Gesendet am: ${new Date().toLocaleString('de-DE')}</small></p>
`;

  return sendMail({
    to: process.env.CONTACT_EMAIL,
    subject: 'Neue Kontaktanfrage',
    text,
    html
  });
};

/**
 * Sendet eine Passwort-Reset-E-Mail
 * @param {Object} data - Benutzer- und Token-Daten
 * @returns {Promise} - Versand-Ergebnis
 */
const sendPasswordReset = async (data) => {
  const resetUrl = `${data.baseUrl}/reset-password/${data.token}`;
  
  const text = `
Sehr geehrte(r) ${data.name},

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.
Klicken Sie auf den folgenden Link, um ein neues Passwort zu vergeben:

${resetUrl}

Dieser Link ist 24 Stunden gültig.
Falls Sie keine Passwortänderung angefordert haben, ignorieren Sie diese E-Mail bitte.

Mit freundlichen Grüßen
Ihr Rising BSM Team
`;

  const html = `
<h2>Passwort zurücksetzen</h2>
<p>Sehr geehrte(r) ${data.name},</p>
<p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
<p>Klicken Sie auf den folgenden Button, um ein neues Passwort zu vergeben:</p>
<p style="text-align: center; margin: 30px 0;">
  <a href="${resetUrl}" 
     style="background-color: #007bff; color: white; padding: 12px 24px; 
            text-decoration: none; border-radius: 4px; display: inline-block;">
    Passwort zurücksetzen
  </a>
</p>
<p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p><small>Dieser Link ist 24 Stunden gültig.</small></p>
<p>Falls Sie keine Passwortänderung angefordert haben, ignorieren Sie diese E-Mail bitte.</p>
<p>Mit freundlichen Grüßen<br>Ihr Rising BSM Team</p>
`;

  return sendMail({
    to: data.email,
    subject: 'Passwort zurücksetzen - Rising BSM',
    text,
    html
  });
};

module.exports = {
  sendMail,
  sendContactNotification,
  sendPasswordReset
}; 