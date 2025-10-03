import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/navigation";
import Timer from "@/components/ui/timer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, ArrowRight, Clock, Lightbulb, Trophy, RotateCcw, FileText, Download } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
}

interface Question {
  id: string;
  question: string;
  options: Array<{
    label: string;
    text: string;
    explanation?: string;
  }>;
  correctAnswer: string;
  explanation?: string;
  category?: string;
}

interface QuizData {
  quiz: Quiz;
  questions: Question[];
}

interface QuizResults {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  categoryScores: Array<{
    category: string;
    score: number;
  }>;
}

export default function QuizPage() {
  const [match, params] = useRoute("/quiz/:quizId");
  const quizId = params?.quizId;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quizData, isLoading } = useQuery<QuizData>({
    queryKey: ["/api/quizzes", quizId],
    enabled: !!quizId,
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (quizAttempt: any) => {
      const response = await apiRequest("POST", "/api/quiz-attempts", quizAttempt);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard"] });
      toast({
        title: "Quiz Completato!",
        description: `Hai ottenuto ${data.score}% di risposte corrette.`,
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare i risultati del quiz.",
        variant: "destructive",
      });
    },
  });

  // Initialize quiz when data loads
  useEffect(() => {
    if (quizData && !quizStartTime) {
      setTimeRemaining(quizData.quiz.duration * 60); // Convert minutes to seconds
      setQuizStartTime(new Date());
    }
  }, [quizData, quizStartTime]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && !quizCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !quizCompleted) {
      handleSubmitQuiz();
    }
  }, [timeRemaining, quizCompleted]);

  // Load saved answer when question changes
  useEffect(() => {
    if (quizData) {
      const questionId = quizData.questions[currentQuestionIndex]?.id;
      setSelectedAnswer(answers[questionId] || "");
    }
  }, [currentQuestionIndex, answers, quizData]);

  const handleAnswerChange = (answer: string) => {
    if (!quizData) return;
    
    const questionId = quizData.questions[currentQuestionIndex].id;
    setSelectedAnswer(answer);
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (!quizData) return;

    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!quizData || !quizStartTime) return;

    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - quizStartTime.getTime()) / 1000);
    
    // Calculate results
    let correctCount = 0;
    const categoryScores: Record<string, { correct: number; total: number }> = {};
    
    const answersArray = quizData.questions.map(question => {
      const userAnswer = answers[question.id] || "";
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) correctCount++;
      
      // Track by category
      const category = question.category || "General";
      if (!categoryScores[category]) {
        categoryScores[category] = { correct: 0, total: 0 };
      }
      categoryScores[category].total++;
      if (isCorrect) categoryScores[category].correct++;
      
      return {
        questionId: question.id,
        answer: userAnswer,
        isCorrect,
      };
    });

    const score = Math.round((correctCount / quizData.questions.length) * 100);
    
    const categoryResults = Object.entries(categoryScores).map(([category, scores]) => ({
      category,
      score: Math.round((scores.correct / scores.total) * 100),
    }));

    const quizResults: QuizResults = {
      score,
      correctAnswers: correctCount,
      totalQuestions: quizData.questions.length,
      timeSpent,
      categoryScores: categoryResults,
    };

    setResults(quizResults);
    setQuizCompleted(true);

    // Submit to backend
    submitQuizMutation.mutate({
      quizId: quizData.quiz.id,
      score,
      correctAnswers: correctCount,
      totalQuestions: quizData.questions.length,
      timeSpent,
      answers: answersArray,
    });
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedAnswer("");
    setQuizCompleted(false);
    setResults(null);
    setQuizStartTime(new Date());
    setTimeRemaining(quizData!.quiz.duration * 60);
  };

  const handleExitQuiz = () => {
    if (confirm("Sei sicuro di voler uscire dal quiz? Il progresso sarà perso.")) {
      window.history.back();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento quiz...</p>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Quiz Non Trovato</h2>
            <p className="text-muted-foreground mb-4">Il quiz richiesto non esiste o non è disponibile.</p>
            <Button onClick={() => window.history.back()}>
              Torna Indietro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz Results View
  if (quizCompleted && results) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Results Header */}
          <div className="text-center mb-12">
            <div className="inline-block p-6 bg-success/10 rounded-full mb-6">
              <Trophy className="text-success text-6xl" />
            </div>
            <h2 className="text-4xl font-bold mb-4" data-testid="quiz-completed-title">Quiz Completato!</h2>
            <p className="text-xl text-muted-foreground">
              Ecco i tuoi risultati per <span className="font-semibold text-foreground">{quizData.quiz.title}</span>
            </p>
          </div>

          {/* Score Card */}
          <Card className="shadow-lg mb-8">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-5xl font-bold text-success mb-2" data-testid="final-score">
                    {results.score}%
                  </div>
                  <p className="text-muted-foreground">Punteggio Totale</p>
                </div>
                <div>
                  <div className="text-5xl font-bold text-primary mb-2">
                    <span data-testid="correct-answers">{results.correctAnswers}</span>
                    /
                    <span data-testid="total-questions">{results.totalQuestions}</span>
                  </div>
                  <p className="text-muted-foreground">Risposte Corrette</p>
                </div>
                <div>
                  <div className="text-5xl font-bold text-accent mb-2" data-testid="time-spent">
                    {Math.floor(results.timeSpent / 60)}:{String(results.timeSpent % 60).padStart(2, '0')}
                  </div>
                  <p className="text-muted-foreground">Tempo Impiegato</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Analysis */}
          <Card className="mb-8">
            <CardHeader>
              <h3 className="text-xl font-bold">Analisi Prestazioni per Categoria</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.categoryScores.map((category) => (
                  <div key={category.category}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{category.category}</span>
                      <span className={`font-semibold ${
                        category.score >= 80 ? 'text-success' : 
                        category.score >= 60 ? 'text-warning' : 'text-destructive'
                      }`} data-testid={`category-score-${category.category}`}>
                        {category.score}%
                      </span>
                    </div>
                    <Progress 
                      value={category.score} 
                      className="h-2"
                      data-testid={`category-progress-${category.category}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="flex-1" 
              onClick={handleRetakeQuiz}
              data-testid="button-retake"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Ripeti Quiz
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.history.back()}
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Home
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              data-testid="button-download-certificate"
            >
              <Download className="w-4 h-4 mr-2" />
              Scarica Certificato
            </Button>
          </div>

          {/* Recommendations */}
          <Card className="mt-8 bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h4 className="font-semibold text-primary mb-3 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2" />
                Raccomandazioni
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {results.categoryScores.filter(c => c.score >= 80).length > 0 && (
                  <li className="flex items-start" data-testid="recommendation-good">
                    <span className="text-primary mr-2">✓</span>
                    <span>Ottimo lavoro nelle categorie dove hai ottenuto punteggi alti! Continua così.</span>
                  </li>
                )}
                {results.categoryScores.filter(c => c.score < 70).length > 0 && (
                  <li className="flex items-start" data-testid="recommendation-improve">
                    <span className="text-warning mr-2">📚</span>
                    <span>Considera di rivedere i concetti nelle aree con punteggio più basso.</span>
                  </li>
                )}
                <li className="flex items-start" data-testid="recommendation-continue">
                  <span className="text-accent mr-2">🎓</span>
                  <span>Prova altri quiz per approfondire le tue conoscenze in cybersecurity.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz Interface
  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1" data-testid="quiz-title">
                  {quizData.quiz.title}
                </h2>
                <p className="text-muted-foreground">
                  Domanda <span data-testid="current-question">{currentQuestionIndex + 1}</span> di{' '}
                  <span data-testid="total-questions">{quizData.questions.length}</span>
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Timer timeRemaining={timeRemaining} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExitQuiz}
                  data-testid="button-exit"
                >
                  ✕
                </Button>
              </div>
            </div>
            
            <Progress value={progress} className="h-2" data-testid="quiz-progress" />
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="mb-6">
              <Badge variant="secondary" className="mb-4" data-testid="question-category">
                {currentQuestion.category || "General"}
              </Badge>
              <h3 className="text-xl font-semibold mb-6 leading-relaxed" data-testid="question-text">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Answer Options */}
            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerChange}>
              <div className="space-y-4">
                {currentQuestion.options.map((option) => (
                  <div key={option.label} className="flex items-start space-x-3 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors hover:bg-primary/5">
                    <RadioGroupItem 
                      value={option.label} 
                      id={option.label}
                      className="mt-1"
                      data-testid={`option-${option.label}`}
                    />
                    <Label htmlFor={option.label} className="flex-1 cursor-pointer">
                      <div className="font-medium mb-1">
                        {option.label}) {option.text}
                      </div>
                      {option.explanation && (
                        <p className="text-sm text-muted-foreground">
                          {option.explanation}
                        </p>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            data-testid="button-previous"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Precedente
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => handleAnswerChange("")}
              data-testid="button-skip"
            >
              Salta
            </Button>
            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
              data-testid="button-next"
            >
              {currentQuestionIndex === quizData.questions.length - 1 ? "Termina" : "Prossima"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Quiz Tips */}
        {currentQuestion.explanation && (
          <Card className="mt-8 bg-accent/10 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Lightbulb className="text-accent text-xl mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-accent mb-1">Suggerimento</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
