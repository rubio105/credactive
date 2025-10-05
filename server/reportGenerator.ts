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
      correctAnswer: question.correctAnswer || '',
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

  // Detailed performance assessment
  if (score < 60) {
    recommendations.push(
      '📚 **Revisione Completa Necessaria**',
      'Il tuo punteggio indica la necessità di una preparazione più approfondita. Ecco un piano d\'azione consigliato:',
      '',
      '**Piano di Studio Consigliato:**',
      '1. Dedica almeno 2-3 settimane allo studio sistematico',
      '2. Studia un modulo alla volta, non passare al successivo finché non padroneggi il precedente',
      '3. Crea flashcard per i concetti chiave',
      '4. Ripeti il quiz solo dopo aver completato la revisione completa',
      ''
    );
  } else if (score < 75) {
    recommendations.push(
      '📖 **Buona Base, Necessari Affinamenti**',
      'Hai una comprensione discreta degli argomenti. Per raggiungere l\'eccellenza:',
      '',
      '**Prossimi Passi:**',
      '1. Focalizzati sulle aree deboli evidenziate sotto',
      '2. Dedica 1-2 ore al giorno di studio mirato su questi argomenti',
      '3. Pratica con quiz aggiuntivi nelle aree deboli',
      '4. Rivedi gli errori commessi per capire il ragionamento corretto',
      ''
    );
  } else if (score < 90) {
    recommendations.push(
      '✨ **Ottimo Livello, Un Ultimo Sforzo**',
      'Sei molto vicino all\'eccellenza! Per perfezionare la tua preparazione:',
      '',
      '**Ultimi Ritocchi:**',
      '1. Rivedi in dettaglio solo le aree critiche evidenziate',
      '2. Fai quiz di pratica avanzati per consolidare',
      '3. Approfondisci i casi d\'uso pratici e scenari reali',
      '4. Sei quasi pronto per la certificazione ufficiale',
      ''
    );
  } else {
    recommendations.push(
      '🎉 **Eccellente Padronanza degli Argomenti**',
      'Hai dimostrato una comprensione solida e completa. Sei pronto per il passo successivo!',
      '',
      '**Sei Pronto Per:**',
      '✓ Sostenere l\'esame di certificazione ufficiale',
      '✓ Applicare queste competenze in contesti professionali',
      '✓ Passare a moduli più avanzati o certificazioni correlate',
      ''
    );
  }

  if (weakAreas.length > 0) {
    recommendations.push('🎯 **Analisi Dettagliata Aree da Migliorare:**');
    recommendations.push('');
    
    weakAreas.slice(0, 3).forEach((area, index) => {
      const priority = index === 0 ? '🔴 PRIORITÀ ALTA' : index === 1 ? '🟡 PRIORITÀ MEDIA' : '🟢 PRIORITÀ BASSA';
      const performanceLevel = area.percentage < 50 ? 'Critica' : area.percentage < 70 ? 'Insufficiente' : 'Da Rafforzare';
      
      recommendations.push(`**${priority} - ${area.category}**`);
      recommendations.push(`├─ Performance: ${performanceLevel} (${area.percentage}% corrette, ${area.wrongCount}/${area.totalCount} errori)`);
      
      // Specific recommendations based on category/topic
      const categoryAdvice = getCategorySpecificAdvice(area.category, quiz.title);
      if (categoryAdvice) {
        recommendations.push(`├─ ${categoryAdvice.study}`);
        recommendations.push(`├─ ${categoryAdvice.practice}`);
        recommendations.push(`└─ ${categoryAdvice.resources}`);
      } else {
        recommendations.push(`├─ Studio: Rivedi teoria e definizioni di base`);
        recommendations.push(`├─ Pratica: Risolvi esercizi specifici su questo argomento`);
        recommendations.push(`└─ Risorse: Consulta documentazione ufficiale e casi pratici`);
      }
      recommendations.push('');
    });
  }

  // Quiz-specific strategic recommendations
  if (quiz.title.includes('CISSP')) {
    recommendations.push(
      '📌 **Consigli Specifici CISSP:**',
      '• Studia gli 8 domini in ordine di priorità in base ai tuoi risultati',
      '• Focalizzati sul pensiero manageriale, non solo tecnico',
      '• Memorizza definizioni chiave e acronimi (RTO, RPO, BCP, etc.)',
      '• Pratica con scenari "cosa faresti se..." per sviluppare il pensiero critico',
      '• Rivedi i framework: NIST, ISO 27001, COBIT nelle aree deboli'
    );
  } else if (quiz.title.includes('CISM')) {
    recommendations.push(
      '📌 **Consigli Specifici CISM:**',
      '• Concentrati sulla governance e il ruolo del security manager',
      '• Studia i processi di risk management end-to-end',
      '• Comprendi come comunicare i rischi al management',
      '• Rivedi incident response planning e business continuity',
      '• Pratica con scenari di gestione delle crisi e decision-making'
    );
  } else if (quiz.title.includes('GDPR') || quiz.title.includes('Privacy')) {
    recommendations.push(
      '📌 **Consigli Specifici GDPR/Privacy:**',
      '• Memorizza gli articoli chiave del GDPR (6, 9, 15-22, 32-36)',
      '• Comprendi i 6 principi base del trattamento dati (art. 5)',
      '• Studia i diritti degli interessati e come applicarli praticamente',
      '• Rivedi le basi giuridiche per il trattamento e quando usarle',
      '• Pratica con casi reali: DPIA, data breach notification, trasferimenti extra-UE'
    );
  } else if (quiz.title.includes('ISO 27001')) {
    recommendations.push(
      '📌 **Consigli Specifici ISO 27001:**',
      '• Studia l\'Annex A: tutti i 114 controlli e quando applicarli',
      '• Comprendi il ciclo PDCA applicato all\'ISMS',
      '• Rivedi il risk assessment e risk treatment',
      '• Studia le clausole obbligatorie (4-10) in profondità',
      '• Pratica con scenari di implementazione ISMS da zero'
    );
  } else if (quiz.title.includes('NIS2')) {
    recommendations.push(
      '📌 **Consigli Specifici NIS2:**',
      '• Distingui tra soggetti essenziali e importanti e i loro obblighi',
      '• Studia i requisiti di cybersecurity risk management',
      '• Memorizza i tempi di notifica incidenti (24h early warning, 72h report)',
      '• Comprendi supply chain security e third-party risk',
      '• Rivedi le sanzioni e il framework di enforcement'
    );
  } else if (quiz.title.includes('DORA')) {
    recommendations.push(
      '📌 **Consigli Specifici DORA:**',
      '• Focalizzati su ICT risk management per enti finanziari',
      '• Studia i requisiti di resilienza operativa digitale',
      '• Comprendi testing (TLPT - Threat-Led Penetration Testing)',
      '• Rivedi third-party ICT service provider management',
      '• Studia information sharing arrangements e oversight'
    );
  }

  return recommendations.join('\n');
}

