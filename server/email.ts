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
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.sender = {
    name: "CREDACTIVE",
    email: "noreply@credactive.com",
  };

  sendSmtpEmail.to = [{ email: options.to }];
  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.htmlContent;
  if (options.textContent) {
    sendSmtpEmail.textContent = options.textContent;
  }

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (error) {
    console.error("Error sending email via Brevo:", error);
    throw new Error("Failed to send email");
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/reset-password?token=${resetToken}`;

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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CREDACTIVE</h1>
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
          <p><strong>Questo link scadrà tra 1 ora.</strong></p>
          <p>Se non hai richiesto questa operazione, ignora questa email.</p>
          <p>Grazie,<br>Il Team CREDACTIVE</p>
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

Questo link scadrà tra 1 ora.

Se non hai richiesto questa operazione, ignora questa email.

Grazie,
Il Team CREDACTIVE
  `;

  await sendEmail({
    to: email,
    subject: "CREDACTIVE - Recupero Password",
    htmlContent,
    textContent,
  });
}

export async function sendWelcomeEmail(
  email: string,
  firstName?: string
): Promise<void> {
  const loginUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/login`;
  
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
          <h1>Benvenuto su CREDACTIVE!</h1>
        </div>
        <div class="content">
          <p>Ciao ${name},</p>
          <p>Benvenuto nella piattaforma professionale per la preparazione alle certificazioni!</p>
          <p>Con CREDACTIVE hai accesso a:</p>
          <div class="feature">✅ Quiz professionali su Cybersecurity, Compliance e Business</div>
          <div class="feature">✅ Report dettagliati con analisi delle performance</div>
          <div class="feature">✅ Contenuti multilingua (IT, EN, ES, FR)</div>
          <div class="feature">✅ Domande generate con AI di ultima generazione</div>
          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">Inizia Ora</a>
          </p>
          <p>Buono studio!<br>Il Team CREDACTIVE</p>
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

Inizia ora: ${loginUrl}

Buono studio!
Il Team CREDACTIVE
  `;

  await sendEmail({
    to: email,
    subject: "Benvenuto su CREDACTIVE!",
    htmlContent,
    textContent,
  });
}
