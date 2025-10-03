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

// Insight Discovery specific interfaces and functions
interface ColorScore {
  color: string;
  name: string;
  count: number;
  percentage: number;
}

interface InsightProfile {
  dominantColor: ColorScore;
  secondaryColor: ColorScore;
  colorScores: ColorScore[];
  strengths: string[];
  developmentAreas: string[];
  workingStyle: string;
  communicationStyle: string;
  recommendations: string;
}

const colorNames: Record<string, string> = {
  red: 'Rosso Fuoco',
  yellow: 'Giallo Sole',
  green: 'Verde Terra',
  blue: 'Blu Freddo',
};

const colorTraits: Record<string, {
  strengths: string[];
  developmentAreas: string[];
  workingStyle: string;
  communicationStyle: string;
}> = {
  red: {
    strengths: [
      'Leadership naturale e capacità decisionale',
      'Orientamento ai risultati e focus sugli obiettivi',
      'Determinazione e coraggio nell\'affrontare sfide',
      'Capacità di agire rapidamente e prendere iniziativa',
    ],
    developmentAreas: [
      'Sviluppare maggiore pazienza e ascolto attivo',
      'Considerare le emozioni e i bisogni degli altri',
      'Delegare e coinvolgere il team nelle decisioni',
      'Gestire lo stress senza diventare troppo autoritari',
    ],
    workingStyle: 'Orientato all\'azione, competitivo e focalizzato sui risultati. Preferisce un ambiente dinamico con sfide da superare.',
    communicationStyle: 'Diretto, conciso e assertivo. Va dritto al punto e apprezza la franchezza.',
  },
  yellow: {
    strengths: [
      'Entusiasmo contagioso e capacità di motivare gli altri',
      'Creatività e pensiero innovativo',
      'Eccellenti capacità relazionali e networking',
      'Ottimismo e capacità di vedere opportunità',
    ],
    developmentAreas: [
      'Migliorare il focus e portare a termine i progetti',
      'Sviluppare maggiore attenzione ai dettagli',
      'Gestire il tempo in modo più strutturato',
      'Bilanciare l\'entusiasmo con la pianificazione',
    ],
    workingStyle: 'Creativo, collaborativo e orientato alle persone. Preferisce ambienti dinamici e sociali.',
    communicationStyle: 'Espressivo, narrativo e coinvolgente. Usa storie ed emozioni per connettersi.',
  },
  green: {
    strengths: [
      'Empatia e capacità di supportare gli altri',
      'Affidabilità e lealtà nel lungo termine',
      'Capacità di creare armonia e mediare conflitti',
      'Pazienza e costanza nel lavoro',
    ],
    developmentAreas: [
      'Sviluppare assertività e capacità di dire "no"',
      'Gestire meglio il cambiamento e l\'incertezza',
      'Esprimere le proprie opinioni con più fiducia',
      'Accelerare i tempi decisionali quando necessario',
    ],
    workingStyle: 'Collaborativo, stabile e orientato al team. Preferisce ambienti armoniosi e prevedibili.',
    communicationStyle: 'Empatico, paziente e attento. Ascolta attivamente e risponde con cura.',
  },
  blue: {
    strengths: [
      'Analisi approfondita e pensiero critico',
      'Precisione e attenzione ai dettagli',
      'Capacità di pianificazione e organizzazione',
      'Ricerca della qualità e dell\'eccellenza',
    ],
    developmentAreas: [
      'Sviluppare flessibilità e adattabilità',
      'Migliorare le competenze relazionali',
      'Gestire l\'ambiguità e l\'incertezza',
      'Bilanciare analisi con decisioni tempestive',
    ],
    workingStyle: 'Analitico, metodico e orientato alla qualità. Preferisce ambienti strutturati e ben organizzati.',
    communicationStyle: 'Preciso, basato sui fatti e dettagliato. Fornisce informazioni accurate.',
  },
};

