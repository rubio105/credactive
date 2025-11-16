import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = process.env.DATABASE_URL;
const isLocalPostgres = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

let pool: any;
let db: any;

if (isLocalPostgres) {
  // Use standard PostgreSQL driver for local connections
  console.log('[Database] Using standard PostgreSQL driver for localhost');
  const { Pool: PgPool } = pg;
  pool = new PgPool({ 
    connectionString: databaseUrl,
    ssl: false // Disable SSL for localhost
  });
  db = pgDrizzle({ client: pool, schema });
} else {
  // Use Neon serverless driver for cloud connections
  console.log('[Database] Using Neon serverless driver for cloud connection');
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: databaseUrl });
  db = neonDrizzle({ client: pool, schema });
}

export { pool, db };