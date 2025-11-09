import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const replIdentity = process.env.REPL_IDENTITY;
  
  console.log('[Twilio] Environment check:', {
    hasHostname: !!hostname,
    hasReplIdentity: !!replIdentity,
    hostnameValue: hostname
  });
  
  const xReplitToken = replIdentity ? 'repl ' + replIdentity : null;

  if (!xReplitToken) {
    console.error('[Twilio] REPL_IDENTITY not found');
    throw new Error('Twilio connector not available - REPL_IDENTITY missing');
  }

  if (!hostname) {
    console.error('[Twilio] REPLIT_CONNECTORS_HOSTNAME not found');
    throw new Error('Twilio connector not available - REPLIT_CONNECTORS_HOSTNAME missing');
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
    console.log('[Twilio] Connector response:', {
      hasItems: !!data.items,
      itemsCount: data.items?.length || 0
    });

    connectionSettings = data.items?.[0];

    if (!connectionSettings?.settings) {
      console.error('[Twilio] No connection settings found');
      throw new Error('Twilio connector not configured - please set it up in Replit Connectors');
    }

    console.log('[Twilio] Connection settings:', {
      hasAccountSid: !!connectionSettings.settings.account_sid,
      hasApiKey: !!connectionSettings.settings.api_key,
      hasPhoneNumber: !!connectionSettings.settings.phone_number
    });

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
  return twilio(apiKey, apiKeySecret, { accountSid });
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
