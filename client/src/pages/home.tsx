import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import QuizCard from "@/components/quiz-card";
import LanguageSelector from "@/components/language-selector";
import { LiveCourseModal } from "@/components/LiveCourseModal";
import { useAuth } from "@/hooks/useAuth";
import { mapCategoriesToQuizCards } from "@/lib/quizUtils";
import type { Category, Quiz, User as UserType } from "@shared/schema";
import { Crown, ChartLine, BookOpen } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isPremium: boolean;
}

interface DashboardData {
  stats: {
    quizzesCompleted: number;
    averageScore: number;
    totalTime: number;
    currentStreak: number;
  };
  recentAttempts: Array<{
    id: string;
    quizId: string;
    score: number;
    completedAt: string;
  }>;
  progress: Array<{
    categoryId: string;
    quizzesCompleted: number;
    averageScore: number;
  }>;
}

export default function Home() {
  const { user } = useAuth();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedLiveCourseQuiz, setSelectedLiveCourseQuiz] = useState<{ id: string; title: string } | null>(null);
  
  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/user/dashboard"],
  });

  const { data: categoriesWithQuizzes = [] } = useQuery<Array<Category & { quizzes: Quiz[] }>>({
    queryKey: ["/api/categories-with-quizzes"],
  });

  const quizCategories = mapCategoriesToQuizCards(categoriesWithQuizzes);

  // Check if user needs to select a language
  useEffect(() => {
    const userWithLanguage = user as UserType;
    if (userWithLanguage && !userWithLanguage.language) {
      setShowLanguageSelector(true);
    }
  }, [user]);

  const availableQuizzes = (user as User)?.isPremium 
    ? quizCategories 
    : quizCategories.filter(quiz => !quiz.isPremium);

  // Quiz with live courses
  const liveCourseQuizTitles = [
    'DORA - Digital Operational Resilience',
    'Data Protection & Privacy',
    'EU Privacy Law & ePrivacy',
    'GDPR - Fondamenti e Principi',
    'ISO 27001 - Information Security Management',
    'NIS2 Directive - Fondamenti e Requisiti'
  ];

  const hasLiveCourse = (quizTitle: string) => {
    return liveCourseQuizTitles.some(title => quizTitle.includes(title) || title.includes(quizTitle));
  };

  const handleStartQuiz = (quizId: string, isPremium: boolean) => {
    if (isPremium && !(user as User)?.isPremium) {
      // Redirect to subscription page
      window.location.href = '/subscribe';
    } else {
      // Start quiz
      window.location.href = `/quiz/${quizId}`;
    }
  };

  const handleLiveCourse = (quizId: string, quizTitle: string) => {
    setSelectedLiveCourseQuiz({ id: quizId, title: quizTitle });
  };

  const handleLanguageSelected = () => {
    setShowLanguageSelector(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <LanguageSelector 
        open={showLanguageSelector} 
        onLanguageSelected={handleLanguageSelected}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="welcome-title">
              Benvenuto, {(user as User)?.firstName || 'Utente'}!
            </h1>
            <p className="text-muted-foreground">
              Continua il tuo percorso di apprendimento in cybersecurity
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowLanguageSelector(true)}
            data-testid="button-change-language"
            className="ml-4"
          >
            Cambia Lingua
          </Button>
        </div>

        {/* Quick Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Quiz Completati</p>
                    <p className="text-2xl font-bold" data-testid="stat-completed">
                      {dashboardData.stats.quizzesCompleted}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Punteggio Medio</p>
                    <p className="text-2xl font-bold text-success" data-testid="stat-average">
                      {dashboardData.stats.averageScore}%
                    </p>
                  </div>
                  <ChartLine className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tempo Totale</p>
                    <p className="text-2xl font-bold text-accent" data-testid="stat-time">
                      {dashboardData.stats.totalTime}h
                    </p>
                  </div>
                  <ChartLine className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Giorni Consecutivi</p>
                    <p className="text-2xl font-bold text-warning" data-testid="stat-streak">
                      {dashboardData.stats.currentStreak}
                    </p>
                  </div>
                  <ChartLine className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Premium Status */}
        {!(user as User)?.isPremium && (
          <Card className="gradient-primary text-white mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Sblocca Tutti i Quiz</h3>
                  <p className="text-white/90">
                    Accedi a oltre 2.000 domande professionali per soli €90 all'anno
                  </p>
                </div>
                <Link href="/subscribe">
                  <Button 
                    className="bg-white text-primary hover:bg-white/90"
                    data-testid="button-upgrade"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Quizzes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Quiz Disponibili</h2>
            <Link href="/dashboard">
              <Button variant="outline" data-testid="button-view-dashboard">
                Vedi Dashboard Completa
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onStartQuiz={() => handleStartQuiz(quiz.id, quiz.isPremium)}
                onLiveCourse={() => handleLiveCourse(quiz.id, quiz.title)}
                hasLiveCourse={hasLiveCourse(quiz.title)}
                showPremiumBadge={!(user as User)?.isPremium}
              />
            ))}
          </div>

          {selectedLiveCourseQuiz && (
            <LiveCourseModal
              quizId={selectedLiveCourseQuiz.id}
              quizTitle={selectedLiveCourseQuiz.title}
              isOpen={!!selectedLiveCourseQuiz}
              onClose={() => setSelectedLiveCourseQuiz(null)}
            />
          )}

          {availableQuizzes.length === 0 && (
            <Card className="p-12 text-center">
              <CardContent>
                <Crown className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Nessun Quiz Disponibile</h3>
                <p className="text-muted-foreground mb-4">
                  Tutti i quiz richiedono un account Premium
                </p>
                <Link href="/subscribe">
                  <Button data-testid="button-get-premium">
                    Ottieni Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">Continua l'Apprendimento</h3>
              <p className="text-muted-foreground mb-4">
                Riprendi da dove avevi lasciato o inizia un nuovo quiz
              </p>
              <Button className="w-full" data-testid="button-continue-learning">
                Inizia Quiz
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">Le Tue Statistiche</h3>
              <p className="text-muted-foreground mb-4">
                Visualizza i progressi dettagliati e i risultati dei quiz
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full" data-testid="button-view-stats">
                  Vedi Statistiche
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
