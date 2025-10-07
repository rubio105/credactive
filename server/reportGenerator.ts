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
  profileType: string; // e.g. "121 Riformatore Direttore Creativo"
  strengths: string[];
  developmentAreas: string[];
  workingStyle: string;
  communicationStyle: string;
  recommendations: string;
  methodologicalIntroduction: string;
  oppositeType: {
    description: string;
    differences: string[];
    workingTogether: string[];
  };
  teamValue: string[];
  communicationObstacles: string[];
  detailedAnalysis: {
    profileDescription: string;
    behavioralPatterns: string[];
    stressManagement: string[];
    leadershipStyle: string[];
    teamInteraction: string[];
    decisionMaking: string[];
    conflictResolution: string[];
    motivationalDrivers: string[];
    learningPreferences: string[];
    careerGuidance: string[];
    actionPlan: string[];
  };
}

const colorNames: Record<string, string> = {
  red: 'Rosso Fuoco',
  yellow: 'Giallo Sole',
  green: 'Verde Terra',
  blue: 'Blu Freddo',
};

// Methodological introduction about Insights Discovery color theory
function generateMethodologicalIntroduction(): string {
  return `Le origini della teoria dei tipi umani risalgono al V° secolo a.C., quando Ippocrate individuò quattro distinte "energie", manifestate da individui diversi. Il Sistema Insights Discovery si basa su un modello inizialmente messo a punto dallo psicologo svizzero Carl Gustav Jung. Questo modello fu pubblicato per la prima volta nella sua opera del 1921 intitolata "Psychological Types" (Tipi Psicologici) e sviluppato in scritti successivi.

Il lavoro di Jung sui Tipi e sulle preferenze è stato da allora adottato come fondamento per la comprensione delle persone ed è stato oggetto di studio per migliaia di ricercatori, fino ai giorni nostri. Rifacendosi alle tipologie descritte da Jung, il Sistema Insights Discovery offre un quadro di riferimento per la comprensione e lo sviluppo di sé.

**I Quattro Colori dell'Energia**

Il sistema identifica quattro energie fondamentali, rappresentate dai colori:

• **Rosso Fuoco** - Energia dell'azione, della determinazione e del focus sui risultati. Chi esprime principalmente energia rossa è orientato agli obiettivi, competitivo e diretto nelle relazioni.

• **Giallo Sole** - Energia della socialità, dell'entusiasmo e della creatività. Chi esprime principalmente energia gialla è comunicativo, ottimista e orientato alle relazioni.

• **Verde Terra** - Energia della stabilità, dell'empatia e del supporto. Chi esprime principalmente energia verde è paziente, leale e orientato all'armonia.

• **Blu Freddo** - Energia dell'analisi, della precisione e della qualità. Chi esprime principalmente energia blu è metodico, riflessivo e orientato all'eccellenza.

Varie ricerche mostrano che una buona conoscenza di sé, dei propri punti di forza e dei propri lati deboli mette le persone in grado di sviluppare efficaci strategie di interazione e le aiuta nel rispondere alle richieste del loro ambiente professionale e personale.`;
}

