import type { UserQuizAttempt, Quiz, Question } from "@shared/schema";

interface AnswerDetail {
  questionId: string;
  question: string;
  category?: string | null;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface WeakArea {
  category: string;
  wrongCount: number;
  totalCount: number;
  percentage: number;
}

interface ReportData {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  passStatus: 'pass' | 'fail';
  weakAreas: WeakArea[];
  strengths: string[];
  recommendations: string;
  detailedAnswers: AnswerDetail[];
}

export function generateQuizReport(
  attempt: UserQuizAttempt,
  quiz: Quiz,
  questions: Question[]
): ReportData {
  const answers = attempt.answers as Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
  }>;

  // Group answers by category to find weak areas
  const categoryStats: Record<string, { correct: number; total: number }> = {};
  const detailedAnswers: AnswerDetail[] = [];

  answers.forEach((ans) => {
    const question = questions.find((q) => q.id === ans.questionId);
    if (!question) return;

    const category = question.category || 'General';

    if (!categoryStats[category]) {
      categoryStats[category] = { correct: 0, total: 0 };
    }

    categoryStats[category].total++;
    if (ans.isCorrect) {
      categoryStats[category].correct++;
    }

    detailedAnswers.push({
      questionId: question.id,
      question: question.question,
      category: question.category,
      userAnswer: ans.answer,
      correctAnswer: question.correctAnswer,
      isCorrect: ans.isCorrect,
    });
  });

  // Identify weak areas (< 70% correct)
  const weakAreas: WeakArea[] = Object.entries(categoryStats)
    .map(([category, stats]) => ({
      category,
      wrongCount: stats.total - stats.correct,
      totalCount: stats.total,
      percentage: Math.round((stats.correct / stats.total) * 100),
    }))
    .filter((area) => area.percentage < 70)
    .sort((a, b) => a.percentage - b.percentage);

  // Identify strengths (>= 80% correct)
  const strengths: string[] = Object.entries(categoryStats)
    .filter(([, stats]) => (stats.correct / stats.total) * 100 >= 80)
    .map(([category]) => category);

  // Generate recommendations
  const recommendations = generateRecommendations(
    weakAreas,
    attempt.score,
    quiz
  );

  // Determine pass/fail based on quiz difficulty
  const passThreshold = getPassThreshold(quiz.difficulty);
  const passStatus = attempt.score >= passThreshold ? 'pass' : 'fail';

  return {
    score: attempt.score,
    correctAnswers: attempt.correctAnswers,
    totalQuestions: attempt.totalQuestions,
    timeSpent: attempt.timeSpent,
    passStatus,
    weakAreas,
    strengths,
    recommendations,
    detailedAnswers,
  };
}

function getPassThreshold(difficulty: string): number {
  switch (difficulty) {
    case 'beginner':
      return 60;
    case 'intermediate':
      return 70;
    case 'advanced':
    case 'expert':
      return 75;
    default:
      return 70;
  }
}

function generateRecommendations(
  weakAreas: WeakArea[],
  score: number,
  quiz: Quiz
): string {
  const recommendations: string[] = [];

  if (score < 60) {
    recommendations.push(
      '📚 Si consiglia di rivedere completamente il materiale di studio prima di riprovare il quiz.'
    );
  } else if (score < 75) {
    recommendations.push(
      '📖 Buon risultato! Concentrati sui seguenti argomenti per migliorare ulteriormente.'
    );
  } else if (score < 90) {
    recommendations.push(
      '✨ Ottimo lavoro! Con un po\' più di studio su alcuni argomenti specifici, sarai pronto per la certificazione.'
    );
  } else {
    recommendations.push(
      '🎉 Eccellente! Hai dimostrato una solida comprensione degli argomenti. Sei pronto per la certificazione!'
    );
  }

  if (weakAreas.length > 0) {
    recommendations.push('\n🎯 Aree da approfondire:');
    weakAreas.slice(0, 3).forEach((area) => {
      recommendations.push(
        `  • ${area.category}: ${area.wrongCount} errori su ${area.totalCount} domande (${area.percentage}% corretto)`
      );
    });
  }

  // Specific recommendations based on quiz type
  if (quiz.title.includes('CISSP')) {
    recommendations.push(
      '\n📌 Per CISSP, focalizzati sui domini in cui hai ottenuto punteggi bassi. Rileggi le normative e i framework correlati.'
    );
  } else if (quiz.title.includes('CISM')) {
    recommendations.push(
      '\n📌 Per CISM, concentrati sulla governance e sulla gestione dei rischi nelle aree deboli identificate.'
    );
  } else if (quiz.title.includes('GDPR') || quiz.title.includes('Privacy')) {
    recommendations.push(
      '\n📌 Per normative privacy, studia gli articoli specifici e le casistiche pratiche nelle aree critiche.'
    );
  } else if (quiz.title.includes('ISO')) {
    recommendations.push(
      '\n📌 Per ISO 27001/27002, rivedi i controlli e le best practices per le aree con performance inferiori.'
    );
  }

  return recommendations.join('\n');
}
