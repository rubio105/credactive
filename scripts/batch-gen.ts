import { generateQuestions } from '../server/aiQuestionGenerator';
import { storage } from '../server/storage';
import { db } from '../server/db';
import { questions } from '../shared/schema';
import { count, eq } from 'drizzle-orm';

async function batchGenerate() {
  const args = process.argv.slice(2);
  const quizId = args[0];
  const targetCount = parseInt(args[1] || '100');
  const quizTitle = args[2] || 'Quiz';
  const category = args[3] || 'General';

  console.log(`🔄 Generazione ${targetCount} domande per: ${quizTitle}`);

  // Conta domande esistenti
  const existing = await db.select({ count: count() }).from(questions).where(eq(questions.quizId, quizId));
  const currentCount = existing[0]?.count || 0;
  console.log(`   Attuali: ${currentCount}`);

  const batchSize = 30;
  const batches = Math.ceil(targetCount / batchSize);

  for (let i = 0; i < batches; i++) {
    const questionsInBatch = Math.min(batchSize, targetCount - (i * batchSize));
    console.log(`   Batch ${i + 1}/${batches}: ${questionsInBatch} domande...`);

    try {
      const difficulty = ['beginner', 'intermediate', 'advanced', 'expert'][i % 4] as any;
      const generatedQuestions = await generateQuestions(quizTitle, category, questionsInBatch, difficulty);

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
          quizId,
          question: q.question,
          options: optionsWithLabels as any,
          correctAnswer,
          explanation: q.explanation,
          imageUrl: '',
          category,
        });
      }

      console.log(`   ✅ Batch ${i + 1} completato`);
    } catch (error: any) {
      console.error(`   ❌ Errore:`, error?.message);
    }
  }

  const final = await db.select({ count: count() }).from(questions).where(eq(questions.quizId, quizId));
  console.log(`   🎯 Completato - Totale: ${final[0]?.count || 0}`);
}

batchGenerate().catch(console.error).finally(() => process.exit(0));
