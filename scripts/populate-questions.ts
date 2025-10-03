import { generateQuestions } from '../server/aiQuestionGenerator';
import { storage } from '../server/storage';

async function populateQuestions() {
  console.log('🚀 Starting question generation...\n');

  const quizzes = [
    { id: '80c1ea64-a7b5-4aef-b2b7-7129d6e4844d', title: 'CISSP - Security and Risk Management', category: 'CISSP', count: 500 },
    { id: '7393b2cf-a6c3-47a8-990f-b9409849d8b5', title: 'ISO 27001 - Information Security Management', category: 'ISO 27001', count: 200 },
    { id: 'c7617089-6e4b-4cbc-87a4-33b3e51114cf', title: 'GDPR - Fondamenti e Principi', category: 'GDPR', count: 200 },
    { id: '909a3f94-a226-42fb-b7e3-4a068b250eec', title: 'CISM - Information Security Governance', category: 'CISM', count: 200 },
    { id: '2a5a0886-8e69-454b-9dc0-0b05e158de22', title: 'AI Security & Ethics', category: 'CISSP', count: 100 },
    { id: 'a3a65aae-8d4f-45b3-bbd2-ca12a1a52370', title: 'NIS2 Directive - Fondamenti e Requisiti', category: 'NIS2', count: 150 },
    { id: 'dbbbfdfb-e50a-48be-9732-24e6557a568d', title: 'DORA - Digital Operational Resilience', category: 'DORA', count: 150 },
    { id: '5d239efa-9095-4034-97a7-fafda5e45478', title: 'Ethical Hacking - Certificazioni OSCP, CEH, GPEN', category: 'OSCP', count: 150 },
    { id: 'e2a1a127-b74b-4227-90be-1d6a980c7eff', title: 'Fondamenti di Cyber Security', category: 'CISSP', count: 100 },
    { id: '531c6ac7-49d1-4272-afb2-7a39877c7f74', title: 'Data Protection & Privacy', category: 'GDPR', count: 100 },
  ];

  for (const quiz of quizzes) {
    console.log(`\n📚 Generating ${quiz.count} questions for "${quiz.title}"...`);
    
    try {
      // Generate questions in batches of 20
      const batchSize = 20;
      const batches = Math.ceil(quiz.count / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const questionsInBatch = Math.min(batchSize, quiz.count - (i * batchSize));
        console.log(`  Batch ${i + 1}/${batches}: ${questionsInBatch} questions...`);
        
        const questions = await generateQuestions(
          quiz.title,
          quiz.category,
          questionsInBatch,
          'intermediate'
        );

        // Save to database
        for (const q of questions) {
          // Find the correct answer and get its label (A, B, C, D)
          const correctIndex = q.options.findIndex(opt => opt.isCorrect);
          const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
          const correctAnswer = labels[correctIndex] || 'A';
          
          // Create options with labels
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
        
        console.log(`  ✓ Batch ${i + 1} completed`);
      }
      
      console.log(`✅ Completed "${quiz.title}" - ${quiz.count} questions generated`);
    } catch (error) {
      console.error(`❌ Error generating questions for "${quiz.title}":`, error);
    }
  }

  console.log('\n🎉 Question generation complete!');
  process.exit(0);
}

populateQuestions().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
