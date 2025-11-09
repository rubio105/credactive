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
  const replIdentity = process.env.REPL_IDENTITY;
  
  console.log('[Twilio] Env vars not found, trying Replit Connectors:', {
    hasHostname: !!hostname,
    hasReplIdentity: !!replIdentity
  });
  
  const xReplitToken = replIdentity ? 'repl ' + replIdentity : null;

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
    const fromNumber = await getTwilioFromPhoneNumber();
    
    // WhatsApp requires "whatsapp:" prefix
    const fromWhatsApp = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    const result = await client.messages.create({
      body: message,
      from: fromWhatsApp,
      to: toWhatsApp
    });
    
    console.log(`[WhatsApp] Message sent successfully: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error('[WhatsApp] Error sending message:', error.message);
    return { success: false, error: error.message };
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