function getCategorySpecificAdvice(category: string, quizTitle: string): { study: string; practice: string; resources: string } | null {
  const categoryLower = category.toLowerCase();
  
  // CISSP specific categories
  if (categoryLower.includes('security and risk management')) {
    return {
      study: 'Studio: Approfondisci CIA Triad, governance, compliance, legal e etica',
      practice: 'Pratica: Casi di risk assessment e business impact analysis',
      resources: 'Risorse: NIST RMF, ISO 31000, framework di compliance'
    };
  }
  if (categoryLower.includes('asset security')) {
    return {
      study: 'Studio: Classificazione dati, data retention, privacy protection',
      practice: 'Pratica: Scenari di data lifecycle e handling requirements',
      resources: 'Risorse: Standard ISO 27001 Annex A.8, data classification schemes'
    };
  }
  if (categoryLower.includes('security architecture')) {
    return {
      study: 'Studio: Modelli di sicurezza (Bell-LaPadula, Biba), crittografia, PKI',
      practice: 'Pratica: Design di architetture sicure, scelta algoritmi crypto',
      resources: 'Risorse: NIST SP 800-53, security design principles'
    };
  }
  if (categoryLower.includes('communication and network')) {
    return {
      study: 'Studio: Protocolli di rete sicuri, VPN, wireless security, network segmentation',
      practice: 'Pratica: Design di architetture di rete sicure, troubleshooting',
      resources: 'Risorse: TCP/IP guide, RFC per protocolli sicuri, wireless standards'
    };
  }
  if (categoryLower.includes('identity and access')) {
    return {
      study: 'Studio: AAA (Authentication, Authorization, Accounting), SSO, federation, RBAC/ABAC',
      practice: 'Pratica: Implementazione IAM, access control models, identity federation',
      resources: 'Risorse: NIST SP 800-63, OAuth/OIDC specs, SAML documentation'
    };
  }
  
  // GDPR specific categories
  if (categoryLower.includes('principi') || categoryLower.includes('principles')) {
    return {
      study: 'Studio: Art. 5 GDPR - 6 principi fondamentali del trattamento',
      practice: 'Pratica: Applica principi a casi concreti (minimizzazione, limitazione finalità)',
      resources: 'Risorse: Linee guida EDPB, decisioni Garante Privacy'
    };
  }
  if (categoryLower.includes('diritti') || categoryLower.includes('rights')) {
    return {
      study: 'Studio: Art. 15-22 GDPR - Diritti degli interessati e come esercitarli',
      practice: 'Pratica: Gestione richieste accesso, cancellazione, portabilità',
      resources: 'Risorse: Template risposta SAR, procedure standard settore'
    };
  }
  if (categoryLower.includes('basi giuridiche') || categoryLower.includes('lawful')) {
    return {
      study: 'Studio: Art. 6 e 9 GDPR - 6 basi giuridiche e categorie particolari',
      practice: 'Pratica: Scegli base corretta per diversi scenari di trattamento',
      resources: 'Risorse: Linee guida EDPB su consenso, legittimo interesse'
    };
  }
  
  // ISO 27001 specific categories
  if (categoryLower.includes('controlli') || categoryLower.includes('controls')) {
    return {
      study: 'Studio: Annex A ISO 27001 - 114 controlli organizzati in 14 domini',
      practice: 'Pratica: Mapping controlli a rischi specifici, gap analysis',
      resources: 'Risorse: ISO 27002 implementation guidance, CIS Controls mapping'
    };
  }
  if (categoryLower.includes('risk') || categoryLower.includes('rischi')) {
    return {
      study: 'Studio: Metodologie di risk assessment (qualitativo, quantitativo)',
      practice: 'Pratica: Calcola SLE, ALE, ROI dei controlli, risk treatment',
      resources: 'Risorse: ISO 27005, NIST SP 800-30, FAIR methodology'
    };
  }
  
  // Network/Technical categories
  if (categoryLower.includes('network') || categoryLower.includes('rete')) {
    return {
      study: 'Studio: Segmentazione rete, firewall, IDS/IPS, secure protocols',
      practice: 'Pratica: Design VLAN, ACL, network monitoring, packet analysis',
      resources: 'Risorse: Wireshark tutorials, network hardening guides'
    };
  }
  if (categoryLower.includes('cryptography') || categoryLower.includes('crittografia')) {
    return {
      study: 'Studio: Algoritmi simmetrici/asimmetrici, hash, PKI, key management',
      practice: 'Pratica: Selezione algoritmi per use case, implementazione TLS/SSL',
      resources: 'Risorse: NIST crypto standards, OpenSSL documentation'
    };
  }
  
  return null;
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
      id?: string;
      label?: string;
      text: string;
      color?: string;
    }>;
    
    // Find the selected option by matching answer (case-insensitive) against both id and label
    const selectedOption = options.find((opt) => {
      const optId = opt.id?.toLowerCase() || '';
      const optLabel = opt.label?.toLowerCase() || '';
      const answer = ans.answer?.toLowerCase() || '';
      return optId === answer || optLabel === answer;
    });
    
    // Normalize color to lowercase before counting
    if (selectedOption?.color) {
      const normalizedColor = selectedOption.color.toLowerCase();
      if (colorCounts[normalizedColor] !== undefined) {
        colorCounts[normalizedColor]++;
      }
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