// Generate opposite type description
function generateOppositeType(dominantColor: ColorScore): { description: string; differences: string[]; workingTogether: string[] } {
  const opposites: Record<string, { color: string; name: string; desc: string; diffs: string[]; working: string[] }> = {
    red: {
      color: 'green',
      name: 'Verde Terra',
      desc: 'Il tuo tipo opposto è caratterizzato da energia Verde Terra. Mentre tu sei orientato all\'azione e ai risultati rapidi, il tipo opposto privilegia la riflessione, la stabilità e l\'armonia nelle relazioni.',
      diffs: [
        'Approccio decisionale: Tu decidi rapidamente, il tipo opposto preferisce ponderare a lungo',
        'Ritmo di lavoro: Tu cerchi velocità ed efficienza, il tipo opposto valorizza la costanza e la pazienza',
        'Focus relazionale: Tu punti ai risultati, il tipo opposto si concentra sul benessere delle persone',
        'Gestione del cambiamento: Tu abbracci il cambiamento, il tipo opposto lo affronta con cautela'
      ],
      working: [
        'Riconosci che la pazienza del tipo Verde può bilanciare la tua impulsività',
        'Valuta la loro capacità di creare armonia quando tu spingi troppo verso i risultati',
        'Coinvolgili nelle decisioni che impattano le persone, non solo sui processi',
        'Rallenta il ritmo quando lavori con loro per permettere una riflessione adeguata'
      ]
    },
    yellow: {
      color: 'blue',
      name: 'Blu Freddo',
      desc: 'Il tuo tipo opposto è caratterizzato da energia Blu Freddo. Mentre tu sei spontaneo, entusiasta e orientato alle relazioni, il tipo opposto privilegia l\'analisi, la precisione e la qualità metodica.',
      diffs: [
        'Stile comunicativo: Tu sei espressivo e narrativo, il tipo opposto è conciso e preciso',
        'Approccio ai progetti: Tu generi idee creative, il tipo opposto le perfeziona nei dettagli',
        'Relazioni sociali: Tu sei estroverso e socievole, il tipo opposto è riservato e selettivo',
        'Focus operativo: Tu vedi il quadro generale, il tipo opposto si concentra sui dettagli'
      ],
      working: [
        'Apprezza la loro capacità di portare rigore e qualità alle tue idee creative',
        'Fornisci loro tempo per analizzare prima di prendere decisioni',
        'Riconosci che la loro riservatezza non significa disinteresse',
        'Bilancia il tuo entusiasmo con la loro attenzione ai dettagli per risultati ottimali'
      ]
    },
    green: {
      color: 'red',
      name: 'Rosso Fuoco',
      desc: 'Il tuo tipo opposto è caratterizzato da energia Rosso Fuoco. Mentre tu sei paziente, riflessivo e orientato all\'armonia, il tipo opposto privilegia l\'azione rapida, la competizione e i risultati immediati.',
      diffs: [
        'Velocità decisionale: Tu rifletti a lungo, il tipo opposto decide rapidamente',
        'Approccio ai conflitti: Tu cerchi mediazione, il tipo opposto affronta direttamente',
        'Priorità: Tu valorizzi le relazioni, il tipo opposto si concentra sui risultati',
        'Cambiamento: Tu preferisci stabilità, il tipo opposto cerca costantemente sfide nuove'
      ],
      working: [
        'Riconosci che la loro spinta all\'azione può bilanciare la tua tendenza a riflettere troppo',
        'Esprimi le tue necessità di processo quando loro vogliono accelerare',
        'Apprezza la loro capacità di prendere decisioni difficili che tu potresti evitare',
        'Porta la tua prospettiva sulle persone per bilanciare il loro focus sui risultati'
      ]
    },
    blue: {
      color: 'yellow',
      name: 'Giallo Sole',
      desc: 'Il tuo tipo opposto è caratterizzato da energia Giallo Sole. Mentre tu sei analitico, preciso e orientato alla qualità, il tipo opposto privilegia la creatività, l\'entusiasmo e le relazioni spontanee.',
      diffs: [
        'Stile lavorativo: Tu sei metodico e strutturato, il tipo opposto è spontaneo e flessibile',
        'Comunicazione: Tu sei conciso e preciso, il tipo opposto è espressivo e narrativo',
        'Decision making: Tu basi decisioni sui dati, il tipo opposto si affida all\'intuizione',
        'Socialità: Tu sei selettivo nelle relazioni, il tipo opposto è naturalmente socievole'
      ],
      working: [
        'Apprezza la loro capacità di portare energia e creatività ai progetti complessi',
        'Bilancia la tua analisi con il loro pensiero laterale per soluzioni innovative',
        'Riconosci che la loro spontaneità può accelerare processi che tu potresti rallentare',
        'Condividi i tuoi standard di qualità per dare struttura alle loro idee creative'
      ]
    }
  };

  const opposite = opposites[dominantColor.color] || opposites.red;
  return {
    description: opposite.desc,
    differences: opposite.diffs,
    workingTogether: opposite.working
  };
}

