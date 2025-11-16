import twilio from 'twilio';

let connectionSettings: any;

async function getCredentialsFromReplit() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  if (!hostname) {
    throw new Error('REPLIT_CONNECTORS_HOSTNAME not found');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Replit Connectors API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  connectionSettings = data.items?.[0];

  if (!connectionSettings) {
    throw new Error('Twilio connection not found in Replit');
  }

  if (!connectionSettings.settings?.account_sid || !connectionSettings.settings?.api_key || !connectionSettings.settings?.api_key_secret) {
    throw new Error('Twilio connection missing required credentials');
  }

  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

function getCredentialsFromEnv() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !apiKey || !apiKeySecret) {
    throw new Error('Missing required Twilio environment variables (TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET)');
  }

  return {
    accountSid,
    apiKey,
    apiKeySecret,
    phoneNumber
  };
}

async function getCredentials() {
  try {
    // Try Replit integration first (when in Replit environment)
    return await getCredentialsFromReplit();
  } catch (replitError: any) {
    console.log(`[Twilio] Replit connection failed, falling back to env vars: ${replitError.message}`);
    
    // Fallback to environment variables (for production deployment)
    try {
      return getCredentialsFromEnv();
    } catch (envError: any) {
      console.error(`[Twilio] Failed to load credentials from env vars: ${envError.message}`);
      throw new Error('Twilio credentials not available from Replit integration or environment variables');
    }
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

export async function getTwilioVideoCredentials() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return {
    accountSid,
    apiKeySid: apiKey,
    apiKeySecret
  };
}
