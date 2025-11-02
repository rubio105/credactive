import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { storage } from './storage';
import type { ApiKey } from '@shared/schema';

// Extend Express Request to include apiKey
declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKey;
    }
  }
}

// In-memory rate limiting (token bucket algorithm)
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

// Clean up old buckets every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [keyHash, bucket] of rateLimitBuckets.entries()) {
    if (bucket.lastRefill < fiveMinutesAgo) {
      rateLimitBuckets.delete(keyHash);
    }
  }
}, 5 * 60 * 1000);

/**
 * API Key Authentication Middleware
 * 
 * Validates the X-API-Key header and attaches the API key to the request.
 * Returns 401 if missing, 403 if invalid/expired.
 */
export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKeyHeader = req.header('X-API-Key');
    
    if (!apiKeyHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing X-API-Key header',
      });
    }
    
    // Hash the provided key to lookup in database
    const keyHash = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');
    
    // Validate API key
    const apiKey = await storage.validateApiKey(keyHash);
    
    if (!apiKey) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid or expired API key',
      });
    }
    
    // Check if key has required scope for this endpoint
    const requiredScope = getRequiredScope(req.path, req.method);
    const scopes = apiKey.scopes as string[];
    
    if (requiredScope && !hasRequiredScope(scopes, requiredScope)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `API key does not have required scope: ${requiredScope}`,
      });
    }
    
    // Attach API key to request for downstream use
    req.apiKey = apiKey;
    
    // Update usage stats asynchronously (don't block request)
    storage.updateApiKeyUsage(keyHash).catch(err => {
      console.error('Failed to update API key usage:', err);
    });
    
    next();
  } catch (error: any) {
    console.error('API key authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Rate Limiting Middleware (Token Bucket)
 * 
 * Enforces per-API-key rate limits using token bucket algorithm.
 * Returns 429 if rate limit exceeded.
 */
export function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.apiKey;
  
  if (!apiKey) {
    // Should never happen if authenticateApiKey runs first
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required for rate limiting',
    });
  }
  
  const keyHash = crypto.createHash('sha256')
    .update(req.header('X-API-Key') || '')
    .digest('hex');
  
  const limit = apiKey.rateLimitPerMinute || 60;
  const now = Date.now();
  
  // Get or create bucket
  let bucket = rateLimitBuckets.get(keyHash);
  
  if (!bucket) {
    bucket = {
      tokens: limit,
      lastRefill: now,
    };
    rateLimitBuckets.set(keyHash, bucket);
  }
  
  // Refill tokens based on time elapsed (1 token per second, max = limit)
  const secondsElapsed = (now - bucket.lastRefill) / 1000;
  const tokensToAdd = Math.floor(secondsElapsed * (limit / 60)); // Refill rate: limit tokens per 60 seconds
  
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }
  
  // Check if request can proceed
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens).toString());
    res.setHeader('X-RateLimit-Reset', new Date(bucket.lastRefill + 60000).toISOString());
    
    next();
  } else {
    // Rate limit exceeded
    const retryAfter = Math.ceil((1 - bucket.tokens) * (60 / limit));
    
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', new Date(bucket.lastRefill + 60000).toISOString());
    res.setHeader('Retry-After', retryAfter.toString());
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Maximum ${limit} requests per minute.`,
      retryAfter,
    });
  }
}

/**
 * Helper: Determine required scope based on API path and HTTP method
 */
function getRequiredScope(path: string, method: string): string | null {
  if (path.startsWith('/api/v1/triage')) {
    // Check if read or write operation
    const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    return isWriteOperation ? 'triage:write' : 'triage:read';
  }
  
  // Add more scope mappings as needed
  return null;
}

/**
 * Helper: Check if API key has required scope
 * Supports exact match and wildcard (e.g., triage:* grants all triage operations)
 */
function hasRequiredScope(scopes: string[], requiredScope: string): boolean {
  // Check for exact match
  if (scopes.includes(requiredScope)) {
    return true;
  }
  
  // Check for wildcard (e.g., "triage:*" grants all "triage:read" and "triage:write")
  const [requiredResource] = requiredScope.split(':');
  if (scopes.includes(`${requiredResource}:*`)) {
    return true;
  }
  
  // Legacy support: if key has both :read and :write, it's equivalent to :*
  const hasRead = scopes.includes(`${requiredResource}:read`);
  const hasWrite = scopes.includes(`${requiredResource}:write`);
  if (hasRead && hasWrite) {
    return true;
  }
  
  return false;
}
