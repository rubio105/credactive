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
import { Crown, ChartLine, BookOpen, Play, Video, Calendar, ChevronLeft, ChevronRight, Shield } from "lucide-react";
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
  const [categoryPage, setCategoryPage] = useState(0);
  const CATEGORIES_PER_PAGE = 12;
  
  const userLanguage = (user as UserType)?.language;
  const t = getTranslation(userLanguage).home;
  
  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/user/dashboard"],
  });

  const { data: categoriesWithQuizzes = [] } = useQuery<Array<Category & { quizzes: QuizWithCount[] }>>({
    queryKey: ["/api/categories-with-quizzes"],
  });

  // Check if user needs to select a language
  useEffect(() => {
    const userWithLanguage = user as UserType;
    if (userWithLanguage && !userWithLanguage.language) {
      setShowLanguageSelector(true);
    }
  }, [user]);

  // Sort categories: pinned first, then by sortOrder
  const sortedCategories = [...categoriesWithQuizzes].sort((a, b) => {
    // Pinned categories always come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Then sort by sortOrder
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  // Paginate categories (12 per page)
  const totalPages = Math.ceil(sortedCategories.length / CATEGORIES_PER_PAGE);
  const paginatedCategories = sortedCategories.slice(
    categoryPage * CATEGORIES_PER_PAGE,
    (categoryPage + 1) * CATEGORIES_PER_PAGE
  );

  const quizCategories = mapCategoriesToQuizCards(paginatedCategories);
  
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

        {/* AI Prohmed - Prevenzione e Salute */}
        <Card className="mb-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-none shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <img 
                  src="/attached_assets/image_1760060236448.png" 
                  alt="AI Prohmed Logo" 
                  className="w-16 h-16"
                />
                <div>
                  <h2 className="text-2xl font-bold">AI Prohmed - Impara la Prevenzione</h2>
                  <Badge className="mt-1 bg-white/30 text-white border-white/40">Intelligenza Artificiale per la Salute</Badge>
                </div>
              </div>
            </div>

            <p className="text-white/90 text-base mb-6 max-w-3xl">
              Il tuo assistente intelligente per la prevenzione sanitaria. Carica documenti medici, genera report personalizzati e scopri strategie di prevenzione basate su evidenze scientifiche.
            </p>

            {/* Dashboard Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Documenti Caricati</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Health Score</p>
                    <p className="text-2xl font-bold">--</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Report Generati</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link href="/prevention" className="block">
                <Button 
                  className="w-full bg-white text-orange-600 hover:bg-white/90 font-semibold"
                  data-testid="button-ai-chat"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Chat AI Prevenzione
                </Button>
              </Link>

              <Link href="/prevention" className="block">
                <Button 
                  variant="outline" 
                  className="w-full bg-white/10 text-white border-white/30 hover:bg-white/20"
                  data-testid="button-upload-document"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Carica Documento
                </Button>
              </Link>

              <Link href="/prevention" className="block">
                <Button 
                  variant="outline" 
                  className="w-full bg-white/10 text-white border-white/30 hover:bg-white/20"
                  data-testid="button-generate-report"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Genera Report PDF
                </Button>
              </Link>
            </div>

            {/* Privacy Notice */}
            <div className="mt-4 flex items-start gap-2 text-white/80 text-sm">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p className="font-medium">Privacy e Anonimizzazione</p>
                <p className="text-white/70 text-xs mt-1">
                  Tutti i documenti caricati vengono automaticamente anonimizzati. I dati personali sensibili (nome, data di nascita, codice fiscale) vengono rimossi tramite AI prima dell'analisi. 
                  <button className="underline ml-1 hover:text-white" data-testid="button-privacy-info">
                    Scopri di più
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Categories Carousel (12 per page, with pinned priority) */}
        {quizCategories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Categorie Quiz</h2>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCategoryPage(prev => Math.max(0, prev - 1))}
                    disabled={categoryPage === 0}
                    data-testid="button-prev-categories"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {categoryPage + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCategoryPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={categoryPage === totalPages - 1}
                    data-testid="button-next-categories"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizCategories.map((quiz) => (
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
