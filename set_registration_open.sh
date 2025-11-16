#!/bin/bash
# Script da eseguire sul server Hetzner per abilitare registrazione libera

cd /var/www/credactive

cat > /tmp/set_invite_false.js << 'EOF'
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false 
});

async function setInviteModeToFalse() {
  const client = await pool.connect();
  
  try {
    console.log('📝 Impostazione INVITE_ONLY_MODE a false (registrazione libera)...');
    
    const result = await client.query(`
      INSERT INTO settings (key, value, description, category, is_active, created_at, updated_at)
      VALUES ('INVITE_ONLY_MODE', 'false', 'Modalità registrazione solo su invito medico', 'features', true, NOW(), NOW())
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = 'false',
        description = 'Modalità registrazione solo su invito medico',
        category = 'features',
        updated_at = NOW()
      RETURNING key, value, description;
    `);
    
    console.log('✅ Setting aggiornato:', result.rows[0]);
    console.log('\n🎉 Registrazione LIBERA abilitata!');
    console.log('💡 Puoi riattivare la modalità "Solo su Invito" dal pannello Admin → Impostazioni');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setInviteModeToFalse();
EOF

node /tmp/set_invite_false.js
rm /tmp/set_invite_false.js
