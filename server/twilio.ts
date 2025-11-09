import twilio from 'twilio';

function getCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  console.log('[Twilio] Checking credentials:', {
    hasAccountSid: !!accountSid,
    hasAuthToken: !!authToken,
    hasPhoneNumber: !!phoneNumber
  });

  if (!accountSid || !authToken || !phoneNumber) {
    console.error('[Twilio] Missing required environment variables');
    throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in Replit Secrets.');
  }

  console.log('[Twilio] Credentials loaded successfully');
  
  return {
    accountSid,
    authToken,
    phoneNumber
  };
}

export function getTwilioClient() {
  const { accountSid, authToken } = getCredentials();
  return twilio(accountSid, authToken);
}

export function getTwilioFromPhoneNumber() {
  const { phoneNumber } = getCredentials();
  return phoneNumber;
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const client = getTwilioClient();
    const fromNumber = getTwilioFromPhoneNumber();
    
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
    const client = getTwilioClient();
    const fromNumber = getTwilioFromPhoneNumber();
    
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
