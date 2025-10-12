import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function addAiAnalysisColumns() {
  try {
    console.log('🔧 Adding ai_analysis JSONB columns...');
    
    // Add to user_health_reports
    await sql`
      ALTER TABLE user_health_reports 
      ADD COLUMN IF NOT EXISTS ai_analysis JSONB
    `;
    console.log('✅ Added ai_analysis to user_health_reports');
    
    // Add to prevention_documents  
    await sql`
      ALTER TABLE prevention_documents 
      ADD COLUMN IF NOT EXISTS ai_analysis JSONB
    `;
    console.log('✅ Added ai_analysis to prevention_documents');
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

addAiAnalysisColumns();
