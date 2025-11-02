#!/usr/bin/env tsx

import { db } from "../server/db";
import { apiKeys } from "@shared/schema";
import crypto from "crypto";

/**
 * Script per generare API key di PRODUZIONE per ProhMed
 * Uso: tsx scripts/create-prohmed-production-key.ts
 */

async function createProhMedProductionKey() {
  try {
    console.log("🔑 Generazione API key di PRODUZIONE per ProhMed...\n");

    // Genera key casuale (32 bytes = 256 bit di entropia)
    const randomBytes = crypto.randomBytes(32);
    const apiKey = `ciry_${randomBytes.toString('base64url').substring(0, 43)}`; // 43 caratteri random
    
    // Hash SHA-256 per storage sicuro
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Prefix per visualizzazione (primi 12 caratteri)
    const keyPrefix = apiKey.substring(0, 12);

    // Inserisci nel database
    const [createdKey] = await db.insert(apiKeys).values({
      name: 'ProhMed Production',
      keyHash,
      keyPrefix,
      scopes: ['triage:read', 'triage:write'],
      active: true,
      rateLimitPerMinute: 120, // 120 richieste al minuto per produzione
      createdBy: null, // NULL per API keys di sistema
    }).returning();

    console.log("✅ API Key PRODUZIONE generata con successo!\n");
    console.log("═".repeat(70));
    console.log("⚠️  IMPORTANTE: SALVA QUESTA CHIAVE - SI VEDE SOLO ORA! ⚠️");
    console.log("═".repeat(70));
    console.log(`\n🔐 API KEY (da inviare a ProhMed):\n`);
    console.log(`   ${apiKey}\n`);
    console.log("═".repeat(70));
    console.log(`📋 ID Database: ${createdKey.id}`);
    console.log(`📝 Nome: ${createdKey.name}`);
    console.log(`🔢 Prefix: ${keyPrefix}...`);
    console.log(`📊 Scopes: ${createdKey.scopes.join(', ')}`);
    console.log(`⏱️  Rate Limit: ${createdKey.rateLimitPerMinute} richieste/minuto`);
    console.log(`✓  Attiva: ${createdKey.active}`);
    console.log(`📅 Creata: ${new Date().toLocaleString('it-IT')}`);
    console.log("═".repeat(70));

    console.log("\n📤 Da inviare al team ProhMed:");
    console.log("   • Base URL: https://ciry.app");
    console.log("   • API Key: (quella mostrata sopra)");
    console.log("   • Documentazione: PROHMED_INTEGRATION.md");
    console.log("   • Testing Guide: TESTING_GUIDE.md\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Errore generazione API key:", error);
    process.exit(1);
  }
}

createProhMedProductionKey();
