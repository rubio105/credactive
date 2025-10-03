import { generateQuestions } from '../server/aiQuestionGenerator';
import { storage } from '../server/storage';

async function generate10k() {
  console.log('🚀 Generazione 10.000+ domande - Piano di distribuzione:\n');

  const plan = [
    // Quiz principali - massima copertura
    { id: 'e93caef7-e4b6-4c6e-b5f5-d08f8cf8d59c', title: 'CISSP - Security and Risk Management', category: 'CISSP', target: 1500, current: 171 },
    { id: '7393b2cf-a6c3-47a8-990f-b9409849d8b5', title: 'ISO 27001 - Information Security Management', category: 'ISO 27001', target: 1200, current: 129 },
    { id: 'c7617089-6e4b-4cbc-87a4-33b3e51114cf', title: 'GDPR - Fondamenti e Principi', category: 'GDPR', target: 1000, current: 91 },
    { id: '909a3f94-a226-42fb-b7e3-4a068b250eec', title: 'CISM - Information Security Governance', category: 'CISM', target: 800, current: 2 },
    
    // Quiz secondari - buona copertura
    { id: '531c6ac7-49d1-4272-afb2-7a39877c7f74', title: 'Data Protection & Privacy', category: 'Data Protection', target: 600, current: 1 },
    { id: '2a5a0886-8e69-454b-9dc0-0b05e158de22', title: 'AI Security & Ethics', category: 'AI Security', target: 600, current: 1 },
    { id: 'af532914-f7a6-43ea-adfc-7b41b44a93b6', title: 'Threat Intelligence & AI', category: 'Threat Intelligence', target: 600, current: 1 },
    { id: 'f623be6e-581a-465f-a63c-0015bb41f958', title: 'SecOps & AI Automation', category: 'SecOps', target: 600, current: 1 },
    { id: 'e2a1a127-b74b-4227-90be-1d6a980c7eff', title: 'Fondamenti di Cyber Security', category: 'Cyber Security', target: 600, current: 2 },
    { id: 'ba352ff3-f006-4696-9927-b6a8f07ecc2d', title: 'EU Privacy Law & ePrivacy', category: 'EU Privacy', target: 600, current: 1 },
    { id: '6eef456a-4aaf-497f-b3f5-ef0f092bcef3', title: 'Ethical Hacking - Certificazioni OSCP, CEH, GPEN', category: 'Ethical Hacking', target: 600, current: 10 },
    
    // Quiz specialistici
    { id: '3d0c7b85-cf76-4570-a6db-13e6f5c7a02b', title: 'NIS2 Directive - Fondamenti e Requisiti', category: 'NIS2', target: 500, current: 10 },
    { id: '7f682dc8-4b8b-4e74-b67a-3d21ac9e84e5', title: 'DORA - Digital Operational Resilience', category: 'DORA', target: 500, current: 10 },
    { id: '8c4e0c5a-19d4-4e6a-8ae2-dc89fe7b42aa', title: 'Open Innovation - Fondamenti e Strategie', category: 'Open Innovation', target: 400, current: 8 },
    { id: '3fbb8b09-6c8e-447f-bf8f-9a3cbf9e7d1f', title: 'Bilancio e Controllo di Gestione', category: 'Bilancio', target: 400, current: 8 },
    { id: 'd9f1e4b3-8c2a-4d7e-a1f5-2b3c4d5e6f7a', title: 'Insight Discovery - Test di Personalità', category: 'Insight Discovery', target: 300, current: 8 },
  ];

  const totalTarget = plan.reduce((sum, q) => sum + q.target, 0);
  const totalCurrent = plan.reduce((sum, q) => sum + q.current, 0);
  const toGenerate = plan.reduce((sum, q) => sum + (q.target - q.current), 0);

  console.log(`📊 Obiettivo totale: ${totalTarget} domande`);
  console.log(`📊 Attuale: ${totalCurrent} domande`);
  console.log(`📊 Da generare: ${toGenerate} domande\n`);

  for (const quiz of plan) {
    const needed = quiz.target - quiz.current;
    if (needed <= 0) {
      console.log(`✅ ${quiz.title}: già completo (${quiz.current}/${quiz.target})`);
      continue;
    }

    console.log(`\n📚 ${quiz.title}`);
    console.log(`   Obiettivo: ${quiz.target} | Attuali: ${quiz.current} | Da generare: ${needed}`);

    const batchSize = 50; // Batch più grandi per efficienza
    const batches = Math.ceil(needed / batchSize);

    for (let i = 0; i < batches; i++) {
      const questionsInBatch = Math.min(batchSize, needed - (i * batchSize));
      console.log(`   🔄 Batch ${i + 1}/${batches}: ${questionsInBatch} domande...`);

      try {
        const difficulty = i % 4 === 0 ? 'beginner' : i % 4 === 1 ? 'intermediate' : i % 4 === 2 ? 'advanced' : 'expert';
        const questions = await generateQuestions(quiz.title, quiz.category, questionsInBatch, difficulty);

        for (const q of questions) {
          const correctIndex = q.options.findIndex(opt => opt.isCorrect);
          const labels = ['A', 'B', 'C', 'D'];
          const correctAnswer = labels[correctIndex] || 'A';

          const optionsWithLabels = q.options.map((opt, idx) => ({
            label: labels[idx],
            text: opt.text,
            isCorrect: opt.isCorrect
          }));

          await storage.createQuestion({
            quizId: quiz.id,
            question: q.question,
            options: optionsWithLabels as any,
            correctAnswer,
            explanation: q.explanation,
            imageUrl: '',
            category: quiz.category,
          });
        }

        console.log(`   ✅ Batch ${i + 1} completato`);
      } catch (error: any) {
        console.error(`   ❌ Errore batch ${i + 1}:`, error?.message || error);
        // Continua con il prossimo batch invece di fermarsi
      }
    }

    console.log(`   🎯 ${quiz.title} completato`);
  }

  console.log(`\n🎉 Generazione completata!`);
  console.log(`📊 Controlla il database per il conteggio finale`);
  
  process.exit(0);
}

generate10k().catch((error) => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});
