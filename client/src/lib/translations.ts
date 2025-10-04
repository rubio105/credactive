export const translations = {
  it: {
    home: {
      welcome: "Benvenuto",
      subtitle: "Continua il tuo percorso di apprendimento in cybersecurity",
      viewDashboard: "Vedi Dashboard",
      stats: {
        completed: "Quiz Completati",
        averageScore: "Media",
        timeSpent: "Tempo Totale",
        streak: "Serie Attuale"
      },
      noPremium: {
        title: "Sblocca contenuti Premium",
        description: "Accedi a oltre 1.000.000 di domande e tutti i quiz avanzati"
      },
      categories: {
        title: "Categorie",
        allQuizzes: "Tutti i Quiz"
      }
    }
  },
  en: {
    home: {
      welcome: "Welcome",
      subtitle: "Continue your cybersecurity learning journey",
      viewDashboard: "View Dashboard",
      stats: {
        completed: "Quizzes Completed",
        averageScore: "Average",
        timeSpent: "Total Time",
        streak: "Current Streak"
      },
      noPremium: {
        title: "Unlock Premium Content",
        description: "Access over 1,000,000 questions and all advanced quizzes"
      },
      categories: {
        title: "Categories",
        allQuizzes: "All Quizzes"
      }
    }
  },
  es: {
    home: {
      welcome: "Bienvenido",
      subtitle: "Continúa tu camino de aprendizaje en ciberseguridad",
      viewDashboard: "Ver Panel",
      stats: {
        completed: "Cuestionarios Completados",
        averageScore: "Promedio",
        timeSpent: "Tiempo Total",
        streak: "Racha Actual"
      },
      noPremium: {
        title: "Desbloquear Contenido Premium",
        description: "Accede a más de 1.000.000 de preguntas y todos los cuestionarios avanzados"
      },
      categories: {
        title: "Categorías",
        allQuizzes: "Todos los Cuestionarios"
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
        description: "Accédez à plus de 1 000 000 de questions et à tous les quiz avancés"
      },
      categories: {
        title: "Catégories",
        allQuizzes: "Tous les Quiz"
      }
    }
  }
} as const;

export type Language = keyof typeof translations;

export function getTranslation(lang: string | undefined | null) {
  const validLang = (lang && lang in translations) ? lang as Language : 'it';
  return translations[validLang];
}
