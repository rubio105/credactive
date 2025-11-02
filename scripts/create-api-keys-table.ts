import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function createApiKeysTable() {
  try {
    console.log('Creating api_keys table...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        key_hash VARCHAR(255) NOT NULL UNIQUE,
        key_prefix VARCHAR(20) NOT NULL,
        scopes JSONB NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        last_used_at TIMESTAMP,
        request_count INTEGER DEFAULT 0,
        rate_limit_per_minute INTEGER DEFAULT 60,
        created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        revoked_at TIMESTAMP
      )
    `;
    
    console.log('Creating indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_api_key_hash ON api_keys(key_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_key_active ON api_keys(active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_key_created_by ON api_keys(created_by)`;
    
    console.log('✓ api_keys table created successfully!');
  } catch (error) {
    console.error('Error creating api_keys table:', error);
    throw error;
  }
}

createApiKeysTable();
