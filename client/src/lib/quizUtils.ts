import type { Category, Quiz } from "@shared/schema";

const colorGradients: Record<string, string> = {
  blue: "from-blue-600 to-blue-700",
  slate: "from-slate-700 to-blue-600",
  purple: "from-purple-600 to-blue-600",
  green: "from-green-600 to-teal-600",
  indigo: "from-blue-800 to-indigo-800",
  cyan: "from-cyan-600 to-blue-600",
  pink: "from-pink-600 to-rose-600",
  red: "from-red-600 to-orange-600",
  violet: "from-violet-600 to-fuchsia-600",
};

const difficultyMap: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzato",
  expert: "Esperto",
};

const levelMap: Record<string, string> = {
  beginner: "Fondamentale",
  intermediate: "Standard",
  advanced: "Certificazione",
  expert: "Certificazione",
};

const categoryTypeMap: Record<string, string> = {
  "cyber-security-awareness": "certifications",
  "cism": "certifications",
  "cissp": "certifications",
  "iso-27001": "compliance",
  "gdpr": "compliance",
  "eu-privacy": "compliance",
  "ai-security": "ai",
  "data-protection-privacy": "ai",
  "threat-intelligence-ai": "ai",
  "secops-ai-automation": "ai",
};

const questionCountMap: Record<string, number> = {
  "cyber-security-awareness": 50,
  "cism": 150,
  "cissp": 125,
  "iso-27001": 60,
  "gdpr": 50,
  "eu-privacy": 40,
  "ai-security": 70,
  "data-protection-privacy": 80,
  "threat-intelligence-ai": 90,
  "secops-ai-automation": 75,
};

export interface QuizCardData {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: number;
  difficulty: string;
  level: string;
  isPremium: boolean;
  category: string;
  gradient: string;
  icon: string;
}

export function mapQuizToCardData(quiz: Quiz, category: Category): QuizCardData {
  const questionCount = questionCountMap[category.slug] || 50;
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description || category.description || "",
    duration: quiz.duration,
    questions: questionCount,
    difficulty: difficultyMap[quiz.difficulty] || quiz.difficulty,
    level: levelMap[quiz.difficulty] || "Standard",
    isPremium: quiz.isPremium || false,
    category: categoryTypeMap[category.slug] || "certifications",
    gradient: colorGradients[category.color || "blue"] || "from-blue-600 to-blue-700",
    icon: category.icon || "shield-alt",
  };
}

export function mapCategoriesToQuizCards(
  categoriesWithQuizzes: Array<Category & { quizzes: Quiz[] }>
): QuizCardData[] {
  const quizCards: QuizCardData[] = [];

  for (const category of categoriesWithQuizzes) {
    for (const quiz of category.quizzes) {
      quizCards.push(mapQuizToCardData(quiz, category));
    }
  }

  return quizCards;
}
