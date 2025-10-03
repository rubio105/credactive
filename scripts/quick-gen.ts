import { generateQuestions } from '../server/aiQuestionGenerator';
import { storage } from '../server/storage';

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

async function quickGen() {
  const quizId = process.argv[2];
  const batchCount = parseInt(process.argv[3] || '20');
  
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) {
    console.error('Quiz non trovato');
    process.exit(1);
  }

  console.log(`📝 Generazione ${batchCount} domande: ${quiz.title}`);

  const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
  const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)] as any;

  const questions = await generateQuestions(quiz.title, quiz.category, batchCount, difficulty);

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
      domain: q.domain || '',
    });
  }

  console.log(`✅ Completato`);
}

quickGen().catch(console.error).finally(() => process.exit(0));