export function generateInsightDiscoveryReport(
  attempt: UserQuizAttempt,
  questions: Question[]
): InsightProfile {
  const answers = attempt.answers as Array<{
    questionId: string;
    answer: string;
  }>;

  // Count color responses
  const colorCounts: Record<string, number> = {
    red: 0,
    yellow: 0,
    green: 0,
    blue: 0,
  };

  answers.forEach((ans) => {
    const question = questions.find((q) => q.id === ans.questionId);
    if (!question) return;

    const options = question.options as Array<{
      id: string;
      text: string;
      color: string;
    }>;
    const selectedOption = options.find((opt) => opt.id === ans.answer);
    
    if (selectedOption?.color && colorCounts[selectedOption.color] !== undefined) {
      colorCounts[selectedOption.color]++;
    }
  });

  const totalAnswers = answers.length;

  // Calculate color scores
  const colorScores: ColorScore[] = Object.entries(colorCounts)
    .map(([color, count]) => ({
      color,
      name: colorNames[color],
      count,
      percentage: Math.round((count / totalAnswers) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const dominantColor = colorScores[0];
  const secondaryColor = colorScores[1];

  // Get traits for dominant color
  const traits = colorTraits[dominantColor.color] || colorTraits.red;

  // Generate personalized recommendations
  const recommendations = generateInsightRecommendations(
    dominantColor,
    secondaryColor,
    colorScores
  );

  return {
    dominantColor,
    secondaryColor,
    colorScores,
    strengths: traits.strengths,
    developmentAreas: traits.developmentAreas,
    workingStyle: traits.workingStyle,
    communicationStyle: traits.communicationStyle,
    recommendations,
  };
}

function generateInsightRecommendations(
  dominant: ColorScore,
  secondary: ColorScore,
  allColors: ColorScore[]
): string {
  const recommendations: string[] = [];

  recommendations.push(
    `🎨 Il tuo profilo Insight Discovery mostra una forte energia ${dominant.name} (${dominant.percentage}%), combinata con ${secondary.name} (${secondary.percentage}%).`
  );

  recommendations.push(
    `\n✨ Questa combinazione ti rende una persona ${getCombinationTrait(dominant.color, secondary.color)}.`
  );

  recommendations.push('\n🎯 Per massimizzare il tuo potenziale:');
  
  if (dominant.percentage > 50) {
    recommendations.push(
      `  • Riconosci e valorizza la tua forte energia ${dominant.name}, ma cerca di integrare anche le altre energie`
    );
  }

  const lowestColor = allColors[allColors.length - 1];
  if (lowestColor.percentage < 15) {
    recommendations.push(
      `  • Sviluppa maggiormente la tua energia ${lowestColor.name} (${lowestColor.percentage}%) per un profilo più equilibrato`
    );
  }

  recommendations.push(
    '\n💡 Suggerimenti pratici:',
    `  • Quando lavori con persone ${secondary.name}, valorizzi le similarità`,
    `  • Quando lavori con persone ${lowestColor.name}, cerca di adattare il tuo approccio`,
    '  • Usa i tuoi punti di forza ma resta consapevole delle aree di sviluppo'
  );

  return recommendations.join('\n');
}

function getCombinationTrait(dominant: string, secondary: string): string {
  const combinations: Record<string, Record<string, string>> = {
    red: {
      yellow: 'dinamica, energica e orientata sia ai risultati che alle persone',
      green: 'determinata ma attenta al benessere del team',
      blue: 'strategica e orientata ai risultati con precisione analitica',
    },
    yellow: {
      red: 'entusiasta e orientata all\'azione con grande energia',
      green: 'socievole, empatica e focalizzata sulle relazioni',
      blue: 'creativa ma con attenzione ai dettagli e alla qualità',
    },
    green: {
      red: 'supportiva ma capace di prendere decisioni quando necessario',
      yellow: 'collaborativa, positiva e orientata al team',
      blue: 'affidabile, metodica e attenta alla qualità',
    },
    blue: {
      red: 'analitica e orientata ai risultati con decisioni basate sui dati',
      yellow: 'precisa ma con apertura alla creatività',
      green: 'metodica, paziente e focalizzata sulla qualità',
    },
  };

  return combinations[dominant]?.[secondary] || 'unica nel suo approccio al lavoro e alle relazioni';
}
