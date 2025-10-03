import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, HelpCircle, BarChart3, Lock, Crown, Play, Shield, FileText, Users, Brain, Database, AlertTriangle, Bot } from "lucide-react";

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    description: string;
    duration: number;
    questions: number;
    difficulty: string;
    level: string;
    isPremium: boolean;
    gradient: string;
    icon: string;
  };
  onStartQuiz: () => void;
  showPremiumBadge?: boolean;
}

const iconMap: Record<string, any> = {
  "shield-alt": Shield,
  "user-shield": Users,
  "certificate": FileText,
  "file-contract": FileText,
  "balance-scale": BarChart3,
  "user-lock": Lock,
  "brain": Brain,
  "database": Database,
  "biohazard": AlertTriangle,
  "robot": Bot,
};

const difficultyColors = {
  "Principiante": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "Intermedio": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  "Avanzato": "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "Esperto": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
};

const levelColors = {
  "Fondamentale": "bg-primary/10 text-primary",
  "Certificazione": "bg-warning/10 text-warning", 
  "Standard": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "Compliance": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "AI & ML": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  "Privacy": "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  "Threat Intel": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  "SecOps": "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
};

export default function QuizCard({ quiz, onStartQuiz, showPremiumBadge = true }: QuizCardProps) {
  const IconComponent = iconMap[quiz.icon] || Shield;
  
  return (
    <Card 
      className={`overflow-hidden border border-border hover-scale transition-all duration-200 hover:shadow-lg ${
        quiz.isPremium && showPremiumBadge ? 'quiz-card-locked relative opacity-90' : ''
      }`}
      data-testid={`quiz-card-${quiz.id}`}
    >
      {/* Header with Gradient Background */}
      <div className={`h-48 bg-gradient-to-br ${quiz.gradient} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-black/10" />
        </div>
        <IconComponent className="text-white text-6xl relative z-10" />
        
        {/* Premium Badge */}
        {quiz.isPremium && showPremiumBadge && (
          <div className="absolute top-4 right-4 bg-warning text-warning-foreground px-3 py-1 rounded-full text-xs font-bold">
            <Crown className="w-3 h-3 mr-1 inline" />
            Premium
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        {/* Tags and Duration */}
        <div className="flex items-center justify-between mb-3">
          <Badge 
            className={levelColors[quiz.level as keyof typeof levelColors] || "bg-secondary/10 text-secondary"}
            data-testid={`quiz-level-${quiz.id}`}
          >
            {quiz.level}
          </Badge>
          <span className="text-muted-foreground text-sm flex items-center" data-testid={`quiz-duration-${quiz.id}`}>
            <Clock className="w-4 h-4 mr-1" />
            {quiz.duration} min
          </span>
        </div>

        {/* Title and Description */}
        <h3 className="text-xl font-bold mb-2 line-clamp-2" data-testid={`quiz-title-${quiz.id}`}>
          {quiz.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3" data-testid={`quiz-description-${quiz.id}`}>
          {quiz.description}
        </p>

        {/* Quiz Stats */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground flex items-center" data-testid={`quiz-questions-${quiz.id}`}>
            <HelpCircle className="w-4 h-4 mr-1" />
            {quiz.questions} domande
          </span>
          <Badge 
            variant="outline" 
            className={difficultyColors[quiz.difficulty as keyof typeof difficultyColors] || ""}
            data-testid={`quiz-difficulty-${quiz.id}`}
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            {quiz.difficulty}
          </Badge>
        </div>

        {/* Action Button */}
        {quiz.isPremium && showPremiumBadge ? (
          <Button 
            className="w-full" 
            variant="outline"
            disabled
            data-testid={`quiz-button-locked-${quiz.id}`}
          >
            <Lock className="w-4 h-4 mr-2" />
            Richiede Premium
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={onStartQuiz}
            data-testid={`quiz-button-start-${quiz.id}`}
          >
            <Play className="w-4 h-4 mr-2" />
            Inizia Quiz
          </Button>
        )}
      </CardContent>

      {/* Overlay effect for premium locked cards */}
      {quiz.isPremium && showPremiumBadge && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-blue-600/5 pointer-events-none" />
      )}
    </Card>
  );
}