// Generate team value contributions
function generateTeamValue(dominantColor: ColorScore, secondaryColor: ColorScore): string[] {
  const teamValues: Record<string, string[]> = {
    red: [
      'Porta energia e determinazione per superare ostacoli e raggiungere obiettivi ambiziosi',
      'Prende decisioni rapide nei momenti critici, guidando il team verso l\'azione',
      'Stabilisce obiettivi chiari e mantiene il focus sui risultati misurabili',
      'Sfida lo status quo e spinge il team fuori dalla zona di comfort',
      'Assume la leadership naturalmente nelle situazioni di crisi o cambiamento'
    ],
    yellow: [
      'Crea un\'atmosfera positiva e motivante che aumenta il morale del team',
      'Facilita la comunicazione e costruisce ponti tra persone e reparti diversi',
      'Genera idee creative e innovative per risolvere problemi complessi',
      'Promuove la collaborazione e il coinvolgimento di tutti i membri',
      'Porta entusiasmo contagioso che ispira gli altri a dare il meglio'
    ],
    green: [
      'Fornisce supporto costante e affidabile ai colleghi, creando un ambiente di fiducia',
      'Media i conflitti e promuove l\'armonia nelle relazioni di team',
      'Ascolta attivamente le preoccupazioni di tutti, garantendo che ogni voce sia sentita',
      'Mantiene la stabilità durante i periodi di cambiamento e incertezza',
      'Costruisce relazioni durature basate su lealtà e reciproco rispetto'
    ],
    blue: [
      'Garantisce qualità e precisione attraverso analisi approfondite e attenzione ai dettagli',
      'Porta rigore metodologico e struttura ai processi del team',
      'Identifica potenziali problemi prima che si manifestino grazie all\'analisi preventiva',
      'Stabilisce standard elevati che spingono il team verso l\'eccellenza',
      'Fornisce dati e fatti concreti per supportare decisioni informate'
    ]
  };

  const primary = teamValues[dominantColor.color] || teamValues.red;
  const secondary = teamValues[secondaryColor.color] || teamValues.yellow;
  
  // Combine unique values from both colors
  const combined = [...primary.slice(0, 3), ...secondary.slice(0, 2)];
  return combined;
}

// Generate communication obstacles
function generateCommunicationObstacles(dominantColor: ColorScore): string[] {
  const obstacles: Record<string, string[]> = {
    red: [
      'Potresti apparire troppo diretto o brusco, ferendo involontariamente i sentimenti altrui',
      'La tua impazienza può essere percepita come mancanza di interesse per le opinioni degli altri',
      'Potresti interrompere le persone prima che finiscano di parlare, nella fretta di passare all\'azione',
      'Il tuo focus esclusivo sui risultati può far sentire gli altri come mezzi piuttosto che persone',
      'Potresti non dedicare tempo sufficiente all\'ascolto attivo e all\'empatia',
      'La tua tendenza a dominare le conversazioni può intimidire colleghi più riservati'
    ],
    yellow: [
      'Potresti parlare troppo e non lasciare spazio sufficiente agli altri per esprimersi',
      'La tua tendenza a divagare può far perdere il focus della discussione',
      'Potresti sembrare superficiale quando passi rapidamente da un argomento all\'altro',
      'Il tuo ottimismo eccessivo può minimizzare preoccupazioni legittime degli altri',
      'Potresti promettere più di quanto puoi mantenere nell\'entusiasmo del momento',
      'La tua avversione ai dettagli può frustrare chi necessita di precisione'
    ],
    green: [
      'Potresti evitare i conflitti necessari, lasciando problemi irrisolti',
      'La tua riluttanza a dire "no" può portare a impegni eccessivi',
      'Potresti non esprimere le tue vere opinioni per paura di disturbare l\'armonia',
      'La tua lentezza nel processo decisionale può frustrare chi vuole azione rapida',
      'Potresti sembrare passivo o poco assertivo in situazioni che richiedono fermezza',
      'La tua sensibilità alle critiche può essere percepita come difensività'
    ],
    blue: [
      'Potresti apparire freddo o distaccato, mancando di calore umano nelle interazioni',
      'La tua insistenza sui dettagli può rallentare eccessivamente le conversazioni',
      'Potresti essere percepito come eccessivamente critico o perfezionista',
      'La tua preferenza per comunicazioni scritte può limitare le interazioni personali',
      'Potresti analizzare eccessivamente invece di rispondere emotivamente quando appropriato',
      'La tua riservatezza può essere interpretata come mancanza di interesse o coinvolgimento'
    ]
  };

  return obstacles[dominantColor.color] || obstacles.red;
}

