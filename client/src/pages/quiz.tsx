import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/navigation";
import Timer from "@/components/ui/timer";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, ArrowRight, Clock, Lightbulb, Trophy, RotateCcw, FileText, Download, Languages, Volume2, Mic, Coins } from "lucide-react";

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
  imageUrl?: string;
  options: Array<{
    label: string;
    text: string;
    explanation?: string;
  }>;
  correctAnswer: string;
  correctAnswers?: string[]; // Array of correct answers for multiple-choice questions
  explanation?: string;
  explanationAudioUrl?: string;
  category?: string;
  domain?: string; // CISSP domain or topic hint
  language?: string; // Original language of the question (it, en, es, fr)
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
  creditsEarned?: number;
  pointsEarned?: number;
  categoryScores: Array<{
    category: string;
    score: number;
  }>;
}

export default function QuizPage() {
  const [match, params] = useRoute("/quiz/:quizId");
  const quizId = params?.quizId;
  const [, setLocation] = useLocation();
  
  // Get question count from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const requestedQuestions = urlParams.get('questions');
  const maxQuestions = requestedQuestions ? parseInt(requestedQuestions) : null;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [confirmedQuestions, setConfirmedQuestions] = useState<Set<string>>(new Set());
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [quizLanguage, setQuizLanguage] = useState<'it' | 'en' | 'es'>('it'); // Language selector
  const [isInsightDiscovery, setIsInsightDiscovery] = useState(false); // Personality test flag
  const [translatedQuestions, setTranslatedQuestions] = useState<Record<string, any>>({});
  const [translatedQuizTitle, setTranslatedQuizTitle] = useState<string>(''); // Translated quiz title
  const [isGeneratingExtendedAudio, setIsGeneratingExtendedAudio] = useState(false);
  const [limitedQuestions, setLimitedQuestions] = useState<Question[]>([]);
  const [hasUsedAudio, setHasUsedAudio] = useState(false); // Track first audio invocation

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function for UI translations
  const t = (it: string, en: string, es: string = en) => {
    if (quizLanguage === 'it') return it;
    if (quizLanguage === 'es') return es;
    return en;
  };
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: quizData, isLoading } = useQuery<QuizData>({
    queryKey: ["/api/quizzes", quizId],
    enabled: !!quizId,
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (quizAttempt: any) => {
      console.log('[Quiz Submit] Starting mutation with data:', quizAttempt);
      console.log('[Quiz Submit] Is Insight Discovery:', isInsightDiscovery);
      
      const response = await apiRequest("/api/quiz-attempts", "POST", quizAttempt);
      const data = await response.json();
      console.log('[Quiz Submit] Success! Attempt ID:', data.id);
      return data;
    },
    onSuccess: (data) => {
      console.log('[Quiz Submit] onSuccess called with data:', data);
      console.log('[Quiz Submit] isInsightDiscovery flag:', isInsightDiscovery);
      
      setAttemptId(data.id); // Save attempt ID for report link
      queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard"] });
      
      // For Insight Discovery, redirect directly to report
      if (isInsightDiscovery) {
        console.log('[Quiz Submit] Redirecting to Insight Discovery report...');
        toast({
          title: t("Profilo Generato!", "Profile Generated!", "¡Perfil Generado!"),
          description: t("Il tuo profilo Insight Discovery è pronto.", "Your Insight Discovery profile is ready.", "Tu perfil Insight Discovery está listo."),
        });
        // Redirect to report page
        setTimeout(() => {
          console.log('[Quiz Submit] Executing redirect to /report/' + data.id);
          setLocation(`/report/${data.id}`);
        }, 500);
      } else {
        console.log('[Quiz Submit] Showing standard quiz completion toast');
        // Show credits earned if available
        const creditsMsg = data.creditsEarned ? t(
          ` Hai guadagnato ${data.creditsEarned} crediti!`,
          ` You earned ${data.creditsEarned} credits!`,
          ` ¡Ganaste ${data.creditsEarned} créditos!`
        ) : '';
        toast({
          title: t("Quiz Completato!", "Quiz Completed!", "¡Cuestionario Completado!"),
          description: t(`Hai ottenuto ${data.score}% di risposte corrette.`, `You got ${data.score}% correct answers.`, `Obtuviste ${data.score}% de respuestas correctas.`) + creditsMsg,
        });
        
        // Update local results with credits info
        if (results) {
          setResults({ ...results, creditsEarned: data.creditsEarned, pointsEarned: data.pointsEarned });
        }
      }
    },
    onError: (error) => {
      console.error('[Quiz Submit] onError called:', error);
      toast({
        title: t("Errore", "Error", "Error"),
        description: t("Impossibile salvare i risultati del quiz.", "Unable to save quiz results.", "No se pudieron guardar los resultados del cuestionario."),
        variant: "destructive",
      });
    },
  });

  // Initialize language preference based on user profile
  useEffect(() => {
    if (user) {
      const userLanguage = (user as any).language;
      // Set quiz language from user preference, default to Italian
      if (userLanguage === 'en' || userLanguage === 'es') {
        setQuizLanguage(userLanguage);
      } else {
        setQuizLanguage('it');
      }
    }
  }, [user]);

  // Anti-copy protection - prevent users from copying quiz questions
  useEffect(() => {
    if (!quizCompleted) {
      // Disable right-click context menu
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };

      // Disable copy, cut, and developer tools shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        // Disable Ctrl+C, Ctrl+X, Ctrl+U (view source)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x' || e.key === 'u')) {
          e.preventDefault();
          return false;
        }
        // Disable F12 (DevTools), Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console)
        if (e.key === 'F12' || 
            ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
          e.preventDefault();
          return false;
        }
      };

      // Disable text selection on the page
      const handleSelectStart = (e: Event) => {
        e.preventDefault();
        return false;
      };

      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('selectstart', handleSelectStart);

      // Cleanup event listeners when component unmounts or quiz completes
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('selectstart', handleSelectStart);
      };
    }
  }, [quizCompleted]);

  // Shuffle and limit questions based on URL parameter
  useEffect(() => {
    if (quizData && quizData.questions.length > 0) {
      let questionsToUse = [...quizData.questions];
      
      // ALWAYS shuffle questions using Fisher-Yates algorithm for randomization
      for (let i = questionsToUse.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionsToUse[i], questionsToUse[j]] = [questionsToUse[j], questionsToUse[i]];
      }
      
      // If maxQuestions is specified and less than total, take only the requested number
      if (maxQuestions && maxQuestions < questionsToUse.length) {
        questionsToUse = questionsToUse.slice(0, maxQuestions);
      }
      
      setLimitedQuestions(questionsToUse);
    }
  }, [quizData, maxQuestions]);

  // Initialize quiz when data loads
  useEffect(() => {
    if (quizData && !quizStartTime && limitedQuestions.length > 0) {
      setTimeRemaining(quizData.quiz.duration * 60); // Convert minutes to seconds
      setQuizStartTime(new Date());
      
      // Check if this is Insight Discovery personality test
      const isPersonalityTest = quizData.quiz.title.toLowerCase().includes('insight discovery');
      setIsInsightDiscovery(isPersonalityTest);
    }
  }, [quizData, quizStartTime, limitedQuestions]);

  // Translate questions and quiz title based on language selector
  useEffect(() => {
    const translateQuestions = async () => {
      if (!quizData || !user || limitedQuestions.length === 0) {
        return;
      }
      
      // Use selected language
      const targetLanguage = quizLanguage;
      
      // Find questions that need translation (where original language differs from target)
      const questionsNeedingTranslation = limitedQuestions.filter(q => {
        const originalLang = q.language || 'it'; // Default to Italian if no language specified
        return originalLang !== targetLanguage;
      });
      
      // If no questions need translation, clear translations or keep current state
      if (questionsNeedingTranslation.length === 0) {
        if (targetLanguage === 'it') {
          setTranslatedQuestions({});
          setTranslatedQuizTitle('');
        }
        return;
      }
      
      // Translate questions and quiz title
      try {
        const response = await apiRequest("/api/translate-questions", "POST", {
          questions: questionsNeedingTranslation,
          targetLanguage,
          quizTitle: quizData.quiz.title
        });
        const data = await response.json();
        
        if (data.translatedQuestions && Array.isArray(data.translatedQuestions)) {
          const translationMap: Record<string, any> = {};
          data.translatedQuestions.forEach((tq: any) => {
            translationMap[tq.id] = tq;
          });
          setTranslatedQuestions(translationMap);
        }
        
        // Set translated quiz title if available
        if (data.translatedQuizTitle) {
          setTranslatedQuizTitle(data.translatedQuizTitle);
        }
      } catch (error) {
        console.error("Translation failed:", error);
        toast({
          title: "Errore di traduzione",
          description: "Impossibile tradurre le domande. Per favore riprova.",
          variant: "destructive"
        });
      }
    };
    
    translateQuestions();
  }, [quizData, user, quizLanguage]);

  // Timer countdown
  useEffect(() => {
    // Guard: Don't run timer until quiz is properly initialized
    if (!quizStartTime || timeRemaining === null) {
      return;
    }

    if (timeRemaining > 0 && !quizCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !quizCompleted) {
      // Show toast when time expires
      toast({
        title: t("Tempo Scaduto!", "Time's Up!", "¡Tiempo Agotado!"),
        description: t(
          "Il quiz è stato inviato automaticamente. Le risposte non date contano 0 punti.",
          "The quiz has been automatically submitted. Unanswered questions count as 0 points.",
          "El cuestionario se ha enviado automáticamente. Las preguntas sin responder cuentan como 0 puntos."
        ),
        variant: "destructive"
      });
      handleSubmitQuiz();
    }
  }, [timeRemaining, quizCompleted, quizStartTime]);

  // Load saved answer when question changes
  // Track current question ID instead of full array to avoid re-renders on array instance changes
  const currentQuestionId = limitedQuestions[currentQuestionIndex]?.id;
  
  useEffect(() => {
    if (limitedQuestions.length > 0 && currentQuestionId) {
      const currentQ = limitedQuestions[currentQuestionIndex];
      const savedAnswer = answers[currentQuestionId] || (isMultipleChoice(currentQ) ? [] : "");
      setSelectedAnswer(savedAnswer);
      // Don't show explanation for personality tests
      // For arrays, check length; for strings, check truthiness
      const hasAnswer = Array.isArray(savedAnswer) ? savedAnswer.length > 0 : !!savedAnswer;
      // For multiple choice questions, only show explanation if question was confirmed
      const isMultiple = isMultipleChoice(currentQ);
      const isConfirmed = confirmedQuestions.has(currentQuestionId);
      setShowExplanation(!isInsightDiscovery && hasAnswer && (!isMultiple || isConfirmed));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, currentQuestionId, isInsightDiscovery]);

  // Helper function to check if a question has multiple correct answers
  const isMultipleChoice = (question: Question) => {
    return question.correctAnswers && Array.isArray(question.correctAnswers) && question.correctAnswers.length > 1;
  };

  const handleAnswerChange = (answer: string) => {
    if (limitedQuestions.length === 0) return;
    
    const currentQ = limitedQuestions[currentQuestionIndex];
    const questionId = currentQ.id;
    
    if (isMultipleChoice(currentQ)) {
      // Handle multiple choice - toggle the selection
      const currentAnswers = Array.isArray(selectedAnswer) ? selectedAnswer : [];
      const newAnswers = currentAnswers.includes(answer)
        ? currentAnswers.filter(a => a !== answer)
        : [...currentAnswers, answer];
      
      setSelectedAnswer(newAnswers);
      setAnswers(prev => ({
        ...prev,
        [questionId]: newAnswers
      }));
      // For multiple choice, don't show explanation until user confirms by clicking Next
      // This allows them to select multiple answers without seeing which are correct
    } else {
      // Handle single choice
      setSelectedAnswer(answer);
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
      // Don't show explanation for personality tests - just record the answer
      setShowExplanation(!isInsightDiscovery && Boolean(answer));
    }
  };

  const handleNextQuestion = () => {
    if (limitedQuestions.length === 0) return;

    // Save current answer to answers map before navigating
    const currentQ = limitedQuestions[currentQuestionIndex];
    // Normalize the answer based on question type
    const normalizedAnswer = isMultipleChoice(currentQ)
      ? (Array.isArray(selectedAnswer) ? selectedAnswer : [])
      : (typeof selectedAnswer === 'string' ? selectedAnswer : "");
    
    const updatedAnswers = {
      ...answers,
      [currentQ.id]: normalizedAnswer
    };
    setAnswers(updatedAnswers);
    
    // Mark current question as confirmed (user has submitted their answer)
    setConfirmedQuestions(prev => new Set(prev).add(currentQ.id));

    setShowExplanation(false); // Hide explanation when moving to next question
    if (currentQuestionIndex < limitedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Reset selectedAnswer based on the next question's type
      const nextQuestion = limitedQuestions[currentQuestionIndex + 1];
      const savedAnswer = updatedAnswers[nextQuestion.id];
      // Clone arrays to avoid shared references
      if (isMultipleChoice(nextQuestion)) {
        setSelectedAnswer(Array.isArray(savedAnswer) ? [...savedAnswer] : []);
      } else {
        setSelectedAnswer(typeof savedAnswer === 'string' ? savedAnswer : "");
      }
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current answer to answers map before navigating
      const currentQ = limitedQuestions[currentQuestionIndex];
      // Normalize the answer based on question type
      const normalizedAnswer = isMultipleChoice(currentQ)
        ? (Array.isArray(selectedAnswer) ? selectedAnswer : [])
        : (typeof selectedAnswer === 'string' ? selectedAnswer : "");
      
      const updatedAnswers = {
        ...answers,
        [currentQ.id]: normalizedAnswer
      };
      setAnswers(updatedAnswers);
      
      setShowExplanation(false);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Reset selectedAnswer based on the previous question's type
      const prevQuestion = limitedQuestions[currentQuestionIndex - 1];
      const savedAnswer = updatedAnswers[prevQuestion.id];
      // Clone arrays to avoid shared references
      if (isMultipleChoice(prevQuestion)) {
        setSelectedAnswer(Array.isArray(savedAnswer) ? [...savedAnswer] : []);
      } else {
        setSelectedAnswer(typeof savedAnswer === 'string' ? savedAnswer : "");
      }
    }
  };

  const handleSkipQuestion = () => {
    if (limitedQuestions.length === 0) return;
    
    const currentQ = limitedQuestions[currentQuestionIndex];
    // Normalize empty answer based on question type
    const emptyAnswer = isMultipleChoice(currentQ) ? [] : "";
    
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: emptyAnswer
    }));
    setSelectedAnswer(emptyAnswer);
    setShowExplanation(false);
    
    if (currentQuestionIndex < limitedQuestions.length - 1) {
      const nextQuestion = limitedQuestions[currentQuestionIndex + 1];
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Load next question's answer
      const savedAnswer = answers[nextQuestion.id];
      if (isMultipleChoice(nextQuestion)) {
        setSelectedAnswer(Array.isArray(savedAnswer) ? [...savedAnswer] : []);
      } else {
        setSelectedAnswer(typeof savedAnswer === 'string' ? savedAnswer : "");
      }
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = () => {
    if (!quizData || !quizStartTime || limitedQuestions.length === 0) return;

    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - quizStartTime.getTime()) / 1000);
    
    // Merge current answer with saved answers for complete results
    const currentQ = limitedQuestions[currentQuestionIndex];
    const normalizedCurrentAnswer = isMultipleChoice(currentQ)
      ? (Array.isArray(selectedAnswer) ? selectedAnswer : [])
      : (typeof selectedAnswer === 'string' ? selectedAnswer : "");
    
    const finalAnswers = {
      ...answers,
      [currentQ.id]: normalizedCurrentAnswer
    };
    
    // Calculate results
    let correctCount = 0;
    const categoryScores: Record<string, { correct: number; total: number }> = {};
    
    const answersArray = limitedQuestions.map(question => {
      const userAnswer = finalAnswers[question.id] || (isMultipleChoice(question) ? [] : "");
      let isCorrect = false;
      
      // Check if it's a multiple choice question
      if (isMultipleChoice(question) && question.correctAnswers) {
        // For multiple choice, compare arrays
        const userAnswers = Array.isArray(userAnswer) ? userAnswer.sort() : [];
        const correctAnswers = question.correctAnswers.sort();
        isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
      } else {
        // For single choice, compare strings
        isCorrect = userAnswer === question.correctAnswer;
      }
      
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

    const score = Math.round((correctCount / limitedQuestions.length) * 100);
    
    const categoryResults = Object.entries(categoryScores).map(([category, scores]) => ({
      category,
      score: Math.round((scores.correct / scores.total) * 100),
    }));

    const quizResults: QuizResults = {
      score,
      correctAnswers: correctCount,
      totalQuestions: limitedQuestions.length,
      timeSpent,
      categoryScores: categoryResults,
    };

    // For Insight Discovery, don't show local results - wait for redirect
    if (!isInsightDiscovery) {
      setResults(quizResults);
      setQuizCompleted(true);
    }

    // Submit to backend
    submitQuizMutation.mutate({
      quizId: quizData.quiz.id,
      score,
      correctAnswers: correctCount,
      totalQuestions: limitedQuestions.length,
      timeSpent,
      answers: answersArray,
    });
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedAnswer("");
    setConfirmedQuestions(new Set()); // Clear confirmed questions for fresh attempt
    setQuizCompleted(false);
    setResults(null);
    setQuizStartTime(new Date());
    setTimeRemaining(quizData!.quiz.duration * 60);
  };

  const handleExitQuiz = () => {
    const confirmMessage = t(
      "Sei sicuro di voler uscire dal quiz? Il progresso parziale sarà salvato e le domande non risposte conteranno come sbagliate.",
      "Are you sure you want to exit the quiz? Your partial progress will be saved and unanswered questions will count as incorrect.",
      "¿Estás seguro de que quieres salir del cuestionario? Tu progreso parcial se guardará y las preguntas sin responder contarán como incorrectas."
    );
    
    if (confirm(confirmMessage)) {
      // handleSubmitQuiz will include current answer automatically
      handleSubmitQuiz();
    }
  };

  const handleExtendedAudio = async () => {
    if (!currentQuestion || !currentQuestion.explanation) return;
    
    // Don't allow generating audio if no answer is selected
    if (!selectedAnswer) {
      toast({
        title: t("Nessuna Risposta Selezionata", "No Answer Selected", "No se seleccionó respuesta"),
        description: t(
          "Per favore seleziona prima una risposta.",
          "Please select an answer first.",
          "Por favor, selecciona una respuesta primero."
        ),
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingExtendedAudio(true);
    
    // Show informative toast about generation time
    toast({
      title: t("Generazione in corso...", "Generating Audio...", "Generando Audio..."),
      description: t(
        "Creazione della spiegazione vocale ampliata. Potrebbe richiedere 20-30 secondi.",
        "Creating an extended audio explanation. This may take 20-30 seconds.",
        "Creando una explicación de audio extendida. Esto puede tardar 20-30 segundos."
      ),
    });
    
    try {
      const language = quizLanguage;
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      
      // Add timeout of 60 seconds for the fetch call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch('/api/questions/' + currentQuestion.id + '/extended-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          language,
          userAnswer: selectedAnswer,
          isCorrect,
          isFirstAudio: !hasUsedAudio // Pass flag for first audio invocation
        }),
        credentials: 'include',
        signal: controller.signal
      });
      
      // Mark that audio has been used in this quiz session
      setHasUsedAudio(true);
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }
      
      // Convert response to blob and play
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      
      // Show success toast
      toast({
        title: t("Audio Pronto", "Audio Ready", "Audio Listo"),
        description: t("Riproduzione della spiegazione vocale ampliata", "Playing extended audio explanation", "Reproduciendo explicación de audio extendida"),
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: "Timeout",
          description: t(
            "La generazione dell'audio ha richiesto troppo tempo. Riprova.",
            "Audio generation took too long. Please try again.",
            "La generación de audio tardó demasiado. Inténtalo de nuevo."
          ),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("Errore", "Error", "Error"),
          description: t(
            "Impossibile generare la spiegazione vocale ampliata",
            "Failed to generate extended audio explanation",
            "No se pudo generar la explicación de audio extendida"
          ),
          variant: "destructive",
        });
      }
    } finally {
      setIsGeneratingExtendedAudio(false);
    }
  };

  if (isLoading || !limitedQuestions || limitedQuestions.length === 0) {
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
              Ecco i tuoi risultati per <span className="font-semibold text-foreground">{translatedQuizTitle || quizData.quiz.title}</span>
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

          {/* Rewards Card - Credits and Points */}
          {(results.creditsEarned !== undefined || results.pointsEarned !== undefined) && (
            <Card className="shadow-lg mb-8 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 text-center">Ricompense Guadagnate</h3>
                <div className="grid md:grid-cols-2 gap-6 text-center">
                  {results.creditsEarned !== undefined && (
                    <div>
                      <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-2 flex items-center justify-center" data-testid="credits-earned">
                        <Coins className="w-10 h-10 mr-2" />
                        {results.creditsEarned}
                      </div>
                      <p className="text-muted-foreground font-medium">Crediti Guadagnati</p>
                    </div>
                  )}
                  {results.pointsEarned !== undefined && (
                    <div>
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center justify-center" data-testid="points-earned">
                        <Trophy className="w-10 h-10 mr-2" />
                        {results.pointsEarned}
                      </div>
                      <p className="text-muted-foreground font-medium">Punti Esperienza</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
            {attemptId && (
              <Button 
                className="flex-1" 
                onClick={() => setLocation(`/report/${attemptId}`)}
                data-testid="button-view-report"
              >
                <FileText className="w-4 h-4 mr-2" />
                Visualizza Report Dettagliato
              </Button>
            )}
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

  // Get current question with translation if available
  const getCurrentQuestion = () => {
    const originalQuestion = limitedQuestions[currentQuestionIndex];
    
    // If no translation available, return original
    if (!translatedQuestions[originalQuestion.id]) {
      return originalQuestion;
    }
    
    // Apply translation
    const translation = translatedQuestions[originalQuestion.id];
    return {
      ...originalQuestion,
      question: translation.question,
      options: originalQuestion.options.map((opt: any, idx: number) => {
        // Ensure option has label and text structure
        const label = opt?.label || String.fromCharCode(65 + idx); // A, B, C, D...
        const translatedText = Array.isArray(translation.options) 
          ? translation.options[idx] 
          : (opt?.text || '');
        
        return {
          label,
          text: translatedText || opt?.text || '',
          isCorrect: opt?.isCorrect
        };
      })
    };
  };

  // Quiz Interface
  const currentQuestion = getCurrentQuestion();
  const progress = ((currentQuestionIndex + 1) / limitedQuestions.length) * 100;

  const quizTitle = translatedQuizTitle || quizData.quiz.title;
  const quizDescription = quizData.quiz.description || '';
  
  return (
    <div className="min-h-screen bg-background select-none">
      <SEO 
        title={`${quizTitle} - Quiz Online Certificazione`}
        description={`${quizDescription.substring(0, 150)}. Testa le tue conoscenze con questo quiz professionale. Domande aggiornate, spiegazioni dettagliate e report completi.`}
        keywords={`${quizTitle} quiz, ${quizTitle} certificazione, ${quizTitle} online, quiz cybersecurity, preparazione certificazione`}
      />
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1" data-testid="quiz-title">
                  {translatedQuizTitle || quizData.quiz.title}
                </h2>
                <p className="text-muted-foreground">
                  Domanda <span data-testid="current-question">{currentQuestionIndex + 1}</span> di{' '}
                  <span data-testid="total-questions">{limitedQuestions.length}</span>
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Language Selector */}
                <Select value={quizLanguage} onValueChange={(value: 'it' | 'en' | 'es') => setQuizLanguage(value)}>
                  <SelectTrigger className="w-[110px]" data-testid="language-selector">
                    <Languages className="w-4 h-4 mr-2" />
                    <SelectValue>{quizLanguage.toUpperCase()}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it" data-testid="language-it">IT</SelectItem>
                    <SelectItem value="en" data-testid="language-en">EN</SelectItem>
                    <SelectItem value="es" data-testid="language-es">ES</SelectItem>
                  </SelectContent>
                </Select>
                
                {timeRemaining !== null && <Timer timeRemaining={timeRemaining} />}
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
              
              {/* Domain Hint (for CISSP) */}
              {currentQuestion.domain && (
                <div className="mb-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-accent mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{t('Dominio:', 'Domain:', 'Dominio:')}</span> {currentQuestion.domain}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Question Image */}
              {currentQuestion.imageUrl && (
                <div className="mb-6">
                  <img 
                    src={currentQuestion.imageUrl} 
                    alt="Question illustration" 
                    className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                    data-testid="question-image"
                  />
                </div>
              )}
            </div>

            {/* Answer Options */}
            {isMultipleChoice(currentQuestion) ? (
              // Multiple Choice - Use Checkboxes
              <div>
                {currentQuestion.correctAnswers && currentQuestion.correctAnswers.length > 0 && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('Seleziona tutte le risposte corrette', 'Select all correct answers', 'Selecciona todas las respuestas correctas')} ({currentQuestion.correctAnswers.length} {t('risposte', 'answers', 'respuestas')})
                  </p>
                )}
                <div className="space-y-4">
                  {currentQuestion.options.map((option) => {
                    const userAnswers = Array.isArray(selectedAnswer) ? selectedAnswer : [];
                    const isSelected = userAnswers.includes(option.label);
                    const correctAnswers = currentQuestion.correctAnswers || [];
                    const isCorrect = correctAnswers.includes(option.label);
                    // For multiple choice, show status only if question was confirmed (user clicked Next)
                    const isQuestionConfirmed = confirmedQuestions.has(currentQuestion.id);
                    const showStatus = !isInsightDiscovery && isQuestionConfirmed;
                    const isDisabled = !isInsightDiscovery && isQuestionConfirmed;
                    
                    return (
                      <div 
                        key={option.label} 
                        className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                          showStatus && isSelected
                            ? isCorrect 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950'
                              : 'border-red-500 bg-red-50 dark:bg-red-950'
                            : showStatus && isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-950'
                              : isSelected
                                ? 'border-primary bg-primary/5'
                                : isDisabled 
                                  ? 'border-border bg-muted/30 cursor-not-allowed opacity-60'
                                  : 'border-border hover:border-primary hover:bg-primary/5'
                        }`}
                      >
                        <Checkbox 
                          id={option.label}
                          checked={isSelected}
                          onCheckedChange={() => handleAnswerChange(option.label)}
                          className="mt-1"
                          data-testid={`option-${option.label}`}
                          disabled={isDisabled}
                        />
                        <Label htmlFor={option.label} className={`flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div className="font-medium mb-1">
                            {option.label}) {option.text}
                          </div>
                        </Label>
                        {showStatus && (
                          <div className="mt-1">
                            {isCorrect ? (
                              <span className="text-green-600 dark:text-green-400 font-semibold text-sm">✓ {t('Corretto', 'Correct', 'Correcto')}</span>
                            ) : isSelected ? (
                              <span className="text-red-600 dark:text-red-400 font-semibold text-sm">✗ {t('Sbagliato', 'Wrong', 'Incorrecto')}</span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Single Choice - Use Radio Buttons
              <RadioGroup value={typeof selectedAnswer === 'string' ? selectedAnswer : ''} onValueChange={handleAnswerChange} disabled={!isInsightDiscovery && showExplanation}>
                <div className="space-y-4">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedAnswer === option.label;
                    const isCorrect = option.label === currentQuestion.correctAnswer;
                    // Don't show right/wrong status for personality tests
                    const showStatus = !isInsightDiscovery && showExplanation && isSelected;
                    const isDisabled = !isInsightDiscovery && showExplanation;
                    
                    return (
                      <div 
                        key={option.label} 
                        className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                          showStatus
                            ? isCorrect 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950'
                              : 'border-red-500 bg-red-50 dark:bg-red-950'
                            : isSelected && isInsightDiscovery
                              ? 'border-primary bg-primary/5'
                              : isDisabled 
                                ? 'border-border bg-muted/30 cursor-not-allowed opacity-60'
                                : 'border-border hover:border-primary hover:bg-primary/5'
                        }`}
                      >
                        <RadioGroupItem 
                          value={option.label} 
                          id={option.label}
                          className="mt-1"
                          data-testid={`option-${option.label}`}
                          disabled={isDisabled}
                        />
                        <Label htmlFor={option.label} className={`flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div className="font-medium mb-1">
                            {option.label}) {option.text}
                          </div>
                        </Label>
                        {showStatus && (
                          <div className="mt-1">
                            {isCorrect ? (
                              <span className="text-green-600 dark:text-green-400 font-semibold text-sm">✓ {t('Corretto', 'Correct', 'Correcto')}</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400 font-semibold text-sm">✗ {t('Sbagliato', 'Wrong', 'Incorrecto')}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* Explanation Card - Don't show for personality tests */}
        {!isInsightDiscovery && showExplanation && currentQuestion.explanation && (
          <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">{t('Spiegazione', 'Explanation', 'Explicación')}</h4>
                    <div className="flex gap-2">
                      {currentQuestion.explanationAudioUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Construct language-specific audio URL
                            const questionId = limitedQuestions[currentQuestionIndex].id;
                            const language = quizLanguage;
                            const languageSpecificUrl = `/audio-explanations/${questionId}-${language}.mp3`;
                            
                            const audio = new Audio(languageSpecificUrl);
                            audio.onerror = () => {
                              // Fallback to the stored URL if language-specific file doesn't exist
                              const fallbackAudio = new Audio(currentQuestion.explanationAudioUrl);
                              fallbackAudio.play().catch((err) => {
                                console.error('Audio playback failed:', err);
                                toast({
                                  title: t('Errore', 'Error', 'Error'),
                                  description: t(
                                    'Audio non disponibile per questa lingua',
                                    'Audio not available for this language',
                                    'Audio no disponible para este idioma'
                                  ),
                                  variant: 'destructive'
                                });
                              });
                            };
                            audio.play().catch(() => {
                              // Error will be handled by onerror event
                            });
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                          data-testid="button-play-audio"
                        >
                          <Volume2 className="w-4 h-4 mr-1" />
                          {t('Ascolta', 'Listen', 'Escuchar')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExtendedAudio}
                        disabled={isGeneratingExtendedAudio}
                        className="text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900"
                        data-testid="button-extended-audio"
                      >
                        <Mic className="w-4 h-4 mr-1" />
                        {isGeneratingExtendedAudio 
                          ? t('Generazione...', 'Generating...', 'Generando...')
                          : t('Audio Ampliato', 'Extended Audio', 'Audio Extendido')
                        }
                      </Button>
                    </div>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200" data-testid="question-explanation">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            data-testid="button-previous"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('Precedente', 'Previous', 'Anterior')}
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleSkipQuestion}
              data-testid="button-skip"
            >
              {t('Salta', 'Skip', 'Saltar')}
            </Button>
            <Button
              onClick={handleNextQuestion}
              disabled={Array.isArray(selectedAnswer) ? selectedAnswer.length === 0 : !selectedAnswer}
              data-testid="button-next"
            >
              {currentQuestionIndex === limitedQuestions.length - 1 
                ? t('Termina', 'Finish', 'Terminar')
                : t('Prossima', 'Next', 'Siguiente')
              }
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Quiz Tips - Show domain hint instead of explanation */}
        {currentQuestion.domain && (
          <Card className="mt-8 bg-accent/10 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Lightbulb className="text-accent text-xl mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-accent mb-1">{t('Dominio/Area', 'Domain/Area', 'Dominio/Área')}</h4>
                  <p className="text-sm text-muted-foreground" data-testid="question-domain-hint">
                    {currentQuestion.domain}
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
