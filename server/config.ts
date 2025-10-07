import { storage } from "./storage";

// Cache for API keys to avoid repeated database queries
const keyCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get an API key or configuration value. Checks database first, then falls back to environment variables.
 * Results are cached for 5 minutes to improve performance.
 * 
 * @param key The key name (e.g., "OPENAI_API_KEY", "STRIPE_SECRET_KEY")
 * @param envFallback Optional environment variable to use as fallback (defaults to key parameter)
 * @returns The API key value or undefined if not found
 */
export async function getApiKey(key: string, envFallback?: string): Promise<string | undefined> {
  // Check cache first
  const cached = keyCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value || undefined;
  }

  try {
    // Try to get from database
    const setting = await storage.getSetting(key);
    if (setting?.value) {
      // Cache the value
      keyCache.set(key, { value: setting.value, timestamp: Date.now() });
      return setting.value;
    }
  } catch (error) {
    console.warn(`[Config] Error fetching setting ${key} from database:`, error);
  }

  // Fallback to environment variable
  const envKey = envFallback || key;
  const envValue = process.env[envKey];
  
  if (envValue) {
    // Cache the env value too
    keyCache.set(key, { value: envValue, timestamp: Date.now() });
    return envValue;
  }

  return undefined;
}

/**
 * Clear the cache for a specific key or all keys
 */
export function clearApiKeyCache(key?: string) {
  if (key) {
    keyCache.delete(key);
  } else {
    keyCache.clear();
  }
}

/**
 * Get multiple API keys at once for efficiency
 */
export async function getApiKeys(keys: string[]): Promise<Record<string, string | undefined>> {
  const result: Record<string, string | undefined> = {};
  
  await Promise.all(
    keys.map(async (key) => {
      result[key] = await getApiKey(key);
    })
  );
  
  return result;
}
