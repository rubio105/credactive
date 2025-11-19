import twilio from 'twilio';

let cachedCredentials: any = null;

async function getCredentials() {
  if (cachedCredentials) {
    return cachedCredentials;
  }

  const directAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const directAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const directPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (directAccountSid && directAuthToken && directPhoneNumber) {
    console.log('[Twilio] Using direct env vars (TWILIO_*)');
    cachedCredentials = {
      accountSid: directAccountSid,
      authToken: directAuthToken,
      phoneNumber: directPhoneNumber,
      useDirect: true
    };
    return cachedCredentials;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;
  
  console.log('[Twilio] Env vars not found, trying Replit Connectors:', {
    hasHostname: !!hostname,
    hasToken: !!xReplitToken
  });

  if (!xReplitToken || !hostname) {
    console.error('[Twilio] Neither direct env vars nor Replit Connectors available');
    throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables.');
  }

  const url = `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=twilio`;
  console.log('[Twilio] Fetching credentials from connector API');

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Twilio] Connector API error:', response.status, errorText);
      throw new Error(`Connector API returned ${response.status}`);
    }

    const data = await response.json();
    const connectionSettings = data.items?.[0];

    if (!connectionSettings?.settings) {
      throw new Error('Twilio connector not configured');
    }

    console.log('[Twilio] Using Replit Connectors');
    cachedCredentials = {
      accountSid: connectionSettings.settings.account_sid,
      apiKey: connectionSettings.settings.api_key,
      apiKeySecret: connectionSettings.settings.api_key_secret,
      phoneNumber: connectionSettings.settings.phone_number,
      useDirect: false
    };
    return cachedCredentials;
  } catch (error: any) {
    console.error('[Twilio] Error fetching credentials:', error.message);
    throw error;
  }
}

export async function getTwilioClient() {
  const creds = await getCredentials();
  if (creds.useDirect) {
    return twilio(creds.accountSid, creds.authToken);
  }
  return twilio(creds.apiKey, creds.apiKeySecret, { accountSid: creds.accountSid });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const client = await getTwilioClient();
    let fromNumber = await getTwilioFromPhoneNumber();
    
    // If no phone number configured, use Twilio Sandbox WhatsApp number
    if (!fromNumber || fromNumber === 'Not configured') {
      fromNumber = '+14155238886'; // Twilio Sandbox WhatsApp number
      console.log('[WhatsApp] Using Twilio Sandbox WhatsApp number');
    }
    
    // WhatsApp requires "whatsapp:" prefix
    const fromWhatsApp = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    console.log(`[WhatsApp] Sending message from ${fromWhatsApp} to ${toWhatsApp}`);
    
    const result = await client.messages.create({
      body: message,
      from: fromWhatsApp,
      to: toWhatsApp
    });
    
    console.log(`[WhatsApp] Message sent successfully: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error('[WhatsApp] Error sending message:', error);
    console.error('[WhatsApp] Error details:', {
      message: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    });
    
    // Provide more detailed error messages
    let errorMessage = error.message;
    if (error.code === 21408) {
      errorMessage = 'Numero WhatsApp non autorizzato. Se stai usando il Sandbox, devi prima inviare "join [codice]" al numero +14155238886';
    } else if (error.code === 21211) {
      errorMessage = 'Numero destinatario non valido. Verifica il formato (+39...)';
    } else if (error.code === 63007) {
      errorMessage = 'Numero WhatsApp mittente non configurato correttamente';
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function sendWhatsAppTemplate(
  to: string, 
  contentSid: string, 
  contentVariables: Record<string, string>
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const client = await getTwilioClient();
    let fromNumber = await getTwilioFromPhoneNumber();
    
    // If no phone number configured, use Twilio Sandbox WhatsApp number
    if (!fromNumber || fromNumber === 'Not configured') {
      fromNumber = '+14155238886'; // Twilio Sandbox WhatsApp number
      console.log('[WhatsApp Template] Using Twilio Sandbox WhatsApp number');
    }
    
    // WhatsApp requires "whatsapp:" prefix
    const fromWhatsApp = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    console.log(`[WhatsApp Template] Sending template ${contentSid} from ${fromWhatsApp} to ${toWhatsApp}`);
    console.log(`[WhatsApp Template] Variables:`, contentVariables);
    
    const result = await client.messages.create({
      from: fromWhatsApp,
      to: toWhatsApp,
      contentSid: contentSid,
      contentVariables: JSON.stringify(contentVariables)
    });
    
    console.log(`[WhatsApp Template] Template sent successfully: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error('[WhatsApp Template] Error sending template:', error);
    console.error('[WhatsApp Template] Error details:', {
      message: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    });
    
    // Provide more detailed error messages
    let errorMessage = error.message;
    if (error.code === 21408) {
      errorMessage = 'Numero WhatsApp non autorizzato. Se stai usando il Sandbox, devi prima inviare "join [codice]" al numero +14155238886';
    } else if (error.code === 21211) {
      errorMessage = 'Numero destinatario non valido. Verifica il formato (+39...)';
    } else if (error.code === 63007) {
      errorMessage = 'Numero WhatsApp mittente non configurato correttamente';
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
    
    console.log(`[SMS] Message sent successfully: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error('[SMS] Error sending message:', error.message);
    return { success: false, error: error.message };
  }
}
