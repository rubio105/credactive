import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightColorWheel } from "@/components/InsightColorWheel";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Download,
  ArrowLeft,
  Trophy,
  Target,
  Clock,
  Palette,
  User,
  Brain,
  Heart,
  Users,
  UserPlus,
  Shield,
  Zap,
  BookOpen,
  Briefcase,
} from "lucide-react";

interface ReportData {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  passStatus: 'pass' | 'fail';
  weakAreas: Array<{
    category: string;
    wrongCount: number;
    totalCount: number;
    percentage: number;
  }>;
  strengths: string[];
  recommendations: string;
  detailedAnswers: Array<{
    questionId: string;
    question: string;
    category?: string | null;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

interface ColorScore {
  color: string;
  name: string;
  count: number;
  percentage: number;
}

interface InsightProfile {
  dominantColor: ColorScore;
  secondaryColor: ColorScore;
  colorScores: ColorScore[];
  profileType: string;
  strengths: string[];
  developmentAreas: string[];
  workingStyle: string;
  communicationStyle: string;
  recommendations: string;
  methodologicalIntroduction: string;
  oppositeType: {
    description: string;
    differences: string[];
    workingTogether: string[];
  };
  teamValue: string[];
  communicationObstacles: string[];
  detailedAnalysis?: {
    profileDescription: string;
    behavioralPatterns: string[];
    stressManagement: string[];
    leadershipStyle: string[];
    teamInteraction: string[];
    decisionMaking: string[];
    conflictResolution: string[];
    motivationalDrivers: string[];
    learningPreferences: string[];
    careerGuidance: string[];
    actionPlan: string[];
  };
}

interface QuizReport {
  id: string;
  attemptId: string;
  userId: string;
  quizId: string;
  reportData: ReportData | InsightProfile;
  weakAreas: any[];
  strengths: string[];
  recommendations: string;
  emailSent: boolean;
  createdAt: string;
}

export default function ReportPage() {
  const [, params] = useRoute("/report/:attemptId");
  const attemptId = params?.attemptId;
  const [, setLocation] = useLocation();

  const { data: report, isLoading } = useQuery<QuizReport>({
    queryKey: [`/api/quiz-reports/${attemptId}`],
    enabled: !!attemptId,
  });

  const handleDownload = () => {
    if (!attemptId) return;
    window.open(`/api/quiz-reports/${attemptId}/download`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Report non trovato</p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = report.reportData;
  
  // Type guard to check if this is an Insight Discovery report
  const isInsightProfile = (data: ReportData | InsightProfile): data is InsightProfile => {
    return 'dominantColor' in data && 'colorScores' in data;
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  // If this is an Insight Discovery personality test, show different view
  if (isInsightProfile(data)) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="mb-2"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Home
            </Button>
            <h1 className="text-3xl font-bold">Il Tuo Profilo Insight Discovery</h1>
            <p className="text-muted-foreground mt-1">
              {data.profileType}
            </p>
          </div>
          <Button variant="outline" onClick={handleDownload} data-testid="button-download-report">
            <Download className="w-4 h-4 mr-2" />
            Scarica Report
          </Button>
        </div>

        {/* Methodological Introduction */}
        <Card className="mb-6 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950 dark:to-gray-950 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-900 dark:text-slate-100">
              <BookOpen className="w-5 h-5 mr-2" />
              Fondamenti Teorici
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line text-sm leading-relaxed" data-testid="text-methodological-intro">
              {data.methodologicalIntroduction}
            </p>
          </CardContent>
        </Card>

        {/* Color Wheel - 72 Types */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              La Tua Ruota Insights Discovery a 72 Tipi
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              La ruota mostra la tua posizione unica tra i 72 tipi Insights Discovery. Ogni segmento rappresenta una sfumatura della personalità, 
              con intensità che riflette la tua distribuzione energetica tra i quattro colori fondamentali.
            </p>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <InsightColorWheel 
              colorScores={data.colorScores}
              dominantColor={data.dominantColor}
            />
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-900 dark:text-purple-100">
              <Lightbulb className="w-5 h-5 mr-2" />
              Il Tuo Profilo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Colori Dominanti</h3>
              <p className="text-muted-foreground">
                <strong className="text-foreground">{data.dominantColor.name}</strong> ({data.dominantColor.percentage}%) 
                con influenza <strong className="text-foreground">{data.secondaryColor.name}</strong> ({data.secondaryColor.percentage}%)
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Stile di Lavoro</h3>
              <p className="text-muted-foreground">{data.workingStyle}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Stile di Comunicazione</h3>
              <p className="text-muted-foreground">{data.communicationStyle}</p>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900 dark:text-blue-100">
              <Lightbulb className="w-5 h-5 mr-2" />
              Raccomandazioni Personalizzate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 dark:text-blue-200 whitespace-pre-line" data-testid="text-recommendations">
              {data.recommendations}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center text-green-900 dark:text-green-100">
                <TrendingUp className="w-5 h-5 mr-2" />
                Punti di Forza
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start" data-testid={`strength-${index}`}>
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{strength}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Development Areas */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-900 dark:text-orange-100">
                <Target className="w-5 h-5 mr-2" />
                Aree di Sviluppo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.developmentAreas.map((area, index) => (
                  <div key={index} className="flex items-start" data-testid={`development-area-${index}`}>
                    <Trophy className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{area}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Value */}
        <Card className="mb-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border-cyan-200 dark:border-cyan-800">
          <CardHeader>
            <CardTitle className="flex items-center text-cyan-900 dark:text-cyan-100">
              <Users className="w-5 h-5 mr-2" />
              Valore per il Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.teamValue.map((value, index) => (
                <div key={index} className="flex items-start" data-testid={`team-value-${index}`}>
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-cyan-800 dark:text-cyan-200">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Communication Obstacles */}
        <Card className="mb-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-900 dark:text-amber-100">
              <Shield className="w-5 h-5 mr-2" />
              Ostacoli alla Comunicazione Efficace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.communicationObstacles.map((obstacle, index) => (
                <div key={index} className="flex items-start" data-testid={`communication-obstacle-${index}`}>
                  <span className="text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0">⚠️</span>
                  <span className="text-sm text-amber-800 dark:text-amber-200">{obstacle}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Opposite Type */}
        <Card className="mb-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border-violet-200 dark:border-violet-800">
          <CardHeader>
            <CardTitle className="flex items-center text-violet-900 dark:text-violet-100">
              <UserPlus className="w-5 h-5 mr-2" />
              Il Tuo Tipo Opposto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-violet-800 dark:text-violet-200 text-sm" data-testid="text-opposite-description">
              {data.oppositeType.description}
            </p>
            
            <div>
              <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">Differenze Principali:</h4>
              <div className="space-y-2">
                {data.oppositeType.differences.map((diff, index) => (
                  <div key={index} className="flex items-start" data-testid={`opposite-difference-${index}`}>
                    <span className="text-violet-600 dark:text-violet-400 mr-2">•</span>
                    <span className="text-sm text-violet-800 dark:text-violet-200">{diff}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">Come Lavorare Insieme:</h4>
              <div className="space-y-2">
                {data.oppositeType.workingTogether.map((tip, index) => (
                  <div key={index} className="flex items-start" data-testid={`opposite-working-${index}`}>
                    <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-violet-800 dark:text-violet-200">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analysis Sections */}
        {data.detailedAnalysis && (
          <>
            {/* Profile Description */}
            <Card className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <CardTitle className="flex items-center text-indigo-900 dark:text-indigo-100">
                  <User className="w-5 h-5 mr-2" />
                  Descrizione Profilo Completa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-indigo-800 dark:text-indigo-200" data-testid="text-profile-description">
                  {data.detailedAnalysis.profileDescription}
                </p>
              </CardContent>
            </Card>

            {/* Behavioral Patterns */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Pattern Comportamentali
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.detailedAnalysis.behavioralPatterns.map((pattern, index) => (
                    <div key={index} className="flex items-start" data-testid={`behavioral-pattern-${index}`}>
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{pattern}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stress Management & Leadership */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="w-5 h-5 mr-2" />
                    Gestione dello Stress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.detailedAnalysis.stressManagement.map((tip, index) => (
                      <div key={index} className="flex items-start" data-testid={`stress-tip-${index}`}>
                        <span className="text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Stile di Leadership
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.detailedAnalysis.leadershipStyle.map((style, index) => (
                      <div key={index} className="flex items-start" data-testid={`leadership-style-${index}`}>
                        <span className="text-sm">{style}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Interaction & Decision Making */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Interazione nel Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.detailedAnalysis.teamInteraction.map((interaction, index) => (
                      <div key={index} className="flex items-start" data-testid={`team-interaction-${index}`}>
                        <span className="text-sm">{interaction}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Processo Decisionale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.detailedAnalysis.decisionMaking.map((decision, index) => (
                      <div key={index} className="flex items-start" data-testid={`decision-making-${index}`}>
                        <span className="text-sm">{decision}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conflict Resolution & Motivational Drivers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Risoluzione dei Conflitti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.detailedAnalysis.conflictResolution.map((resolution, index) => (
                      <div key={index} className="flex items-start" data-testid={`conflict-resolution-${index}`}>
                        <span className="text-sm">{resolution}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Driver Motivazionali
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.detailedAnalysis.motivationalDrivers.map((driver, index) => (
                      <div key={index} className="flex items-start" data-testid={`motivational-driver-${index}`}>
                        <span className="text-sm">{driver}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Learning Preferences & Career Guidance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Preferenze di Apprendimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.detailedAnalysis.learningPreferences.map((preference, index) => (
                      <div key={index} className="flex items-start" data-testid={`learning-preference-${index}`}>
                        <span className="text-sm">{preference}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Guida alla Carriera
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.detailedAnalysis.careerGuidance.map((guidance, index) => (
                      <div key={index} className="flex items-start" data-testid={`career-guidance-${index}`}>
                        <span className="text-sm">{guidance}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Plan */}
            <Card className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <CardTitle className="flex items-center text-emerald-900 dark:text-emerald-100">
                  <Target className="w-5 h-5 mr-2" />
                  Piano d'Azione Personalizzato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {data.detailedAnalysis.actionPlan.map((action, index) => (
                    <p key={index} className="text-sm text-emerald-800 dark:text-emerald-200" data-testid={`action-plan-${index}`}>
                      {action}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-2"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Home
          </Button>
          <h1 className="text-3xl font-bold">Report Quiz Dettagliato</h1>
          <p className="text-muted-foreground mt-1">
            Analisi completa delle tue performance
          </p>
        </div>
        <Button variant="outline" data-testid="button-download-report">
          <Download className="w-4 h-4 mr-2" />
          Scarica PDF
        </Button>
      </div>

      {/* Score Summary */}
      <Card className={`mb-6 ${data.passStatus === 'pass' ? 'border-green-500' : 'border-red-500'}`}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center space-x-4">
              {data.passStatus === 'pass' ? (
                <div className="p-3 bg-green-100 dark:bg-green-950 rounded-full">
                  <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="p-3 bg-red-100 dark:bg-red-950 rounded-full">
                  <Target className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div>
                <h2 className="text-4xl font-bold" data-testid="text-score">
                  {data.score}%
                </h2>
                <Badge
                  variant={data.passStatus === 'pass' ? 'default' : 'destructive'}
                  className="mt-2"
                  data-testid="badge-pass-status"
                >
                  {data.passStatus === 'pass' ? 'SUPERATO' : 'NON SUPERATO'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-correct">
                  {data.correctAnswers}
                </div>
                <div className="text-sm text-muted-foreground">Corrette</div>
              </div>
              <div className="text-center">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-incorrect">
                  {data.totalQuestions - data.correctAnswers}
                </div>
                <div className="text-sm text-muted-foreground">Sbagliate</div>
              </div>
              <div className="text-center">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-time">
                  {formatTime(data.timeSpent)}
                </div>
                <div className="text-sm text-muted-foreground">Tempo</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Progress value={data.score} className="h-3" data-testid="progress-score" />
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900 dark:text-blue-100">
            <Lightbulb className="w-5 h-5 mr-2" />
            Raccomandazioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800 dark:text-blue-200 whitespace-pre-line" data-testid="text-recommendations">
            {data.recommendations}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weak Areas */}
        {data.weakAreas.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-900 dark:text-orange-100">
                <TrendingDown className="w-5 h-5 mr-2" />
                Aree da Migliorare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.weakAreas.map((area, index) => (
                  <div key={index} className="space-y-2" data-testid={`weak-area-${index}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{area.category}</span>
                      <Badge variant="outline">{area.percentage}%</Badge>
                    </div>
                    <Progress value={area.percentage} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {area.wrongCount} errori su {area.totalCount} domande
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center text-green-900 dark:text-green-100">
                <TrendingUp className="w-5 h-5 mr-2" />
                Punti di Forza
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center" data-testid={`strength-${index}`}>
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                    <span>{strength}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
