export const translations = {
  it: {
    home: {
      welcome: "Benvenuto",
      subtitle: "La formazione che unisce salute e sicurezza digitale. Preparati con quiz interattivi, corsi live e on-demand arricchiti dal gaming: un nuovo modo per studiare e allenarti alle certificazioni più richieste, come CISSP, CISM, ISO 27001, OSCP, CEH e molte altre. Con il nostro modello AI Prohmed impari a fare prevenzione attiva, con reportistiche dedicate e suggerimenti personalizzati.",
      viewDashboard: "Vedi Dashboard",
      stats: {
        completed: "Quiz Completati",
        averageScore: "Media",
        timeSpent: "Tempo Totale",
        streak: "Serie Attuale"
      },
      noPremium: {
        title: "Sblocca contenuti Premium",
        description: "Accedi a oltre 1.000.000 di domande e tutti i quiz avanzati",
        upgrade: "Upgrade"
      },
      categories: {
        title: "Categorie",
        featured: "Categorie in Evidenza",
        allQuizzes: "Tutti i Quiz"
      },
      emptyState: {
        title: "Nessun Quiz Disponibile",
        description: "Tutti i quiz richiedono un account Premium",
        button: "Ottieni Premium"
      },
      quickActions: {
        continueLearning: {
          title: "Continua l'Apprendimento",
          description: "Riprendi da dove avevi lasciato o inizia un nuovo quiz",
          button: "Inizia Quiz"
        },
        viewStats: {
          title: "Le Tue Statistiche",
          description: "Visualizza i progressi dettagliati e i risultati dei quiz",
          button: "Vedi Statistiche"
        }
      }
    }
  },
  en: {
    home: {
      welcome: "Welcome",
      subtitle: "Training that combines health and digital security. Prepare with interactive quizzes, live and on-demand courses enriched with gamification: a new way to study and train for the most sought-after certifications, such as CISSP, CISM, ISO 27001, OSCP, CEH and many others. With our AI Prohmed model you learn active prevention, with dedicated reports and personalized recommendations.",
      viewDashboard: "View Dashboard",
      stats: {
        completed: "Quizzes Completed",
        averageScore: "Average",
        timeSpent: "Total Time",
        streak: "Current Streak"
      },
      noPremium: {
        title: "Unlock Premium Content",
        description: "Access over 1,000,000 questions and all advanced quizzes",
        upgrade: "Upgrade"
      },
      categories: {
        title: "Categories",
        featured: "Featured Categories",
        allQuizzes: "All Quizzes"
      },
      emptyState: {
        title: "No Quizzes Available",
        description: "All quizzes require a Premium account",
        button: "Get Premium"
      },
      quickActions: {
        continueLearning: {
          title: "Continue Learning",
          description: "Pick up where you left off or start a new quiz",
          button: "Start Quiz"
        },
        viewStats: {
          title: "Your Statistics",
          description: "View detailed progress and quiz results",
          button: "View Statistics"
        }
      }
    }
  },
  es: {
    home: {
      welcome: "Bienvenido",
      subtitle: "La formación que une salud y seguridad digital. Prepárate con cuestionarios interactivos, cursos en vivo y bajo demanda enriquecidos con gamificación: una nueva forma de estudiar y entrenarte para las certificaciones más solicitadas, como CISSP, CISM, ISO 27001, OSCP, CEH y muchas otras. Con nuestro modelo AI Prohmed aprendes prevención activa, con informes dedicados y sugerencias personalizadas.",
      viewDashboard: "Ver Panel",
      stats: {
        completed: "Cuestionarios Completados",
        averageScore: "Promedio",
        timeSpent: "Tiempo Total",
        streak: "Racha Actual"
      },
      noPremium: {
        title: "Desbloquear Contenido Premium",
        description: "Accede a más de 1.000.000 de preguntas y todos los cuestionarios avanzados",
        upgrade: "Actualizar"
      },
      categories: {
        title: "Categorías",
        featured: "Categorías Destacadas",
        allQuizzes: "Todos los Cuestionarios"
      },
      emptyState: {
        title: "No Hay Cuestionarios Disponibles",
        description: "Todos los cuestionarios requieren una cuenta Premium",
        button: "Obtener Premium"
      },
      quickActions: {
        continueLearning: {
          title: "Continuar Aprendiendo",
          description: "Retoma donde lo dejaste o comienza un nuevo cuestionario",
          button: "Iniciar Cuestionario"
        },
        viewStats: {
          title: "Tus Estadísticas",
          description: "Ver progreso detallado y resultados de cuestionarios",
          button: "Ver Estadísticas"
        }
      }
    }
  },
  fr: {
    home: {
      welcome: "Bienvenue",
      subtitle: "Continuez votre parcours d'apprentissage en cybersécurité",
      viewDashboard: "Voir Tableau de bord",
      stats: {
        completed: "Quiz Complétés",
        averageScore: "Moyenne",
        timeSpent: "Temps Total",
        streak: "Série Actuelle"
      },
      noPremium: {
        title: "Débloquer le Contenu Premium",
        description: "Accédez à plus de 1 000 000 de questions et à tous les quiz avancés",
        upgrade: "Mise à niveau"
      },
      categories: {
        title: "Catégories",
        featured: "Catégories en Vedette",
        allQuizzes: "Tous les Quiz"
      },
      emptyState: {
        title: "Aucun Quiz Disponible",
        description: "Tous les quiz nécessitent un compte Premium",
        button: "Obtenir Premium"
      },
      quickActions: {
        continueLearning: {
          title: "Continuer l'Apprentissage",
          description: "Reprenez où vous vous êtes arrêté ou commencez un nouveau quiz",
          button: "Démarrer Quiz"
        },
        viewStats: {
          title: "Vos Statistiques",
          description: "Afficher les progrès détaillés et les résultats des quiz",
          button: "Voir Statistiques"
        }
      }
    }
  }
} as const;

export type Language = keyof typeof translations;

export function getTranslation(lang: string | undefined | null) {
  const validLang = (lang && lang in translations) ? lang as Language : 'it';
  return translations[validLang];
}
