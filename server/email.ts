import * as brevo from "@getbrevo/brevo";
import { getApiKey } from "./config";
import { storage } from "./storage";

// Brevo API instance - initialized lazily to support database-stored keys
let apiInstance: brevo.TransactionalEmailsApi | null = null;

async function getBrevoApi(): Promise<brevo.TransactionalEmailsApi> {
  if (apiInstance) {
    return apiInstance;
  }

  const apiKey = await getApiKey('BREVO_API_KEY');
  if (!apiKey) {
    throw new Error('Brevo API key not configured. Please add BREVO_API_KEY in the Admin API panel or environment variables.');
  }

  apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    apiKey
  );
  
  return apiInstance;
}

// Export function to clear Brevo instance when API key is updated
export function clearBrevoInstance() {
  apiInstance = null;
}

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

// Process template with variables
export function processTemplate(template: string, variables: Record<string, string>): string {
  let processed = template;
  for (const [key, value] of Object.entries(variables)) {
    const sanitized = sanitizeUserInput(value);
    // Replace both {{key}} and {{KEY}} (case insensitive)
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    processed = processed.replace(regex, sanitized);
  }
  return processed;
}

// Send email using template from database
export async function sendTemplateEmail(
  templateCode: string,
  to: string,
  variables: Record<string, string>
): Promise<void> {
  const template = await storage.getEmailTemplateByCode(templateCode);
  
  if (!template) {
    console.error(`Template not found: ${templateCode}`);
    throw new Error(`Email template '${templateCode}' not found`);
  }

  if (!template.isActive) {
    console.error(`Template is inactive: ${templateCode}`);
    throw new Error(`Email template '${templateCode}' is not active`);
  }

  const htmlContent = processTemplate(template.htmlContent, variables);
  const textContent = template.textContent ? processTemplate(template.textContent, variables) : undefined;
  const subject = processTemplate(template.subject, variables);

  await sendEmail({
    to,
    subject,
    htmlContent,
    textContent,
  });
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const sendSmtpEmail = new brevo.SendSmtpEmail();

  const senderEmail = options.senderEmail || await getApiKey('BREVO_SENDER_EMAIL') || "noreply@credactive.academy";
  
  sendSmtpEmail.sender = {
    name: options.senderName || "CREDACTIVE",
    email: senderEmail,
  };

  sendSmtpEmail.to = [{ email: options.to }];
  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.htmlContent;
  if (options.textContent) {
    sendSmtpEmail.textContent = options.textContent;
  }

  try {
    const api = await getBrevoApi();
    await api.sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error("Error sending email via Brevo:", error);
    throw new Error("Failed to send email");
  }
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

  // Try to use database template first
  try {
    await sendTemplateEmail('welcome', email, {
      firstName: rawName,
      email,
      loginUrl,
    });
    return;
  } catch (error: any) {
    // Only use fallback if template doesn't exist - propagate other errors (inactive, send failures, etc)
    if (!error.message?.includes('not found')) {
      throw error;
    }
    console.log('Template not found, using fallback welcome email');
  }

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

export async function sendVerificationCodeEmail(
  email: string,
  verificationCode: string,
  firstName?: string
): Promise<void> {
  const rawName = firstName || email.split('@')[0];
  const name = sanitizeUserInput(rawName);

  // Try to use database template first
  try {
    await sendTemplateEmail('verification', email, {
      firstName: rawName,
      email,
      verificationCode,
    });
    return;
  } catch (error: any) {
    // Only use fallback if template doesn't exist - propagate other errors (inactive, send failures, etc)
    if (!error.message?.includes('not found')) {
      throw error;
    }
    console.log('Template not found, using fallback verification email');
  }

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
        .content { background: white; padding: 40px 30px; text-align: center; }
        .code-box { background: #f8f9ff; border: 2px dashed #667eea; border-radius: 12px; padding: 30px; margin: 30px 0; }
        .code { font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace; }
        .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; }
        .footer-links { margin: 15px 0; }
        .footer-links a { color: #667eea; text-decoration: none; margin: 0 10px; }
        .warning { background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; text-align: left; }
        h1 { margin: 0; font-size: 28px; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <svg class="logo" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
            <text x="100" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">CREDACTIVE</text>
            <text x="100" y="50" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.8)" text-anchor="middle">ACADEMY</text>
          </svg>
          <h1>🔐 Verifica il tuo Account</h1>
        </div>
        <div class="content">
          <p style="font-size: 18px;">Ciao <strong>${name}</strong>,</p>
          <p>Benvenuto su CREDACTIVE! Per completare la registrazione e attivare il tuo account, inserisci questo codice di verifica:</p>
          
          <div class="code-box">
            <p style="margin: 0; font-size: 14px; color: #666; margin-bottom: 15px;">Il tuo codice di verifica è:</p>
            <div class="code">${verificationCode}</div>
          </div>
          
          <p style="font-size: 16px; margin: 30px 0;">Inserisci questo codice nella pagina di verifica per attivare il tuo account.</p>
          
          <div class="warning">
            <p style="margin: 0;"><strong>⏰ Attenzione:</strong> Questo codice è valido per 15 minuti. Se non lo utilizzi entro questo tempo, dovrai richiederne uno nuovo.</p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Se non hai richiesto questa registrazione, ignora questa email.</p>
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
CREDACTIVE - Verifica il tuo Account

Ciao ${rawName},

Benvenuto su CREDACTIVE! Per completare la registrazione, utilizza questo codice di verifica:

CODICE: ${verificationCode}

Questo codice è valido per 15 minuti.

Se non hai richiesto questa registrazione, ignora questa email.

Il Team CREDACTIVE
  `;

  await sendEmail({
    to: email,
    subject: "🔐 Verifica il tuo Account - CREDACTIVE",
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

  // Try to use database template first
  try {
    await sendTemplateEmail('password-reset', email, {
      email,
      resetUrl,
    });
    return;
  } catch (error: any) {
    // Only use fallback if template doesn't exist - propagate other errors (inactive, send failures, etc)
    if (!error.message?.includes('not found')) {
      throw error;
    }
    console.log('Template not found, using fallback password reset email');
  }

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
  recipients: Array<{ 
    email: string; 
    firstName?: string;
    htmlContent?: string;
    textContent?: string;
  }>,
  subject: string,
  htmlTemplate?: string,
  textTemplate?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    try {
      // Use personalized content if provided, otherwise use template
      let htmlContent = recipient.htmlContent;
      let textContent = recipient.textContent;
      
      console.log(`[Email] Sending to ${recipient.email}:`, {
        hasPersonalizedHtml: !!htmlContent,
        hasPlaceholders: htmlContent?.includes('{{') || false,
        contentPreview: htmlContent?.substring(0, 100)
      });
      
      if (!htmlContent && htmlTemplate) {
        const rawName = recipient.firstName || recipient.email.split('@')[0];
        const sanitizedName = sanitizeUserInput(rawName);
        const sanitizedEmail = sanitizeUserInput(recipient.email);
        
        htmlContent = htmlTemplate
          .replace(/{{firstName}}/g, sanitizedName)
          .replace(/{{email}}/g, sanitizedEmail);
        
        textContent = textTemplate
          ?.replace(/{{firstName}}/g, rawName)
          .replace(/{{email}}/g, recipient.email);
      }

      if (!htmlContent) {
        throw new Error("No HTML content provided");
      }

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

// Gamification Email Notifications

export async function sendBadgeEarnedEmail(
  email: string,
  firstName: string | undefined,
  badgeName: string,
  badgeDescription: string
): Promise<void> {
  const rawName = firstName || email.split('@')[0];
  const name = sanitizeUserInput(rawName);
  const safeBadgeName = sanitizeUserInput(badgeName);
  const safeBadgeDescription = sanitizeUserInput(badgeDescription);
  const baseUrl = process.env.BASE_URL || 
    (process.env.REPLIT_DOMAINS?.split(',')[0] 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
      : 'http://localhost:5000');

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
        .content { background: white; padding: 40px 30px; text-align: center; }
        .badge-icon { font-size: 80px; margin: 20px 0; }
        .badge-card { background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); color: white; padding: 30px; border-radius: 15px; margin: 20px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; }
        .footer-links a { color: #667eea; text-decoration: none; margin: 0 10px; }
        h1 { margin: 0; font-size: 28px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <svg class="logo" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
            <text x="100" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">CREDACTIVE</text>
            <text x="100" y="50" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.8)" text-anchor="middle">ACADEMY</text>
          </svg>
          <h1>🏆 Nuovo Badge Sbloccato!</h1>
        </div>
        <div class="content">
          <div class="badge-icon">🎖️</div>
          <p style="font-size: 18px;">Congratulazioni <strong>${name}</strong>!</p>
          <div class="badge-card">
            <h2 style="margin: 0 0 15px 0; font-size: 24px;">${safeBadgeName}</h2>
            <p style="margin: 0; font-size: 16px; opacity: 0.95;">${safeBadgeDescription}</p>
          </div>
          <p>Hai guadagnato un nuovo badge per i tuoi eccezionali risultati nella piattaforma!</p>
          <p>Continua così per sbloccare altri badge e riconoscimenti.</p>
          <a href="${baseUrl}/dashboard" class="cta-button">Vedi i Tuoi Badge</a>
          <p style="margin-top: 30px; color: #666;">A presto,<br><strong>Il Team CREDACTIVE</strong></p>
        </div>
        <div class="footer">
          <div class="footer-links">
            <a href="mailto:support@credactive.com">Supporto</a> |
            <a href="${baseUrl}/dashboard">Dashboard</a> |
            <a href="${baseUrl}/certificates">Certificati</a>
          </div>
          <p style="color: #999; font-size: 12px; margin: 15px 0;">
            © ${new Date().getFullYear()} CREDACTIVE ACADEMY. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
CREDACTIVE - Nuovo Badge Sbloccato!

Congratulazioni ${rawName}!

Hai guadagnato il badge: ${badgeName}
${badgeDescription}

Continua così per sbloccare altri badge e riconoscimenti.

Vedi i tuoi badge su: ${baseUrl}/dashboard

A presto,
Il Team CREDACTIVE
  `;

  await sendEmail({
    to: email,
    subject: `🏆 Nuovo Badge Sbloccato: ${badgeName}`,
    htmlContent,
    textContent,
  });
}

export async function sendLevelUpEmail(
  email: string,
  firstName: string | undefined,
  newLevel: number,
  totalPoints: number
): Promise<void> {
  const rawName = firstName || email.split('@')[0];
  const name = sanitizeUserInput(rawName);
  const baseUrl = process.env.BASE_URL || 
    (process.env.REPLIT_DOMAINS?.split(',')[0] 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
      : 'http://localhost:5000');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { width: 200px; height: 60px; margin-bottom: 20px; }
        .content { background: white; padding: 40px 30px; text-align: center; }
        .level-display { font-size: 120px; font-weight: bold; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 20px 0; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
        .stat-card { background: #f9f9f9; padding: 20px; border-radius: 10px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; }
        .footer-links a { color: #f5576c; text-decoration: none; margin: 0 10px; }
        h1 { margin: 0; font-size: 28px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <svg class="logo" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
            <text x="100" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">CREDACTIVE</text>
            <text x="100" y="50" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.8)" text-anchor="middle">ACADEMY</text>
          </svg>
          <h1>⭐ Complimenti! Sei Salito di Livello!</h1>
        </div>
        <div class="content">
          <p style="font-size: 18px;">Fantastico <strong>${name}</strong>!</p>
          <div class="level-display">${newLevel}</div>
          <p style="font-size: 24px; font-weight: bold; margin: 0;">LIVELLO ${newLevel}</p>
          <div class="stats-grid">
            <div class="stat-card">
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #f5576c;">${totalPoints.toLocaleString()}</p>
              <p style="margin: 5px 0 0 0; color: #666;">Punti Totali</p>
            </div>
            <div class="stat-card">
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #f5576c;">${newLevel}</p>
              <p style="margin: 5px 0 0 0; color: #666;">Livello Attuale</p>
            </div>
          </div>
          <p>Il tuo impegno e la tua dedizione stanno dando i loro frutti! Continua così per raggiungere nuovi traguardi.</p>
          <a href="${baseUrl}/leaderboard" class="cta-button">Vedi Classifica</a>
          <p style="margin-top: 30px; color: #666;">A presto,<br><strong>Il Team CREDACTIVE</strong></p>
        </div>
        <div class="footer">
          <div class="footer-links">
            <a href="mailto:support@credactive.com">Supporto</a> |
            <a href="${baseUrl}/dashboard">Dashboard</a> |
            <a href="${baseUrl}/leaderboard">Classifica</a>
          </div>
          <p style="color: #999; font-size: 12px; margin: 15px 0;">
            © ${new Date().getFullYear()} CREDACTIVE ACADEMY. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
CREDACTIVE - Sei Salito di Livello!

Fantastico ${rawName}!

Hai raggiunto il LIVELLO ${newLevel}!

Punti Totali: ${totalPoints.toLocaleString()}
Livello Attuale: ${newLevel}

Il tuo impegno sta dando i suoi frutti! Continua così per raggiungere nuovi traguardi.

Vedi la classifica: ${baseUrl}/leaderboard

A presto,
Il Team CREDACTIVE
  `;

  await sendEmail({
    to: email,
    subject: `⭐ Complimenti! Sei Salito al Livello ${newLevel}!`,
    htmlContent,
    textContent,
  });
}

export async function sendCertificateEarnedEmail(
  email: string,
  firstName: string | undefined,
  quizTitle: string,
  score: number,
  certificateId: string
): Promise<void> {
  const rawName = firstName || email.split('@')[0];
  const name = sanitizeUserInput(rawName);
  const safeQuizTitle = sanitizeUserInput(quizTitle);
  const baseUrl = process.env.BASE_URL || 
    (process.env.REPLIT_DOMAINS?.split(',')[0] 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
      : 'http://localhost:5000');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { width: 200px; height: 60px; margin-bottom: 20px; }
        .content { background: white; padding: 40px 30px; text-align: center; }
        .certificate-icon { font-size: 80px; margin: 20px 0; }
        .certificate-preview { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; border-radius: 15px; margin: 20px 0; border: 3px solid #38f9d7; }
        .score-display { font-size: 48px; font-weight: bold; margin: 10px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px; }
        .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; }
        .footer-links a { color: #43e97b; text-decoration: none; margin: 0 10px; }
        h1 { margin: 0; font-size: 28px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <svg class="logo" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
            <text x="100" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">CREDACTIVE</text>
            <text x="100" y="50" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.8)" text-anchor="middle">ACADEMY</text>
          </svg>
          <h1>📜 Certificato Ottenuto!</h1>
        </div>
        <div class="content">
          <div class="certificate-icon">🎓</div>
          <p style="font-size: 18px;">Eccellente lavoro <strong>${name}</strong>!</p>
          <div class="certificate-preview">
            <h2 style="margin: 0 0 15px 0; font-size: 24px;">${safeQuizTitle}</h2>
            <div class="score-display">${score}%</div>
            <p style="margin: 15px 0 0 0; font-size: 16px; opacity: 0.95;">Certificato di Completamento</p>
          </div>
          <p>Hai superato con successo il quiz e ottenuto il tuo certificato digitale!</p>
          <p>Scaricalo in PDF e condividilo con la tua rete professionale.</p>
          <a href="${baseUrl}/certificates" class="cta-button">Vedi Certificati</a>
          <a href="${baseUrl}/api/certificates/download/${certificateId}" class="cta-button" style="background: #667eea;">Scarica PDF</a>
          <p style="margin-top: 30px; color: #666;">A presto,<br><strong>Il Team CREDACTIVE</strong></p>
        </div>
        <div class="footer">
          <div class="footer-links">
            <a href="mailto:support@credactive.com">Supporto</a> |
            <a href="${baseUrl}/certificates">Certificati</a> |
            <a href="${baseUrl}/dashboard">Dashboard</a>
          </div>
          <p style="color: #999; font-size: 12px; margin: 15px 0;">
            © ${new Date().getFullYear()} CREDACTIVE ACADEMY. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
CREDACTIVE - Certificato Ottenuto!

Eccellente lavoro ${rawName}!

Hai superato il quiz: ${quizTitle}
Punteggio: ${score}%

Il tuo certificato digitale è pronto!

Scarica il PDF: ${baseUrl}/api/certificates/download/${certificateId}
Vedi tutti i certificati: ${baseUrl}/certificates

A presto,
Il Team CREDACTIVE
  `;

  await sendEmail({
    to: email,
    subject: `📜 Certificato Ottenuto: ${quizTitle}`,
    htmlContent,
    textContent,
  });
}
