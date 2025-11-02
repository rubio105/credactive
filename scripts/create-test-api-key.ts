#!/usr/bin/env tsx

import { db } from "../server/db";
import { apiKeys } from "@shared/schema";
import crypto from "crypto";

/**
 * Script per generare API key di test per sviluppo ProhMed
 * Uso: tsx scripts/create-test-api-key.ts
 */

async function createTestApiKey() {
  try {
    console.log("🔑 Generazione API key di test per ProhMed...\n");

    // Genera key casuale
    const randomBytes = crypto.randomBytes(32);
    const apiKey = `ciry_${randomBytes.toString('base64url')}`;
    
    // Hash per storage
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Prefix per visualizzazione (max 20 char totali)
    const keyPrefix = apiKey.substring(0, 17) + '...'; // 17 + 3 = 20 char

    // Inserisci nel database
    const [createdKey] = await db.insert(apiKeys).values({
      name: 'Test ProhMed Development',
      keyHash,
      keyPrefix,
      scopes: ['triage:read', 'triage:write'],
      active: true,
      rateLimitPerMinute: 120,
      createdBy: null, // NULL per API keys di test (non associata a utente specifico)
    }).returning();

    console.log("✅ API Key generata con successo!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📋 ID: ${createdKey.id}`);
    console.log(`📝 Nome: ${createdKey.name}`);
    console.log(`🔐 API Key (SALVA QUESTO):`);
    console.log(`\n   ${apiKey}\n`);
    console.log(`🔢 Prefix: ${keyPrefix}`);
    console.log(`📊 Scopes: ${createdKey.scopes.join(', ')}`);
    console.log(`⏱️  Rate Limit: ${createdKey.rateLimitPerMinute} req/min`);
    console.log(`✓  Attiva: ${createdKey.active}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("⚠️  IMPORTANTE: Questa chiave è visibile SOLO ORA!\n");
    console.log("💡 Per usarla nei test:");
    console.log(`   export CIRY_API_KEY='${apiKey}'`);
    console.log(`   ./test-prohmed-api.sh\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Errore generazione API key:", error);
    process.exit(1);
  }
}

createTestApiKey();