// Generate 72-type profile name based on color combination and percentages
function generateProfileType(dominant: ColorScore, secondary: ColorScore, third: ColorScore): string {
  // Calculate position in the 72-type wheel (0-71)
  // Each quadrant has 18 subtypes based on intensity and blend
  const colorToQuadrant: Record<string, number> = {
    red: 0,    // 0-17
    yellow: 18, // 18-35
    green: 36,  // 36-53
    blue: 54    // 54-71
  };
  
  const basePosition = colorToQuadrant[dominant.color] || 0;
  
  // Calculate subtype within quadrant (0-17) based on secondary color influence
  let subPosition = 0;
  if (dominant.percentage > 50) {
    // Pure dominant color - position 8-9 (center of quadrant)
    subPosition = 9;
  } else if (secondary.percentage > 20) {
    // Blend with secondary color
    const secondaryQuadrant = colorToQuadrant[secondary.color] || 0;
    const direction = (secondaryQuadrant - basePosition + 72) % 72;
    if (direction < 36) {
      // Blend towards next color (clockwise)
      subPosition = Math.floor((secondary.percentage / dominant.percentage) * 9);
    } else {
      // Blend towards previous color (counter-clockwise)
      subPosition = 17 - Math.floor((secondary.percentage / dominant.percentage) * 9);
    }
  }
  
  const typeNumber = basePosition + subPosition + 1; // 1-72
  
  // Generate descriptive name based on dominant and secondary colors
  const profileNames: Record<string, Record<string, string>> = {
    red: {
      red: 'Leader Visionario',
      yellow: 'Innovatore Dinamico',
      green: 'Direttore Empatico',
      blue: 'Stratega Decisionale'
    },
    yellow: {
      red: 'Comunicatore Energico',
      yellow: 'Creativo Entusiasta',
      green: 'Facilitatore Sociale',
      blue: 'Innovatore Analitico'
    },
    green: {
      red: 'Collaboratore Proattivo',
      yellow: 'Mediatore Ottimista',
      green: 'Custode dell\'Armonia',
      blue: 'Supporto Metodico'
    },
    blue: {
      red: 'Analista Orientato ai Risultati',
      yellow: 'Ricercatore Creativo',
      green: 'Esperto Paziente',
      blue: 'Perfezionista Sistematico'
    }
  };
  
  const profileName = profileNames[dominant.color]?.[secondary.color] || 'Profilo Equilibrato';
  
  return `${typeNumber} ${profileName}`;
}

