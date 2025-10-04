import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navigation from "@/components/navigation";
import QuizCard from "@/components/quiz-card";
import LanguageSelector from "@/components/language-selector";
import { LiveCourseModal } from "@/components/LiveCourseModal";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { mapCategoriesToQuizCards } from "@/lib/quizUtils";
import type { Category, Quiz, User as UserType } from "@shared/schema";
import { Crown, ChartLine, BookOpen, Play } from "lucide-react";
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
  const [quizConfigDialog, setQuizConfigDialog] = useState<{ quizId: string; quizTitle: string; totalQuestions: number; isPremium: boolean } | null>(null);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeDifficultyFilter, setActiveDifficultyFilter] = useState("all");
  
  const userLanguage = (user as UserType)?.language;
  const t = getTranslation(userLanguage).home;
  
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
  
  // Apply category filter
  if (activeFilter !== "all") {
    filteredFeatured = filteredFeatured.filter(quiz => quiz.category === activeFilter);
  }
  
  // Apply difficulty filter
  if (activeDifficultyFilter !== "all") {
    filteredFeatured = filteredFeatured.filter(quiz => quiz.difficulty === activeDifficultyFilter);
  }

  // Apply filters to non-featured quizzes
  let filteredQuizzes = (user as User)?.isPremium 
    ? nonFeaturedQuizzes 
    : nonFeaturedQuizzes.filter(quiz => !quiz.isPremium);
  
  // Apply category filter
  if (activeFilter !== "all") {
    filteredQuizzes = filteredQuizzes.filter(quiz => quiz.category === activeFilter);
  }
  
  // Apply difficulty filter
  if (activeDifficultyFilter !== "all") {
    filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === activeDifficultyFilter);
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
      // Show configuration dialog
      const quiz = quizCategories.find(q => q.id === quizId);
      if (quiz) {
        setQuizConfigDialog({
          quizId,
          quizTitle: quiz.title,
          totalQuestions: quiz.questions,
          isPremium
        });
        setSelectedQuestionCount("all");
      }
    }
  };

  const handleConfirmStartQuiz = () => {
    if (!quizConfigDialog) return;
    
    const questionCount = selectedQuestionCount === "all" 
      ? quizConfigDialog.totalQuestions 
      : parseInt(selectedQuestionCount);
    
    // Start quiz with selected number of questions
    window.location.href = `/quiz/${quizConfigDialog.quizId}?questions=${questionCount}`;
    setQuizConfigDialog(null);
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
              {t.welcome}, {(user as User)?.firstName || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              {t.subtitle}
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
                  <p className="text-white/90">
                    {t.noPremium.description}
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
            <div className="space-y-6">
              {/* Category Filters */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Categoria</h3>
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
              </div>
              
              {/* Difficulty Filters */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Livello</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={activeDifficultyFilter === "all" ? "default" : "outline"}
                    onClick={() => setActiveDifficultyFilter("all")}
                    size="sm"
                    className="rounded-full"
                    data-testid="filter-difficulty-all-home"
                  >
                    Tutti i livelli
                  </Button>
                  <Button
                    variant={activeDifficultyFilter === "beginner" ? "default" : "outline"}
                    onClick={() => setActiveDifficultyFilter("beginner")}
                    size="sm"
                    className="rounded-full"
                    data-testid="filter-difficulty-beginner-home"
                  >
                    Principiante
                  </Button>
                  <Button
                    variant={activeDifficultyFilter === "intermediate" ? "default" : "outline"}
                    onClick={() => setActiveDifficultyFilter("intermediate")}
                    size="sm"
                    className="rounded-full"
                    data-testid="filter-difficulty-intermediate-home"
                  >
                    Intermedio
                  </Button>
                  <Button
                    variant={activeDifficultyFilter === "advanced" ? "default" : "outline"}
                    onClick={() => setActiveDifficultyFilter("advanced")}
                    size="sm"
                    className="rounded-full"
                    data-testid="filter-difficulty-advanced-home"
                  >
                    Avanzato
                  </Button>
                  <Button
                    variant={activeDifficultyFilter === "expert" ? "default" : "outline"}
                    onClick={() => setActiveDifficultyFilter("expert")}
                    size="sm"
                    className="rounded-full"
                    data-testid="filter-difficulty-expert-home"
                  >
                    Esperto
                  </Button>
                </div>
              </div>
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
        <div className="grid md:grid-cols-2 gap-6">
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
      </div>

      {/* Quiz Configuration Dialog */}
      <Dialog open={!!quizConfigDialog} onOpenChange={(open) => !open && setQuizConfigDialog(null)}>
        <DialogContent data-testid="dialog-quiz-config">
          <DialogHeader>
            <DialogTitle>Configura Quiz</DialogTitle>
            <DialogDescription>
              Scegli quante domande vuoi affrontare per questo quiz
            </DialogDescription>
          </DialogHeader>
          
          {quizConfigDialog && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold mb-2">{quizConfigDialog.quizTitle}</h4>
                <p className="text-sm text-muted-foreground">
                  Domande disponibili: {quizConfigDialog.totalQuestions}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="question-count">Numero di Domande</Label>
                <Select value={selectedQuestionCount} onValueChange={setSelectedQuestionCount}>
                  <SelectTrigger id="question-count" data-testid="select-question-count">
                    <SelectValue placeholder="Seleziona numero domande" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 domande</SelectItem>
                    <SelectItem value="20">20 domande</SelectItem>
                    <SelectItem value="30">30 domande</SelectItem>
                    <SelectItem value="50">50 domande</SelectItem>
                    {quizConfigDialog.totalQuestions > 50 && (
                      <SelectItem value="100">100 domande</SelectItem>
                    )}
                    <SelectItem value="all">
                      Tutte ({quizConfigDialog.totalQuestions} domande)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Le domande saranno selezionate casualmente dal quiz
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizConfigDialog(null)}>
              Annulla
            </Button>
            <Button onClick={handleConfirmStartQuiz} data-testid="button-confirm-start">
              <Play className="w-4 h-4 mr-2" />
              Inizia Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
