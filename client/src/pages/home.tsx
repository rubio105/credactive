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
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { mapCategoriesToQuizCards } from "@/lib/quizUtils";
import type { Category, QuizWithCount, User as UserType } from "@shared/schema";
import { Crown, ChartLine, BookOpen, Play, Video, Calendar } from "lucide-react";
import { getTranslation } from "@/lib/translations";

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
  const [activeFilter, setActiveFilter] = useState("all");
  
  const userLanguage = (user as UserType)?.language;
  const t = getTranslation(userLanguage).home;
  
  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/user/dashboard"],
  });

  const { data: categoriesWithQuizzes = [] } = useQuery<Array<Category & { quizzes: QuizWithCount[] }>>({
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

  // Filter featured categories (those marked as "In Evidenza")
  const featuredCategories = categoriesWithQuizzes.filter(cat => cat.isFeatured);
  const featuredQuizzes = mapCategoriesToQuizCards(featuredCategories);

  // All other quizzes (not in featured categories)
  const nonFeaturedCategories = categoriesWithQuizzes.filter(cat => !cat.isFeatured);
  const nonFeaturedQuizzes = mapCategoriesToQuizCards(nonFeaturedCategories);

  // Apply filters to featured quizzes
  let filteredFeatured = (user as User)?.isPremium 
    ? featuredQuizzes 
    : featuredQuizzes.filter(quiz => !quiz.isPremium);
  
  if (activeFilter !== "all") {
    filteredFeatured = filteredFeatured.filter(quiz => quiz.category === activeFilter);
  }

  // Apply filters to non-featured quizzes
  let filteredQuizzes = (user as User)?.isPremium 
    ? nonFeaturedQuizzes 
    : nonFeaturedQuizzes.filter(quiz => !quiz.isPremium);
  
  if (activeFilter !== "all") {
    filteredQuizzes = filteredQuizzes.filter(quiz => quiz.category === activeFilter);
  }

  const availableFeaturedQuizzes = filteredFeatured;
  const availableQuizzes = filteredQuizzes;

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
      // Start quiz directly with all questions configured by admin
      const quiz = quizCategories.find(q => q.id === quizId);
      if (quiz) {
        window.location.href = `/quiz/${quizId}?questions=${quiz.questionCount}`;
      }
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
      <SEO 
        title="Dashboard Quiz - I Tuoi Corsi Cybersecurity"
        description="Accedi ai tuoi quiz personalizzati su CISSP, CISM, ISO 27001, GDPR e altre certificazioni cybersecurity. Monitora i progressi, visualizza statistiche e continua la tua preparazione."
        keywords="dashboard quiz, progressi cybersecurity, certificazioni online, CISSP preparazione, CISM quiz"
      />
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
              {t.welcome}, {(user as User)?.firstName || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              {t.subtitle}
            </p>
            <p className="text-sm text-primary font-medium mt-2">
              🏆 Completa quiz, guadagna punti, sblocca badge e scala la classifica!
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" data-testid="button-view-dashboard">
              {t.viewDashboard}
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.stats.completed}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">{t.stats.averageScore}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">{t.stats.timeSpent}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">{t.stats.streak}</p>
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
                  <h3 className="text-xl font-bold mb-2">{t.noPremium.title}</h3>
                  <p className="text-white/90 mb-2">
                    {t.noPremium.description}
                  </p>
                  <p className="text-white/80 text-sm">
                    Accedi a sfide quotidiane, classifica globale e sistema di punti gamificato
                  </p>
                </div>
                <Link href="/subscribe">
                  <Button 
                    className="bg-white text-primary hover:bg-white/90"
                    data-testid="button-upgrade"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {t.noPremium.upgrade}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Filtra per Categoria</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                onClick={() => setActiveFilter("all")}
                size="sm"
                className="rounded-full"
                data-testid="filter-all-home"
              >
                Tutti
              </Button>
              <Button
                variant={activeFilter === "certifications" ? "default" : "outline"}
                onClick={() => setActiveFilter("certifications")}
                size="sm"
                className="rounded-full"
                data-testid="filter-certifications-home"
              >
                Certificazioni
              </Button>
              <Button
                variant={activeFilter === "compliance" ? "default" : "outline"}
                onClick={() => setActiveFilter("compliance")}
                size="sm"
                className="rounded-full"
                data-testid="filter-compliance-home"
              >
                Compliance
              </Button>
              <Button
                variant={activeFilter === "ai" ? "default" : "outline"}
                onClick={() => setActiveFilter("ai")}
                size="sm"
                className="rounded-full"
                data-testid="filter-ai-home"
              >
                AI & Security
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Featured Categories */}
        {availableFeaturedQuizzes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t.categories.featured}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableFeaturedQuizzes.map((quiz) => (
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
          </div>
        )}

        {/* Available Quizzes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t.categories.allQuizzes}</h2>
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
                <h3 className="text-xl font-bold mb-2">{t.emptyState.title}</h3>
                <p className="text-muted-foreground mb-4">
                  {t.emptyState.description}
                </p>
                <Link href="/subscribe">
                  <Button data-testid="button-get-premium">
                    {t.emptyState.button}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">{t.quickActions.continueLearning.title}</h3>
              <p className="text-muted-foreground mb-4">
                {t.quickActions.continueLearning.description}
              </p>
              <Button className="w-full" data-testid="button-continue-learning">
                {t.quickActions.continueLearning.button}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">{t.quickActions.viewStats.title}</h3>
              <p className="text-muted-foreground mb-4">
                {t.quickActions.viewStats.description}
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full" data-testid="button-view-stats">
                  {t.quickActions.viewStats.button}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Learning Paths */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Percorsi di Formazione</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* On-Demand Courses */}
            <Card className="hover-scale overflow-hidden">
              <div className="gradient-premium-plus text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Video className="w-8 h-8" />
                  </div>
                  {(user as UserType)?.subscriptionTier === 'premium_plus' ? (
                    <Badge className="bg-white/20 text-white">Disponibile</Badge>
                  ) : (
                    <Badge className="bg-white/20 text-white">Premium Plus</Badge>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-2">Corsi On-Demand</h3>
                <p className="text-white/90 mb-6">
                  Accedi a videocorsi professionali completi di quiz interattivi. Impara al tuo ritmo, quando e dove vuoi.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center space-x-2">
                    <Play className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Videolezioni HD di alta qualità</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Quiz interattivi tra i video</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <ChartLine className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Monitoraggio progressi dettagliato</span>
                  </li>
                </ul>
                {(user as UserType)?.subscriptionTier === 'premium_plus' ? (
                  <Link href="/corsi-on-demand">
                    <Button className="w-full bg-white text-purple-600 hover:bg-white/90" data-testid="button-browse-courses">
                      Esplora Corsi
                      <Play className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/subscribe">
                    <Button className="w-full bg-white text-purple-600 hover:bg-white/90" data-testid="button-upgrade-for-courses">
                      Sblocca i Corsi
                      <Crown className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>

            {/* Live Courses */}
            <Card className="hover-scale overflow-hidden">
              <div className="gradient-primary text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <Badge className="bg-white/20 text-white">Tutti gli Abbonati</Badge>
                </div>
                <h3 className="text-2xl font-bold mb-2">Corsi Live</h3>
                <p className="text-white/90 mb-6">
                  Partecipa a sessioni live interattive con esperti del settore. Impara in tempo reale e fai domande direttamente.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Sessioni programmate con esperti</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Play className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Interazione diretta e Q&A</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Priorità per Premium Plus</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-white text-primary hover:bg-white/90"
                  onClick={() => {
                    const firstLiveCourse = availableFeaturedQuizzes.find(q => hasLiveCourse(q.title)) || 
                                           availableQuizzes.find(q => hasLiveCourse(q.title));
                    if (firstLiveCourse) {
                      handleLiveCourse(firstLiveCourse.id, firstLiveCourse.title);
                    }
                  }}
                  data-testid="button-view-live-courses"
                >
                  Vedi Corsi Live
                  <Play className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
