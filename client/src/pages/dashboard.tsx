import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Trophy, ChartLine, Clock, Flame, ShieldCheck, BookOpen, Award, Star, Download, Zap } from "lucide-react";
import { LevelProgress } from "@/components/gamification/LevelProgress";
import { StreakTracker } from "@/components/gamification/StreakTracker";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { DailyChallenge } from "@/components/gamification/DailyChallenge";

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
    quizTitle: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    completedAt: string;
  }>;
  progress: Array<{
    categoryId: string;
    quizzesCompleted: number;
    averageScore: number;
    totalTimeSpent: number;
  }>;
}

interface GamificationData {
  profile: {
    totalPoints: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    iconUrl?: string;
    earnedAt?: string;
  }>;
  leaderboardPosition?: {
    rank: number;
    totalPoints: number;
  };
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isPremium: boolean;
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const paymentProcessedRef = useRef(false);

  // Handle Stripe payment success callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const paymentIntentId = urlParams.get('payment_intent');

    if (paymentStatus === 'success' && paymentIntentId && !paymentProcessedRef.current && isAuthenticated) {
      paymentProcessedRef.current = true;
      setIsProcessingPayment(true);
      
      apiRequest('/api/payment-success', 'POST', { paymentIntentId })
        .then(async (response) => {
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.message || 'Payment verification failed');
          }
          
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          await queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard"] });
          
          toast({
            title: "Pagamento Completato!",
            description: "Il tuo abbonamento è stato attivato con successo.",
          });
          
          setLocation('/dashboard');
        })
        .catch((error) => {
          console.error('Payment verification error:', error);
          paymentProcessedRef.current = false;
          toast({
            title: "Errore Verifica Pagamento",
            description: error.message || "Contatta il supporto se il problema persiste.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsProcessingPayment(false);
        });
    }
  }, [toast, isAuthenticated]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorizzato",
        description: "Devi effettuare il login per accedere alla dashboard",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/login");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardData, isLoading: isDashboardLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/user/dashboard"],
    retry: false,
  });

  const { data: gamificationData, isLoading: isGamificationLoading } = useQuery<GamificationData>({
    queryKey: ["/api/user/gamification"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle unauthorized error
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Sessione scaduta",
        description: "Effettua nuovamente il login",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || isDashboardLoading || isProcessingPayment) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {isProcessingPayment ? "Verifica pagamento in corso..." : "Caricamento dashboard..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <CardContent>
              <h2 className="text-2xl font-bold mb-4">Errore Caricamento</h2>
              <p className="text-muted-foreground mb-4">Impossibile caricare i dati della dashboard.</p>
              <Button onClick={() => window.location.reload()}>
                Riprova
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const categoryNames: Record<string, string> = {
    'certifications': 'Certificazioni',
    'compliance': 'Compliance',
    'ai': 'AI & Security'
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" data-testid="dashboard-title">Dashboard Personale</h2>
          <p className="text-muted-foreground">Monitora i tuoi progressi e statistiche</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Trophy className="text-primary text-2xl" />
                </div>
                <span className="text-3xl font-bold text-primary" data-testid="stat-quizzes-completed">
                  {dashboardData.stats.quizzesCompleted}
                </span>
              </div>
              <p className="text-muted-foreground">Quiz Completati</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <ChartLine className="text-success text-2xl" />
                </div>
                <span className="text-3xl font-bold text-success" data-testid="stat-average-score">
                  {dashboardData.stats.averageScore}%
                </span>
              </div>
              <p className="text-muted-foreground">Punteggio Medio</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Clock className="text-accent text-2xl" />
                </div>
                <span className="text-3xl font-bold text-accent" data-testid="stat-total-time">
                  {dashboardData.stats.totalTime}h
                </span>
              </div>
              <p className="text-muted-foreground">Tempo Totale</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <Flame className="text-warning text-2xl" />
                </div>
                <span className="text-3xl font-bold text-warning" data-testid="stat-current-streak">
                  {dashboardData.stats.currentStreak}
                </span>
              </div>
              <p className="text-muted-foreground">Giorni Consecutivi</p>
            </CardContent>
          </Card>
        </div>

        {/* Gamification Section */}
        {gamificationData && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">Gamification</h3>
                <p className="text-muted-foreground">I tuoi progressi e riconoscimenti</p>
              </div>
              <Link href="/leaderboard">
                <Button variant="outline" data-testid="button-view-leaderboard">
                  <Trophy className="w-4 h-4 mr-2" />
                  Vedi Classifica
                </Button>
              </Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <LevelProgress 
                level={gamificationData.profile.level} 
                totalPoints={gamificationData.profile.totalPoints} 
              />
              <StreakTracker 
                currentStreak={gamificationData.profile.currentStreak} 
                longestStreak={gamificationData.profile.longestStreak} 
              />
              <DailyChallenge />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BadgeGrid badges={gamificationData.badges} />
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold mb-2">Posizione Globale</h4>
                    {gamificationData.leaderboardPosition ? (
                      <>
                        <p className="text-4xl font-bold text-primary mb-2" data-testid="leaderboard-rank">
                          #{gamificationData.leaderboardPosition.rank}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          {(gamificationData.leaderboardPosition.totalPoints || 0).toLocaleString()} punti totali
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-4xl font-bold text-muted-foreground mb-2" data-testid="leaderboard-rank">
                          N/A
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Completa quiz per entrare in classifica
                        </p>
                      </>
                    )}
                    <Link href="/leaderboard">
                      <Button size="sm" className="w-full">
                        Vedi Classifica Completa
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Recent Activity & Progress */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Quiz History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Attività Recente</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.recentAttempts.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentAttempts.map((attempt, index) => (
                      <div 
                        key={attempt.id} 
                        className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-primary transition-colors"
                        data-testid={`recent-attempt-${index}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <ShieldCheck className="text-primary text-xl" />
                          </div>
                          <div>
                            <h4 className="font-semibold" data-testid={`attempt-title-${index}`}>
                              {attempt.quizTitle}
                            </h4>
                            <p className="text-sm text-muted-foreground" data-testid={`attempt-date-${index}`}>
                              Completato il {new Date(attempt.completedAt).toLocaleDateString('it-IT')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              attempt.score >= 80 ? 'text-success' : 
                              attempt.score >= 60 ? 'text-warning' : 'text-destructive'
                            }`} data-testid={`attempt-score-${index}`}>
                              {attempt.score}%
                            </div>
                            <p className="text-xs text-muted-foreground" data-testid={`attempt-details-${index}`}>
                              {attempt.correctAnswers}/{attempt.totalQuestions} corrette
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/quiz-reports/${attempt.id}/download`, '_blank')}
                            data-testid={`button-download-report-${index}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nessun Quiz Completato</h3>
                    <p className="text-muted-foreground mb-4">Inizia il tuo primo quiz per vedere i progressi qui</p>
                    <Link href="/">
                      <Button data-testid="button-start-first-quiz">Inizia Quiz</Button>
                    </Link>
                  </div>
                )}

                {dashboardData.recentAttempts.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-6"
                    data-testid="button-view-all-history"
                  >
                    Visualizza Tutto lo Storico
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress & Achievements */}
          <div className="space-y-6">
            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Progresso Apprendimento</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.progress.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.progress.map((progress, index) => (
                      <div key={progress.categoryId} data-testid={`progress-category-${index}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            {categoryNames[progress.categoryId] || 'Altro'}
                          </span>
                          <span className={`text-sm font-semibold ${
                            progress.averageScore >= 80 ? 'text-success' : 
                            progress.averageScore >= 60 ? 'text-warning' : 'text-primary'
                          }`} data-testid={`progress-score-${index}`}>
                            {progress.quizzesCompleted}/5
                          </span>
                        </div>
                        <Progress 
                          value={(progress.quizzesCompleted / 5) * 100} 
                          className="h-2"
                          data-testid={`progress-bar-${index}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <ChartLine className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Inizia dei quiz per vedere i progressi</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Traguardi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`text-center p-3 rounded-lg ${
                    dashboardData.stats.quizzesCompleted >= 10 ? 'bg-warning/10' : 'bg-muted/20'
                  }`} data-testid="achievement-10-quizzes">
                    <Award className={`text-2xl mb-2 mx-auto ${
                      dashboardData.stats.quizzesCompleted >= 10 ? 'text-warning' : 'text-muted-foreground'
                    }`} />
                    <p className="text-xs font-medium">10 Quiz</p>
                  </div>
                  
                  <div className={`text-center p-3 rounded-lg ${
                    dashboardData.stats.averageScore >= 90 ? 'bg-success/10' : 'bg-muted/20'
                  }`} data-testid="achievement-90-percent">
                    <Star className={`text-2xl mb-2 mx-auto ${
                      dashboardData.stats.averageScore >= 90 ? 'text-success' : 'text-muted-foreground'
                    }`} />
                    <p className="text-xs font-medium">90%+ Score</p>
                  </div>
                  
                  <div className={`text-center p-3 rounded-lg ${
                    dashboardData.stats.currentStreak >= 7 ? 'bg-primary/10' : 'bg-muted/20'
                  }`} data-testid="achievement-7-day-streak">
                    <Flame className={`text-2xl mb-2 mx-auto ${
                      dashboardData.stats.currentStreak >= 7 ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className="text-xs font-medium">7 Day Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Status or Next Goal */}
            {(user as User)?.isPremium ? (
              <Card className="bg-gradient-to-br from-primary to-accent text-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-3">Status Premium Attivo</h3>
                  <p className="text-sm mb-4 text-white/90">
                    Hai accesso completo a tutti i quiz e funzionalità avanzate
                  </p>
                  <Badge className="bg-white text-primary">
                    <Trophy className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-br from-primary to-accent text-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-3">Prossimo Obiettivo</h3>
                  <p className="text-sm mb-4 text-white/90">
                    Upgrading to Premium unlocks all premium quizzes and advanced features
                  </p>
                  <Link href="/subscribe">
                    <Button 
                      className="w-full bg-white text-primary hover:bg-white/90"
                      data-testid="button-upgrade-premium"
                    >
                      Upgrade Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
