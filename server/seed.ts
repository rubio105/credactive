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
        duration: 30,
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
      description: "Preparazione per la certificazione CISM",
      icon: "user-shield",
      color: "slate",
      isPremium: true
    },
    quizzes: [
      {
        title: "CISM - Information Security Governance",
        description: "Governance della sicurezza informatica e gestione del rischio",
        duration: 90,
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
      description: "Preparazione per la certificazione CISSP",
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
      description: "Standard internazionali per la gestione della sicurezza",
      icon: "file-contract",
      color: "green",
      isPremium: true
    },
    quizzes: [
      {
        title: "ISO 27001 - Information Security Management",
        description: "Standard ISO per la gestione della sicurezza delle informazioni",
        duration: 60,
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
      description: "Regolamento europeo sulla protezione dei dati",
      icon: "balance-scale",
      color: "indigo",
      isPremium: true
    },
    quizzes: [
      {
        title: "GDPR - Fondamenti e Principi",
        description: "Regolamento sulla protezione dei dati personali nell'UE",
        duration: 45,
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
        duration: 50,
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
