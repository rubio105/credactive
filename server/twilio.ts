import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const replIdentity = process.env.REPL_IDENTITY;
  const webReplRenewal = process.env.WEB_REPL_RENEWAL;
  
  console.log('[Twilio] Environment check:', {
    hasHostname: !!hostname,
    hasReplIdentity: !!replIdentity,
    hasWebReplRenewal: !!webReplRenewal,
    hostnameValue: hostname,
    replIdentityLength: replIdentity?.length || 0,
    webReplRenewalLength: webReplRenewal?.length || 0
  });
  
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    console.error('[Twilio] Missing required environment variables');
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  if (!hostname) {
    console.error('[Twilio] REPLIT_CONNECTORS_HOSTNAME not found');
    throw new Error('REPLIT_CONNECTORS_HOSTNAME not configured');
  }

  const url = `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=twilio`;
  console.log('[Twilio] Fetching credentials from:', hostname);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    });

    if (!response.ok) {
      console.error('[Twilio] Connector API error:', response.status, response.statusText);
      throw new Error(`Connector API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('[Twilio] Connector response received:', {
      hasItems: !!data.items,
      itemsCount: data.items?.length || 0
    });

    connectionSettings = data.items?.[0];

    if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
      console.error('[Twilio] Invalid connection settings:', {
        hasSettings: !!connectionSettings,
        hasAccountSid: !!connectionSettings?.settings?.account_sid,
        hasApiKey: !!connectionSettings?.settings?.api_key,
        hasApiKeySecret: !!connectionSettings?.settings?.api_key_secret
      });
      throw new Error('Twilio not connected or missing credentials');
    }

    console.log('[Twilio] Credentials loaded successfully');
    
    return {
      accountSid: connectionSettings.settings.account_sid,
      apiKey: connectionSettings.settings.api_key,
      apiKeySecret: connectionSettings.settings.api_key_secret,
      phoneNumber: connectionSettings.settings.phone_number
    };
  } catch (error: any) {
    console.error('[Twilio] Error fetching credentials:', error.message);
    throw error;
  }
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
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
