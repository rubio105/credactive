import { generateQuestions } from '../server/aiQuestionGenerator';
import { storage } from '../server/storage';
import { db } from '../server/db';
import { questions } from '../shared/schema';
import { count as sqlCount, eq } from 'drizzle-orm';

const quizzes = [
  { id: '80c1ea64-a7b5-4aef-b2b7-7129d6e4844d', title: 'CISSP - Security and Risk Management', category: 'CISSP', target: 1500 },
  { id: '7393b2cf-a6c3-47a8-990f-b9409849d8b5', title: 'ISO 27001 - Information Security Management', category: 'ISO 27001', target: 1200 },
  { id: 'c7617089-6e4b-4cbc-87a4-33b3e51114cf', title: 'GDPR - Fondamenti e Principi', category: 'GDPR', target: 1000 },
  { id: '909a3f94-a226-42fb-b7e3-4a068b250eec', title: 'CISM - Information Security Governance', category: 'CISM', target: 800 },
  { id: '531c6ac7-49d1-4272-afb2-7a39877c7f74', title: 'Data Protection & Privacy', category: 'Data Protection', target: 700 },
  { id: '2a5a0886-8e69-454b-9dc0-0b05e158de22', title: 'AI Security & Ethics', category: 'AI Security', target: 700 },
  { id: 'af532914-f7a6-43ea-adfc-7b41b44a93b6', title: 'Threat Intelligence & AI', category: 'Threat Intelligence', target: 700 },
  { id: 'f623be6e-581a-465f-a63c-0015bb41f958', title: 'SecOps & AI Automation', category: 'SecOps', target: 700 },
  { id: 'e2a1a127-b74b-4227-90be-1d6a980c7eff', title: 'Fondamenti di Cyber Security', category: 'Cyber Security', target: 700 },
  { id: 'ba352ff3-f006-4696-9927-b6a8f07ecc2d', title: 'EU Privacy Law & ePrivacy', category: 'EU Privacy', target: 700 },
  { id: '5d239efa-9095-4034-97a7-fafda5e45478', title: 'Ethical Hacking - OSCP, CEH, GPEN', category: 'Ethical Hacking', target: 700 },
  { id: 'a3a65aae-8d4f-45b3-bbd2-ca12a1a52370', title: 'NIS2 Directive', category: 'NIS2', target: 600 },
  { id: 'dbbbfdfb-e50a-48be-9732-24e6557a568d', title: 'DORA', category: 'DORA', target: 600 },
  { id: '0cec1d40-39bd-4051-83df-a89d299097db', title: 'Open Innovation', category: 'Open Innovation', target: 500 },
  { id: '885df8fc-ba1b-43fa-9e28-08ddc5b7bb24', title: 'Bilancio e Controllo', category: 'Bilancio', target: 500 },
  { id: '495fc7e3-222e-47bf-9246-8d84623954bb', title: 'Insight Discovery', category: 'Insight Discovery', target: 400 },
];

async function generateWithRetry(quiz: typeof quizzes[0], batchSize: number, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const difficulties: any[] = ['beginner', 'intermediate', 'advanced', 'expert'];
      const difficulty = difficulties[Math.floor(Math.random() * 4)];
      
      const generatedQuestions = await generateQuestions(quiz.title, quiz.category, batchSize, difficulty);

      for (const q of generatedQuestions) {
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
      
      return generatedQuestions.length;
    } catch (error: any) {
      console.error(`  ⚠️  Tentativo ${attempt}/${maxRetries} fallito:`, error?.message);
      if (attempt === maxRetries) {
        console.error(`  ❌ Quiz fallito dopo ${maxRetries} tentativi`);
        return 0;
      }
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
    }
  }
  return 0;
}

async function resilientGenerate() {
  const batchSize = parseInt(process.argv[2] || '50');
  const rounds = parseInt(process.argv[3] || '20');
  
  console.log(`🚀 Generazione resiliente: ${batchSize} domande/quiz × ${rounds} round\n`);
  
  for (let round = 1; round <= rounds; round++) {
    console.log(`\n🔄 Round ${round}/${rounds}`);
    
    for (const quiz of quizzes) {
      // Check current count
      const result = await db.select({ count: sqlCount() }).from(questions).where(eq(questions.quizId, quiz.id));
      const current = result[0]?.count || 0;
      
      if (current >= quiz.target) {
        continue; // Skip completed quizzes
      }
      
      const needed = quiz.target - current;
      const toGenerate = Math.min(batchSize, needed);
      
      console.log(`  📝 ${quiz.title}: +${toGenerate} (${current}/${quiz.target})`);
      const generated = await generateWithRetry(quiz, toGenerate);
      
      if (generated > 0) {
        console.log(`  ✅ Salvate ${generated} domande`);
      }
    }
    
    // Total count
    const totalResult = await db.select({ count: sqlCount() }).from(questions);
    const total = totalResult[0]?.count || 0;
    console.log(`\n📊 Totale database: ${total} domande`);
    
    if (total >= 10000) {
      console.log('\n🎉 Obiettivo 10.000 raggiunto!');
      break;
    }
  }
  
  process.exit(0);
}

resilientGenerate().catch(error => {
  console.error('❌ Errore:', error);
  process.exit(1);
});
