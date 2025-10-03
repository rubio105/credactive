import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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

interface QuizReport {
  id: string;
  attemptId: string;
  userId: string;
  quizId: string;
  reportData: ReportData;
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
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

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
