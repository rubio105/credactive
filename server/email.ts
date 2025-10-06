import * as brevo from "@getbrevo/brevo";

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ""
);

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  senderName?: string;
  senderEmail?: string;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeUserInput(input: string | undefined): string {
  if (!input) return '';
  return escapeHtml(input.trim());
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.sender = {
    name: options.senderName || "CREDACTIVE",
    email: options.senderEmail || process.env.BREVO_SENDER_EMAIL || "noreply@credactive.com",
  };

  sendSmtpEmail.to = [{ email: options.to }];
  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.htmlContent;
  if (options.textContent) {
    sendSmtpEmail.textContent = options.textContent;
  }

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error("Error sending email via Brevo:", error);
    throw new Error("Failed to send email");
  }
}

export async function sendRegistrationConfirmationEmail(
  email: string,
  firstName?: string
): Promise<void> {
  const rawName = firstName || email.split('@')[0];
  const name = sanitizeUserInput(rawName);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { width: 200px; height: 60px; margin-bottom: 20px; }
        .content { background: white; padding: 40px 30px; }
        .success-icon { font-size: 48px; margin: 20px 0; }
        .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; }
        .footer-links { margin: 15px 0; }
        .footer-links a { color: #667eea; text-decoration: none; margin: 0 10px; }
        .social-links { margin: 20px 0; }
        .social-links a { display: inline-block; margin: 0 8px; color: #666; }
        h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .highlight { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <svg class="logo" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
            <text x="100" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">CREDACTIVE</text>
            <text x="100" y="50" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.8)" text-anchor="middle">ACADEMY</text>
          </svg>
          <h1>✅ Registrazione Confermata!</h1>
        </div>
        <div class="content">
          <div class="success-icon">🎉</div>
          <p style="font-size: 18px;">Ciao <strong>${name}</strong>,</p>
          <p>Grazie per esserti unito a <span class="highlight">CREDACTIVE ACADEMY</span>!</p>
          <p>La tua registrazione è stata completata con successo. Ora puoi accedere alla nostra piattaforma e iniziare il tuo percorso di eccellenza professionale nella preparazione alle certificazioni.</p>
          <div style="background: #f0f7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>💡 Prossimi Passi:</strong></p>
            <ul style="margin: 10px 0;">
              <li>Esplora le nostre categorie di quiz</li>
              <li>Completa il tuo primo quiz di valutazione</li>
              <li>Scopri i corsi on-demand disponibili</li>
            </ul>
          </div>
          <p>Se hai domande o bisogno di assistenza, il nostro team è sempre disponibile.</p>
          <p style="margin-top: 30px;">A presto,<br><strong>Il Team CREDACTIVE</strong></p>
        </div>
        <div class="footer">
          <div class="footer-links">
            <a href="mailto:support@credactive.com">Supporto</a> |
            <a href="https://credactive.com/faq">FAQ</a> |
            <a href="https://credactive.com/privacy">Privacy</a>
          </div>
          <p style="color: #999; font-size: 12px; margin: 15px 0;">
            © ${new Date().getFullYear()} CREDACTIVE ACADEMY. Tutti i diritti riservati.
          </p>
          <p style="color: #999; font-size: 11px;">
            Questa email è stata inviata a ${sanitizeUserInput(email)}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
CREDACTIVE - Registrazione Confermata!

Ciao ${rawName},

Grazie per esserti registrato su CREDACTIVE!

La tua registrazione è stata completata con successo. Ora puoi accedere alla piattaforma e iniziare il tuo percorso di preparazione alle certificazioni professionali.

Se hai domande o bisogno di assistenza, non esitare a contattarci.

A presto,
Il Team CREDACTIVE
  `;

  await sendEmail({
    to: email,
    subject: "✅ Registrazione Confermata - CREDACTIVE",
    htmlContent,
    textContent,
  });
}

export async function sendWelcomeEmail(
  email: string,
  firstName?: string
): Promise<void> {
  const baseUrl = process.env.BASE_URL || 
                  (process.env.REPLIT_DOMAINS?.split(',')[0] 
                    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
                    : 'http://localhost:5000');
  const loginUrl = `${baseUrl}/login`;
  
  const rawName = firstName || email.split('@')[0];
  const name = sanitizeUserInput(rawName);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { width: 200px; height: 60px; margin-bottom: 20px; }
        .content { background: white; padding: 40px 30px; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }
        .feature { margin: 15px 0; padding: 15px; background: #f8f9ff; border-radius: 8px; display: flex; align-items: center; }
        .feature-icon { font-size: 24px; margin-right: 15px; }
        .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; }
        .footer-links { margin: 15px 0; }
        .footer-links a { color: #667eea; text-decoration: none; margin: 0 10px; }
        h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .stats { display: flex; justify-content: space-around; margin: 30px 0; }
        .stat { text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <svg class="logo" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
            <text x="100" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">CREDACTIVE</text>
            <text x="100" y="50" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.8)" text-anchor="middle">ACADEMY</text>
          </svg>
          <h1>🎉 Benvenuto su CREDACTIVE!</h1>
        </div>
        <div class="content">
          <p style="font-size: 18px;">Ciao <strong>${name}</strong>,</p>
          <p style="font-size: 16px;">Benvenuto nella piattaforma professionale per l'eccellenza nelle certificazioni!</p>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-number">2000+</div>
              <div class="stat-label">Domande</div>
            </div>
            <div class="stat">
              <div class="stat-number">10+</div>
              <div class="stat-label">Categorie</div>
            </div>
            <div class="stat">
              <div class="stat-number">4</div>
              <div class="stat-label">Lingue</div>
            </div>
          </div>

          <h3 style="color: #667eea; margin-top: 30px;">🚀 Cosa ti aspetta:</h3>
          
          <div class="feature">
            <div class="feature-icon">🎯</div>
            <div>
              <strong>Quiz Professionali</strong><br>
              <span style="color: #666; font-size: 14px;">Cybersecurity, Compliance, Business e Leadership</span>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">📊</div>
            <div>
              <strong>Report Dettagliati</strong><br>
              <span style="color: #666; font-size: 14px;">Analisi approfondite delle tue performance</span>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🌍</div>
            <div>
              <strong>Contenuti Multilingua</strong><br>
              <span style="color: #666; font-size: 14px;">Italiano, Inglese, Spagnolo, Francese</span>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🤖</div>
            <div>
              <strong>AI-Powered</strong><br>
              <span style="color: #666; font-size: 14px;">Domande generate con intelligenza artificiale avanzata</span>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🎓</div>
            <div>
              <strong>Corsi Esclusivi</strong><br>
              <span style="color: #666; font-size: 14px;">On-demand e live con esperti del settore</span>
            </div>
          </div>

          <p style="text-align: center; margin-top: 30px;">
            <a href="${loginUrl}" class="button">🚀 Inizia il Tuo Percorso</a>
          </p>

          <div style="background: linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%); padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #667eea;"><strong>💡 Consiglio:</strong> Inizia con un quiz di valutazione per scoprire il tuo livello!</p>
          </div>

          <p style="margin-top: 30px;">Buono studio e buona preparazione!<br><strong>Il Team CREDACTIVE</strong></p>
        </div>
        <div class="footer">
          <div class="footer-links">
            <a href="mailto:support@credactive.com">Supporto</a> |
            <a href="https://credactive.com/faq">FAQ</a> |
            <a href="https://credactive.com/privacy">Privacy</a>
          </div>
          <p style="color: #999; font-size: 12px; margin: 15px 0;">
            © ${new Date().getFullYear()} CREDACTIVE ACADEMY. Tutti i diritti riservati.
          </p>
          <p style="color: #999; font-size: 11px;">
            Questa email è stata inviata a ${sanitizeUserInput(email)}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
CREDACTIVE - Benvenuto!

Ciao ${rawName},

Benvenuto nella piattaforma professionale per la preparazione alle certificazioni!

Con CREDACTIVE hai accesso a:
- Quiz professionali su Cybersecurity, Compliance e Business
- Report dettagliati con analisi delle performance
- Contenuti multilingua (IT, EN, ES, FR)
- Domande generate con AI di ultima generazione
- Corsi on-demand e live per approfondire

Inizia ora: ${loginUrl}

Buono studio e buona preparazione!
Il Team CREDACTIVE
  `;

  await sendEmail({
    to: email,
    subject: "🎉 Benvenuto su CREDACTIVE!",
    htmlContent,
    textContent,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const baseUrl = process.env.BASE_URL || 
                  (process.env.REPLIT_DOMAINS?.split(',')[0] 
                    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
                    : 'http://localhost:5000');
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { width: 200px; height: 60px; margin-bottom: 20px; }
        .content { background: white; padding: 40px 30px; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }
        .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; }
        .footer-links { margin: 15px 0; }
        .footer-links a { color: #667eea; text-decoration: none; margin: 0 10px; }
        .warning { background: #fff8e1; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .security-icon { font-size: 48px; margin: 20px 0; }
        h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .link-box { background: #f5f5f5; padding: 15px; border-radius: 8px; word-break: break-all; color: #667eea; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <svg class="logo" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
            <text x="100" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">CREDACTIVE</text>
            <text x="100" y="50" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.8)" text-anchor="middle">ACADEMY</text>
          </svg>
          <h1>🔐 Recupero Password</h1>
        </div>
        <div class="content">
          <div class="security-icon">🔑</div>
          <p style="font-size: 16px;">Ciao,</p>
          <p>Hai richiesto di reimpostare la tua password. Per motivi di sicurezza, clicca sul pulsante qui sotto per procedere:</p>
          
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">🔓 Reimposta Password</a>
          </p>

          <p style="color: #666; font-size: 14px;">Oppure copia e incolla questo link nel tuo browser:</p>
          <div class="link-box">${resetUrl}</div>

          <div class="warning">
            <strong>⚠️ Importante - Motivi di Sicurezza:</strong><br>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Questo link scadrà tra <strong>1 ora</strong></li>
              <li>Il link può essere utilizzato una sola volta</li>
              <li>Dopo il reset, effettua il login con la nuova password</li>
            </ul>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 25px;">
            <p style="margin: 0; font-size: 14px;"><strong>🛡️ Non hai richiesto questo reset?</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
              Se non hai richiesto questa operazione, ignora questa email. La tua password rimarrà invariata e il tuo account è al sicuro.
            </p>
          </div>

          <p style="margin-top: 30px;">Cordiali saluti,<br><strong>Il Team CREDACTIVE</strong></p>
        </div>
        <div class="footer">
          <div class="footer-links">
            <a href="mailto:support@credactive.com">Supporto</a> |
            <a href="https://credactive.com/faq">FAQ</a> |
            <a href="https://credactive.com/privacy">Privacy</a>
          </div>
          <p style="color: #999; font-size: 12px; margin: 15px 0;">
            © ${new Date().getFullYear()} CREDACTIVE ACADEMY. Tutti i diritti riservati.
          </p>
          <p style="color: #999; font-size: 11px;">
            Questa email è stata inviata a ${sanitizeUserInput(email)}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
CREDACTIVE - Recupero Password

Ciao,

Hai richiesto di reimpostare la tua password. Visita questo link per procedere:

${resetUrl}

⚠️ IMPORTANTE: Questo link scadrà tra 1 ora per motivi di sicurezza.

Se non hai richiesto questa operazione, ignora questa email. La tua password rimarrà invariata.

Cordiali saluti,
Il Team CREDACTIVE
  `;

  await sendEmail({
    to: email,
    subject: "🔐 Recupero Password - CREDACTIVE",
    htmlContent,
    textContent,
  });
}

export async function sendMarketingEmail(
  email: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject,
    htmlContent,
    textContent,
  });
}

export async function sendBulkMarketingEmail(
  recipients: Array<{ email: string; firstName?: string }>,
  subject: string,
  htmlTemplate: string,
  textTemplate?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    try {
      const rawName = recipient.firstName || recipient.email.split('@')[0];
      const sanitizedName = sanitizeUserInput(rawName);
      const sanitizedEmail = sanitizeUserInput(recipient.email);
      
      const htmlContent = htmlTemplate
        .replace(/{{firstName}}/g, sanitizedName)
        .replace(/{{email}}/g, sanitizedEmail);
      
      const textContent = textTemplate
        ?.replace(/{{firstName}}/g, rawName)
        .replace(/{{email}}/g, recipient.email);

      await sendMarketingEmail(
        recipient.email,
        subject,
        htmlContent,
        textContent
      );
      
      sent++;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      failed++;
      errors.push(`Failed to send to ${recipient.email}: ${error}`);
      console.error(`Failed to send to ${recipient.email}:`, error);
    }
  }

  return { sent, failed, errors };
}