const colorTraits: Record<string, {
  strengths: string[];
  developmentAreas: string[];
  workingStyle: string;
  communicationStyle: string;
  behavioralPatterns: string[];
  stressManagement: string[];
  leadershipStyle: string[];
  teamInteraction: string[];
  decisionMaking: string[];
  conflictResolution: string[];
  motivationalDrivers: string[];
  learningPreferences: string[];
  careerGuidance: string[];
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
    behavioralPatterns: [
      'Prendi decisioni rapide basandoti sull\'istinto e sull\'esperienza',
      'Affronti le sfide con determinazione, vedendole come opportunità',
      'Tendi a prendere il controllo in situazioni di crisi',
      'Ti concentri sui risultati finali piuttosto che sui processi'
    ],
    stressManagement: [
      'Sotto stress, diventi più direttivo e impaziente',
      'Strategia efficace: Canalizza l\'energia in attività fisica o nuovi progetti',
      'Evita di isolarti - condividi le sfide con il team',
      'Pratica tecniche di rilassamento per bilanciare l\'intensità'
    ],
    leadershipStyle: [
      'Guidi con l\'esempio, mostrando determinazione e coraggio',
      'Stabilisci obiettivi chiari e sfidanti per il team',
      'Sei efficace nelle situazioni di crisi e cambiamento rapido',
      'Sviluppa: coinvolgimento del team e ascolto delle loro prospettive'
    ],
    teamInteraction: [
      'Sei il catalizzatore che spinge il team all\'azione',
      'Valorizzi l\'efficienza e l\'orientamento ai risultati',
      'Potresti essere percepito come troppo diretto o impaziente',
      'Riconosci e celebra i successi del team, non solo i risultati'
    ],
    decisionMaking: [
      'Decidi rapidamente, confidando nell\'istinto e nell\'esperienza',
      'Valuti le opzioni in base al potenziale impatto sui risultati',
      'Sei disposto ad assumerti rischi calcolati',
      'Bilancia velocità decisionale con considerazione dell\'impatto sulle persone'
    ],
    conflictResolution: [
      'Affronti i conflitti direttamente, senza evitarli',
      'Cerchi soluzioni rapide che permettano di andare avanti',
      'Potresti tendere a imporre la tua visione',
      'Sviluppa: ascolto delle diverse prospettive prima di decidere'
    ],
    motivationalDrivers: [
      'Sfide ambiziose e obiettivi che sembrano impossibili',
      'Riconoscimento dei risultati ottenuti',
      'Autonomia nel prendere decisioni',
      'Opportunità di guidare e fare la differenza'
    ],
    learningPreferences: [
      'Apprendi meglio attraverso l\'azione e l\'esperienza diretta',
      'Preferisci formazione pratica, orientata ai risultati',
      'Ti piacciono simulazioni e casi studio concreti',
      'Cerca opportunità di applicare immediatamente ciò che impari'
    ],
    careerGuidance: [
      'Eccelli in ruoli di leadership e gestione con obiettivi chiari',
      'Ambienti ideali: startup, turnaround, progetti di trasformazione',
      'Ruoli adatti: CEO, direttore operativo, sales manager, imprenditore',
      'Sviluppa competenze di coaching e mentoring per crescere come leader'
    ]
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
    behavioralPatterns: [
      'Generi idee creative e innovative con facilità',
      'Coinvolgi gli altri con entusiasmo e energia positiva',
      'Preferisci varietà e nuove esperienze alla routine',
      'Costruisci reti ampie di relazioni personali e professionali'
    ],
    stressManagement: [
      'Sotto stress, potresti diventare dispersivo o evitare i problemi',
      'Strategia efficace: Condividi le preoccupazioni con persone di fiducia',
      'Mantieni una routine di base per bilanciare la spontaneità',
      'Usa la creatività come valvola di sfogo per lo stress'
    ],
    leadershipStyle: [
      'Ispiri il team con visione ed entusiasmo',
      'Crei un ambiente di lavoro positivo e motivante',
      'Sei efficace nel cambiamento e nell\'innovazione',
      'Sviluppa: follow-through e accountability per i risultati'
    ],
    teamInteraction: [
      'Sei l\'anima del team, creando energia e coesione',
      'Faciliti la comunicazione e la collaborazione',
      'Potresti mancare di focus sui dettagli operativi',
      'Assicurati di tradurre l\'entusiasmo in azioni concrete'
    ],
    decisionMaking: [
      'Consideri l\'impatto emotivo e relazionale delle decisioni',
      'Cerchi input e consenso dal gruppo',
      'Ti basi sull\'intuizione e sulle possibilità future',
      'Bilancia creatività con analisi pratica dei rischi'
    ],
    conflictResolution: [
      'Cerchi di sdrammatizzare e trovare punti in comune',
      'Usi l\'empatia e le relazioni per mediare',
      'Potresti evitare confronti difficili',
      'Sviluppa: capacità di affrontare conflitti anche scomodi'
    ],
    motivationalDrivers: [
      'Riconoscimento pubblico e apprezzamento',
      'Opportunità di essere creativi e innovativi',
      'Lavoro con persone positive e stimolanti',
      'Varietà e nuove sfide che mantengono alto l\'interesse'
    ],
    learningPreferences: [
      'Apprendi meglio in contesti interattivi e di gruppo',
      'Preferisci formazione coinvolgente con elementi creativi',
      'Ti piacciono discussioni, workshop e brainstorming',
      'Cerca contenuti ispiranti e applicazioni innovative'
    ],
    careerGuidance: [
      'Eccelli in ruoli creativi, di comunicazione e relazione',
      'Ambienti ideali: marketing, comunicazione, innovazione, vendite',
      'Ruoli adatti: creative director, brand manager, consulente, formatore',
      'Sviluppa competenze di project management per massimizzare l\'impatto'
    ]
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
    behavioralPatterns: [
      'Crei stabilità e armonia nell\'ambiente di lavoro',
      'Supporti gli altri con pazienza e dedizione',
      'Preferisci cambiamenti graduali e ben pianificati',
      'Costruisci relazioni profonde e durature'
    ],
    stressManagement: [
      'Sotto stress, tendi a interiorizzare e ritirarti',
      'Strategia efficace: Parla con persone di fiducia dei tuoi bisogni',
      'Stabilisci confini chiari per proteggerti dal sovraccarico',
      'Pratica l\'assertività in situazioni a basso rischio'
    ],
    leadershipStyle: [
      'Guidi con empatia, supportando lo sviluppo del team',
      'Crei un ambiente di lavoro sicuro e collaborativo',
      'Sei efficace nel costruire team coesi e fedeli',
      'Sviluppa: capacità di prendere decisioni difficili quando necessario'
    ],
    teamInteraction: [
      'Sei il collante che tiene unito il team',
      'Faciliti la collaborazione e risolvi tensioni',
      'Potresti evitare confronti necessari per mantenere l\'armonia',
      'Esprimi le tue opinioni - il team ha bisogno della tua prospettiva'
    ],
    decisionMaking: [
      'Consideri attentamente l\'impatto sulle persone coinvolte',
      'Cerchi consenso e armonia nelle decisioni',
      'Ti prendi tempo per riflettere prima di decidere',
      'Bilancia il desiderio di armonia con la necessità di decisioni tempestive'
    ],
    conflictResolution: [
      'Sei un mediatore naturale, cercando soluzioni win-win',
      'Ascolti tutte le parti con genuina empatia',
      'Potresti compromettere i tuoi bisogni per la pace',
      'Sviluppa: capacità di affrontare conflitti anche quando scomodo'
    ],
    motivationalDrivers: [
      'Ambiente di lavoro armonioso e rispettoso',
      'Relazioni autentiche e significative',
      'Contribuire al benessere degli altri',
      'Stabilità e sicurezza nel lungo termine'
    ],
    learningPreferences: [
      'Apprendi meglio in ambienti sicuri e strutturati',
      'Preferisci apprendimento graduale con tempo per assimilare',
      'Ti piacciono case study e applicazioni pratiche',
      'Cerca formazione che rispetti i tuoi tempi e stile'
    ],
    careerGuidance: [
      'Eccelli in ruoli di supporto, caring e servizio',
      'Ambienti ideali: HR, healthcare, educazione, customer service',
      'Ruoli adatti: HR manager, counselor, team coordinator, mediatore',
      'Sviluppa competenze di leadership per amplificare il tuo impatto'
    ]
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
    behavioralPatterns: [
      'Analizzi situazioni in profondità prima di agire',
      'Cerchi precisione e qualità in tutto ciò che fai',
      'Preferisci processi strutturati e sistematici',
      'Basi le tue conclusioni su dati e fatti verificabili'
    ],
    stressManagement: [
      'Sotto stress, potresti diventare eccessivamente critico o ritirato',
      'Strategia efficace: Bilancia analisi con momenti di relax',
      'Accetta che non tutto può essere perfetto o controllato',
      'Condividi le preoccupazioni invece di analizzarle da solo'
    ],
    leadershipStyle: [
      'Guidi con competenza, dati e pianificazione strategica',
      'Crei sistemi e processi che garantiscono la qualità',
      'Sei efficace in contesti tecnici e complessi',
      'Sviluppa: flessibilità e competenze relazionali per ispirare il team'
    ],
    teamInteraction: [
      'Sei la garanzia di qualità e precisione del team',
      'Fornisci analisi approfondite e soluzioni ponderate',
      'Potresti essere percepito come troppo critico o distante',
      'Riconosci anche i progressi, non solo le imperfezioni'
    ],
    decisionMaking: [
      'Raccogli e analizzi tutti i dati disponibili',
      'Valuti rischi e benefici in modo sistematico',
      'Cerchi la soluzione ottimale basata su logica',
      'Bilancia il desiderio di perfezione con la necessità di decidere'
    ],
    conflictResolution: [
      'Affronti i conflitti con logica e obiettività',
      'Cerchi soluzioni basate su fatti e standard',
      'Potresti minimizzare l\'aspetto emotivo dei conflitti',
      'Sviluppa: empatia e considerazione dei fattori umani'
    ],
    motivationalDrivers: [
      'Opportunità di eccellere in competenza e qualità',
      'Riconoscimento dell\'expertise e della precisione',
      'Autonomia nell\'organizzare il proprio lavoro',
      'Progetti complessi che richiedono analisi approfondita'
    ],
    learningPreferences: [
      'Apprendi meglio attraverso studio approfondito e riflessione',
      'Preferisci formazione strutturata con materiali dettagliati',
      'Ti piacciono teoria, ricerca e documentazione tecnica',
      'Cerca opportunità di specializzazione e maestria'
    ],
    careerGuidance: [
      'Eccelli in ruoli tecnici, analitici e di expertise',
      'Ambienti ideali: R&D, finanza, quality assurance, ingegneria',
      'Ruoli adatti: analista, ricercatore, technical specialist, auditor',
      'Sviluppa competenze comunicative per tradurre la complessità in semplicità'
    ]
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
  const thirdColor = colorScores[2];
  const lowestColor = colorScores[3];

  // Get traits for dominant color
  const traits = colorTraits[dominantColor.color] || colorTraits.red;

  // Generate personalized recommendations
  const recommendations = generateInsightRecommendations(
    dominantColor,
    secondaryColor,
    colorScores
  );

  // Generate detailed analysis
  const profileDescription = generateProfileDescription(dominantColor, secondaryColor, thirdColor, lowestColor);
  const actionPlan = generateActionPlan(dominantColor, secondaryColor, lowestColor, traits);
  
  // Generate new sections
  const methodologicalIntroduction = generateMethodologicalIntroduction();
  const oppositeType = generateOppositeType(dominantColor);
  const teamValue = generateTeamValue(dominantColor, secondaryColor);
  const communicationObstacles = generateCommunicationObstacles(dominantColor);
  const profileType = generateProfileType(dominantColor, secondaryColor, thirdColor);

  return {
    dominantColor,
    secondaryColor,
    colorScores,
    profileType,
    strengths: traits.strengths,
    developmentAreas: traits.developmentAreas,
    workingStyle: traits.workingStyle,
    communicationStyle: traits.communicationStyle,
    recommendations,
    methodologicalIntroduction,
    oppositeType,
    teamValue,
    communicationObstacles,
    detailedAnalysis: {
      profileDescription,
      behavioralPatterns: traits.behavioralPatterns,
      stressManagement: traits.stressManagement,
      leadershipStyle: traits.leadershipStyle,
      teamInteraction: traits.teamInteraction,
      decisionMaking: traits.decisionMaking,
      conflictResolution: traits.conflictResolution,
      motivationalDrivers: traits.motivationalDrivers,
      learningPreferences: traits.learningPreferences,
      careerGuidance: traits.careerGuidance,
      actionPlan
    }
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

function generateProfileDescription(
  dominant: ColorScore, 
  secondary: ColorScore, 
  third: ColorScore,
  lowest: ColorScore
): string {
  const descriptions: string[] = [];
  
  descriptions.push(`🎨 **Il Tuo Profilo Insight Discovery Completo**\n`);
  descriptions.push(`Il tuo profilo mostra una personalità principalmente ${dominant.name} (${dominant.percentage}%), che rappresenta la tua energia dominante e il tuo approccio naturale alla vita professionale e personale.\n`);
  
  descriptions.push(`**Distribuzione delle Energie:**`);
  descriptions.push(`• ${dominant.name}: ${dominant.percentage}% - La tua energia principale`);
  descriptions.push(`• ${secondary.name}: ${secondary.percentage}% - La tua energia di supporto`);
  descriptions.push(`• ${third.name}: ${third.percentage}% - Energia complementare`);
  descriptions.push(`• ${lowest.name}: ${lowest.percentage}% - Energia da sviluppare\n`);
  
  if (dominant.percentage > 40) {
    descriptions.push(`La tua forte predominanza ${dominant.name} indica un profilo distintivo e ben definito. Questo ti rende particolarmente efficace in contesti che valorizzano le caratteristiche di questa energia, ma potrebbe anche rappresentare un'opportunità per sviluppare maggiore flessibilità integrando le altre energie.\n`);
  } else if (dominant.percentage < 30) {
    descriptions.push(`Il tuo profilo mostra un'interessante distribuzione equilibrata tra le energie. Questa versatilità ti permette di adattarti facilmente a diversi contesti e persone, rendendoti un prezioso elemento di connessione nei team diversificati.\n`);
  }
  
  if (lowest.percentage < 15) {
    descriptions.push(`La tua energia ${lowest.name} (${lowest.percentage}%) rappresenta un'area significativa di crescita. Sviluppare questa dimensione può arricchire notevolmente il tuo profilo e amplificare la tua efficacia in situazioni che richiedono queste competenze.`);
  }
  
  return descriptions.join('\n');
}

function generateActionPlan(
  dominant: ColorScore,
  secondary: ColorScore,
  lowest: ColorScore,
  traits: any
): string[] {
  const plan: string[] = [];
  
  plan.push(`**Piano d'Azione Personalizzato per il Tuo Sviluppo:**\n`);
  
  plan.push(`**1. Valorizza i Tuoi Punti di Forza (Energia ${dominant.name})**`);
  plan.push(`   • Identifica 2-3 situazioni questa settimana dove puoi usare le tue capacità ${dominant.name.toLowerCase()}`);
  plan.push(`   • Condividi con il team come le tue competenze naturali possono contribuire ai progetti`);
  plan.push(`   • Cerca opportunità di leadership o ruoli che valorizzino la tua energia dominante\n`);
  
  plan.push(`**2. Integra la Tua Energia Secondaria (${secondary.name})**`);
  plan.push(`   • Riconosci come la tua energia ${secondary.name.toLowerCase()} completa quella ${dominant.name.toLowerCase()}`);
  plan.push(`   • Pratica l'utilizzo consapevole di entrambe le energie in situazioni complesse`);
  plan.push(`   • Cerca feedback su come bilanci queste due dimensioni\n`);
  
  plan.push(`**3. Sviluppa l'Energia Meno Espressa (${lowest.name})**`);
  plan.push(`   • Identifica una persona nel tuo team con forte energia ${lowest.name.toLowerCase()} e osserva il suo approccio`);
  plan.push(`   • Scegli UN comportamento tipico dell'energia ${lowest.name.toLowerCase()} da praticare questa settimana`);
  plan.push(`   • Rifletti su come questo amplia le tue capacità e prospettive\n`);
  
  plan.push(`**4. Gestione dello Stress e Bilanciamento**`);
  plan.push(`   • Riconosci i segnali di stress tipici del profilo ${dominant.name.toLowerCase()}`);
  plan.push(`   • Implementa almeno una strategia di gestione dello stress suggerita`);
  plan.push(`   • Crea un sistema di supporto con persone di energie diverse\n`);
  
  plan.push(`**5. Crescita Professionale a 90 Giorni**`);
  plan.push(`   • Scegli UN'area di sviluppo dalle aree suggerite e crea un piano specifico`);
  plan.push(`   • Trova un mentor o coach che possa supportarti in questo percorso`);
  plan.push(`   • Misura i progressi con feedback regolari dal team\n`);
  
  plan.push(`**6. Interazione con Altri Profili**`);
  plan.push(`   • Identifica i profili dominanti dei tuoi colleghi chiave`);
  plan.push(`   • Adatta consapevolmente il tuo stile di comunicazione a ciascuno`);
  plan.push(`   • Valuta l'efficacia delle tue interazioni e aggiusta l'approccio\n`);
  
  plan.push(`**Azioni Immediate (Questa Settimana):**`);
  plan.push(`✓ Condividi i risultati di questo test con il tuo manager/team`);
  plan.push(`✓ Identifica una situazione dove puoi applicare un nuovo comportamento`);
  plan.push(`✓ Richiedi feedback su un'area di sviluppo specifica`);
  plan.push(`✓ Rifletti su come le tue energie influenzano le tue decisioni quotidiane`);
  
  return plan;
}
