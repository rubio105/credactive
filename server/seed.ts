import { db } from "./db";
import { categories, quizzes, questions } from "@shared/schema";

const quizData = [
  {
    category: {
      name: "Cyber Security Awareness",
      slug: "cyber-security-awareness",
      description: "Impara i concetti base della sicurezza informatica",
      icon: "shield-alt",
      color: "blue",
      isPremium: false
    },
    quizzes: [
      {
        title: "Fondamenti di Cyber Security",
        description: "Concetti base della sicurezza informatica, riconosci le minacce comuni e proteggi i tuoi dati",
        duration: 45,
        difficulty: "beginner",
        isPremium: false,
        questions: [
          {
            question: "Qual è il modo più sicuro per creare una password?",
            options: [
              { label: "A", text: "Usare il proprio nome e cognome" },
              { label: "B", text: "Usare una combinazione di lettere maiuscole, minuscole, numeri e simboli" },
              { label: "C", text: "Usare solo numeri" },
              { label: "D", text: "Usare la data di nascita" }
            ],
            correctAnswer: "B",
            explanation: "Una password sicura deve contenere una combinazione di diversi tipi di caratteri",
            category: "Password Security"
          },
          {
            question: "Cos'è il phishing?",
            options: [
              { label: "A", text: "Un tipo di virus informatico" },
              { label: "B", text: "Un tentativo di ottenere informazioni sensibili tramite email fraudolente" },
              { label: "C", text: "Un software antivirus" },
              { label: "D", text: "Un tipo di firewall" }
            ],
            correctAnswer: "B",
            explanation: "Il phishing è una tecnica di social engineering usata per rubare dati sensibili",
            category: "Social Engineering"
          }
        ]
      }
    ]
  },
  {
    category: {
      name: "CISM Certification",
      slug: "cism",
      description: "Certified Information Security Manager (CISM) - Certificazione globale riconosciuta per professionisti della sicurezza informatica. La certificazione CISM è ideale per manager e professionisti che gestiscono, progettano e valutano programmi di sicurezza delle informazioni aziendali. Requisiti: minimo 5 anni di esperienza lavorativa nella sicurezza informatica, con almeno 3 anni in un ruolo manageriale. Esame: 150 domande, 240 minuti. Punteggio minimo: 450/800. Domini: Governance della Sicurezza Informatica, Gestione del Rischio, Sviluppo e Gestione del Programma di Sicurezza, Gestione degli Incidenti.",
      icon: "user-shield",
      color: "slate",
      isPremium: true
    },
    quizzes: [
      {
        title: "CISM - Information Security Governance",
        description: "Governance della sicurezza informatica e gestione del rischio",
        duration: 240,
        difficulty: "advanced",
        isPremium: true,
        questions: [
          {
            question: "Qual è l'obiettivo principale di un programma di governance della sicurezza delle informazioni?",
            options: [
              { label: "A", text: "Eliminare tutti i rischi" },
              { label: "B", text: "Allineare la sicurezza delle informazioni con gli obiettivi di business" },
              { label: "C", text: "Implementare tutti i controlli possibili" },
              { label: "D", text: "Ridurre i costi IT" }
            ],
            correctAnswer: "B",
            explanation: "La governance deve allineare la sicurezza con il business",
            category: "Governance"
          }
        ]
      }
    ]
  },
  {
    category: {
      name: "CISSP Certification",
      slug: "cissp",
      description: "Certified Information Systems Security Professional (CISSP) - La certificazione di sicurezza informatica più riconosciuta al mondo. CISSP dimostra la competenza nel progettare, implementare e gestire programmi di sicurezza informatica. Requisiti: minimo 5 anni di esperienza professionale retribuita in almeno 2 degli 8 domini CISSP. Esame: 125-175 domande, 180 minuti. Punteggio minimo: 700/1000. Domini: Security & Risk Management, Asset Security, Security Architecture & Engineering, Communication & Network Security, Identity & Access Management (IAM), Security Assessment & Testing, Security Operations, Software Development Security.",
      icon: "certificate",
      color: "purple",
      isPremium: true
    },
    quizzes: [
      {
        title: "CISSP - Security and Risk Management",
        description: "Domini del CBK CISSP - Security and Risk Management",
        duration: 180,
        difficulty: "expert",
        isPremium: true,
        questions: [
          {
            question: "Nella triade CIA, cosa rappresenta 'Integrity'?",
            options: [
              { label: "A", text: "I dati sono accessibili quando necessario" },
              { label: "B", text: "I dati sono accurati e non sono stati alterati in modo non autorizzato" },
              { label: "C", text: "I dati sono protetti da accessi non autorizzati" },
              { label: "D", text: "I dati sono sempre disponibili" }
            ],
            correctAnswer: "B",
            explanation: "Integrity garantisce che i dati siano accurati e integri",
            category: "Security Principles"
          }
        ]
      }
    ]
  },
  {
    category: {
      name: "ISO 27001/27002",
      slug: "iso-27001",
      description: "ISO 27001 è lo standard internazionale per i sistemi di gestione della sicurezza delle informazioni (ISMS). Definisce i requisiti per stabilire, implementare, mantenere e migliorare continuamente un ISMS. ISO 27002 fornisce le linee guida per i controlli di sicurezza. Ideale per: Security Manager, Auditor, Consultant. Certificazione: L'organizzazione viene certificata ISO 27001, non l'individuo. I professionisti possono ottenere certificazioni come Lead Implementer o Lead Auditor. Esame tipico Lead Auditor: 40 domande, 60 minuti. Punteggio minimo: 70%. Copre: Annex A controls, risk assessment, ISMS implementation, audit procedures.",
      icon: "file-contract",
      color: "green",
      isPremium: true
    },
    quizzes: [
      {
        title: "ISO 27001 - Information Security Management",
        description: "Standard ISO per la gestione della sicurezza delle informazioni",
        duration: 90,
        difficulty: "intermediate",
        isPremium: true,
        questions: [
          {
            question: "Qual è lo scopo principale della ISO 27001?",
            options: [
              { label: "A", text: "Fornire linee guida per la privacy" },
              { label: "B", text: "Stabilire un sistema di gestione della sicurezza delle informazioni (ISMS)" },
              { label: "C", text: "Definire i requisiti tecnici per i firewall" },
              { label: "D", text: "Certificare i professionisti IT" }
            ],
            correctAnswer: "B",
            explanation: "ISO 27001 definisce i requisiti per un ISMS efficace",
            category: "ISMS"
          }
        ]
      }
    ]
  },
  {
    category: {
      name: "GDPR Compliance",
      slug: "gdpr",
      description: "General Data Protection Regulation (GDPR) - Il regolamento UE 2016/679 sulla protezione dei dati personali, entrato in vigore il 25 maggio 2018. Obbligatorio per tutte le organizzazioni che trattano dati di cittadini UE. Principi chiave: lawfulness, fairness, transparency, purpose limitation, data minimization, accuracy, storage limitation, integrity and confidentiality, accountability. Diritti degli interessati: accesso, rettifica, cancellazione (diritto all'oblio), limitazione del trattamento, portabilità, opposizione. Sanzioni: fino a €20 milioni o 4% del fatturato globale annuo. Certificazioni disponibili: CIPP/E (Certified Information Privacy Professional/Europe), CIPM (Certified Information Privacy Manager).",
      icon: "balance-scale",
      color: "indigo",
      isPremium: true
    },
    quizzes: [
      {
        title: "GDPR - Fondamenti e Principi",
        description: "Regolamento sulla protezione dei dati personali nell'UE",
        duration: 60,
        difficulty: "intermediate",
        isPremium: true,
        questions: [
          {
            question: "Qual è il termine massimo per notificare una violazione dei dati all'autorità di controllo secondo il GDPR?",
            options: [
              { label: "A", text: "24 ore" },
              { label: "B", text: "48 ore" },
              { label: "C", text: "72 ore" },
              { label: "D", text: "7 giorni" }
            ],
            correctAnswer: "C",
            explanation: "Il GDPR richiede la notifica entro 72 ore dalla scoperta della violazione",
            category: "Data Breach"
          }
        ]
      }
    ]
  },
  {
    category: {
      name: "EU Privacy & ePrivacy",
      slug: "eu-privacy",
      description: "Normative europee sulla privacy",
      icon: "user-lock",
      color: "purple",
      isPremium: true
    },
    quizzes: [
      {
        title: "EU Privacy Law & ePrivacy",
        description: "Normative europee sulla privacy e direttive ePrivacy",
        duration: 60,
        difficulty: "intermediate",
        isPremium: true,
        questions: [
          {
            question: "Quale direttiva regola la privacy nelle comunicazioni elettroniche nell'UE?",
            options: [
              { label: "A", text: "GDPR" },
              { label: "B", text: "ePrivacy Directive" },
              { label: "C", text: "NIS Directive" },
              { label: "D", text: "PSD2" }
            ],
            correctAnswer: "B",
            explanation: "La ePrivacy Directive (2002/58/EC) regola la privacy nelle comunicazioni elettroniche",
            category: "EU Privacy Law"
          }
        ]
      }
    ]
  },
  {
    category: {
      name: "AI Security",
      slug: "ai-security",
      description: "Sicurezza nell'intelligenza artificiale",
      icon: "brain",
      color: "cyan",
      isPremium: true
    },
    quizzes: [
      {
        title: "AI Security & Ethics",
        description: "Sicurezza e etica nell'intelligenza artificiale",
        duration: 75,
        difficulty: "advanced",
        isPremium: true,
        questions: [
          {
            question: "Cos'è un attacco adversarial nei sistemi di machine learning?",
            options: [
              { label: "A", text: "Un attacco DDoS a un server AI" },
              { label: "B", text: "Input manipolati per ingannare il modello ML" },
              { label: "C", text: "Furto di dati di training" },
              { label: "D", text: "Hacking del codice sorgente" }
            ],
            correctAnswer: "B",
            explanation: "Gli attacchi adversarial utilizzano input modificati per ingannare i modelli",
            category: "AI Threats"
          }
        ]
      }
    ]
  },
  {
    category: {
      name: "Data Protection & Privacy",
      slug: "data-protection-privacy",
      description: "Protezione dati e privacy",
      icon: "database",
      color: "pink",
      isPremium: true
    },
    quizzes: [
      {
        title: "Data Protection & Privacy",
        description: "Tecniche avanzate di protezione dei dati e privacy",
        duration: 90,
        difficulty: "advanced",
        isPremium: true,
        questions: [
          {
            question: "Qual è la differenza principale tra crittografia simmetrica e asimmetrica?",
            options: [
              { label: "A", text: "La velocità di elaborazione" },
              { label: "B", text: "Il numero di chiavi utilizzate" },
              { label: "C", text: "Il livello di sicurezza" },
              { label: "D", text: "La compatibilità con i sistemi legacy" }
            ],
            correctAnswer: "B",
            explanation: "La crittografia simmetrica usa una chiave, quella asimmetrica usa una coppia di chiavi",
            category: "Cryptography"
          }
        ]
      }
    ]
  },
  {
    category: {
      name: "Threat Intelligence & AI",
      slug: "threat-intelligence-ai",
      description: "Intelligence delle minacce con AI",
      icon: "biohazard",
      color: "red",
      isPremium: true
    },
    quizzes: [
      {
        title: "Threat Intelligence & AI",
        description: "Utilizzo dell'AI per threat intelligence e detection",
        duration: 120,
        difficulty: "expert",
        isPremium: true,
        questions: [
          {
            question: "Come può l'AI migliorare la threat intelligence?",
            options: [
              { label: "A", text: "Automatizzando l'analisi di grandi volumi di dati" },
              { label: "B", text: "Sostituendo completamente gli analisti umani" },
              { label: "C", text: "Eliminando tutti i falsi positivi" },
              { label: "D", text: "Prevenendo tutti gli attacchi zero-day" }
            ],
            correctAnswer: "A",
            explanation: "L'AI può analizzare grandi quantità di dati per identificare pattern e minacce",
            category: "AI Threat Detection"
          }
        ]
      }
    ]
  },
  {
    category: {
      name: "SecOps & AI Automation",
      slug: "secops-ai-automation",
      description: "Operazioni di sicurezza automatizzate con AI",
      icon: "robot",
      color: "violet",
      isPremium: true
    },
    quizzes: [
      {
        title: "SecOps & AI Automation",
        description: "Automazione delle operazioni di sicurezza con AI e SOAR",
        duration: 90,
        difficulty: "expert",
        isPremium: true,
        questions: [
          {
            question: "Cos'è una piattaforma SOAR?",
            options: [
              { label: "A", text: "Security Operations Analysis and Recovery" },
              { label: "B", text: "Security Orchestration, Automation and Response" },
              { label: "C", text: "System Operations and Risk" },
              { label: "D", text: "Secure Online Access Registry" }
            ],
            correctAnswer: "B",
            explanation: "SOAR sta per Security Orchestration, Automation and Response",
            category: "SecOps Tools"
          }
        ]
      }
    ]
  }
];

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    for (const data of quizData) {
      // Insert category
      const [category] = await db
        .insert(categories)
        .values(data.category)
        .returning();
      
      console.log(`✅ Created category: ${category.name}`);

      // Insert quizzes for this category
      for (const quizItem of data.quizzes) {
        const [quiz] = await db
          .insert(quizzes)
          .values({
            categoryId: category.id,
            title: quizItem.title,
            description: quizItem.description,
            duration: quizItem.duration,
            difficulty: quizItem.difficulty,
            isPremium: quizItem.isPremium,
            isActive: true
          })
          .returning();

        console.log(`  ✅ Created quiz: ${quiz.title}`);

        // Insert questions for this quiz
        for (const questionItem of quizItem.questions) {
          await db
            .insert(questions)
            .values({
              quizId: quiz.id,
              question: questionItem.question,
              options: questionItem.options,
              correctAnswer: questionItem.correctAnswer,
              explanation: questionItem.explanation,
              category: questionItem.category
            });
        }

        console.log(`    ✅ Created ${quizItem.questions.length} questions`);
      }
    }

    console.log("✨ Database seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
