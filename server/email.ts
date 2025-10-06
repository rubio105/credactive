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
  const name = firstName || email.split('@')[0];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Registrazione Confermata!</h1>
        </div>
        <div class="content">
          <p>Ciao ${name},</p>
          <p>Grazie per esserti registrato su <strong>CREDACTIVE</strong>!</p>
          <p>La tua registrazione è stata completata con successo. Ora puoi accedere alla piattaforma e iniziare il tuo percorso di preparazione alle certificazioni professionali.</p>
          <p>Se hai domande o bisogno di assistenza, non esitare a contattarci.</p>
          <p>A presto,<br>Il Team CREDACTIVE</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} CREDACTIVE. Tutti i diritti riservati.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
CREDACTIVE - Registrazione Confermata!

Ciao ${name},

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
  
  const name = firstName || email.split('@')[0];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .feature { margin: 15px 0; padding-left: 25px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Benvenuto su CREDACTIVE!</h1>
        </div>
        <div class="content">
          <p>Ciao ${name},</p>
          <p>Benvenuto nella piattaforma professionale per la preparazione alle certificazioni!</p>
          <p>Con CREDACTIVE hai accesso a:</p>
          <div class="feature">✅ Quiz professionali su Cybersecurity, Compliance e Business</div>
          <div class="feature">✅ Report dettagliati con analisi delle performance</div>
          <div class="feature">✅ Contenuti multilingua (IT, EN, ES, FR)</div>
          <div class="feature">✅ Domande generate con AI di ultima generazione</div>
          <div class="feature">✅ Corsi on-demand e live per approfondire</div>
          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">Inizia Ora</a>
          </p>
          <p>Buono studio e buona preparazione!<br>Il Team CREDACTIVE</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} CREDACTIVE. Tutti i diritti riservati.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
CREDACTIVE - Benvenuto!

Ciao ${name},

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
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 CREDACTIVE</h1>
          <p>Recupero Password</p>
        </div>
        <div class="content">
          <p>Ciao,</p>
          <p>Hai richiesto di reimpostare la tua password. Clicca sul pulsante qui sotto per procedere:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reimposta Password</a>
          </p>
          <p>Oppure copia e incolla questo link nel tuo browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ Importante:</strong> Questo link scadrà tra 1 ora per motivi di sicurezza.
          </div>
          <p>Se non hai richiesto questa operazione, ignora questa email. La tua password rimarrà invariata.</p>
          <p>Cordiali saluti,<br>Il Team CREDACTIVE</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} CREDACTIVE. Tutti i diritti riservati.</p>
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
      const name = recipient.firstName || recipient.email.split('@')[0];
      
      const htmlContent = htmlTemplate
        .replace(/{{firstName}}/g, name)
        .replace(/{{email}}/g, recipient.email);
      
      const textContent = textTemplate
        ?.replace(/{{firstName}}/g, name)
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
