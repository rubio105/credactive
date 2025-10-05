import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useLocation } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Video, CheckCircle, Lock, Play, AlertCircle, Crown } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CourseVideo {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration?: number;
  sortOrder: number;
  thumbnailUrl?: string;
  requiresQuiz: boolean;
}

interface VideoQuestion {
  id: string;
  videoId: string;
  question: string;
  options: Array<{ label: string; text: string }>;
  correctAnswer: string;
  explanation?: string;
  sortOrder: number;
}

interface UserVideoProgress {
  videoId: string;
  completed: boolean;
  quizPassed: boolean;
  watchedSeconds: number;
}

interface CourseWithVideos {
  id: string;
  title: string;
  description?: string;
  instructor?: string;
  difficulty?: string;
  duration?: string;
  thumbnailUrl?: string;
  videos: CourseVideo[];
  userProgress: UserVideoProgress[];
}

export default function CorsoOnDemand() {
  const { courseId } = useParams<{ courseId: string }>();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({});

  const isPremiumPlus = user?.subscriptionTier === 'premium_plus';

  const { data: course, isLoading: courseLoading } = useQuery<CourseWithVideos>({
    queryKey: ["/api/on-demand-courses", courseId],
    enabled: !!courseId && isPremiumPlus,
  });

  const { data: questions } = useQuery<VideoQuestion[]>({
    queryKey: ["/api/course-videos", course?.videos[currentVideoIndex]?.id, "questions"],
    enabled: !!course?.videos[currentVideoIndex]?.id && showQuiz,
  });

  const updateProgressMutation = useMutation({
    mutationFn: (data: { videoId: string; watchedSeconds: number }) =>
      apiRequest(`/api/course-videos/${data.videoId}/progress`, "POST", { watchedSeconds: data.watchedSeconds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/on-demand-courses", courseId] });
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: (data: { videoId: string; answers: Record<string, string> }) =>
      apiRequest(`/api/course-videos/${data.videoId}/quiz`, "POST", { answers: data.answers }),
    onSuccess: (response) => {
      return response.json();
    },
  });

  useEffect(() => {
    if (course && course.videos.length > 0) {
      const lastIncompleteIndex = course.videos.findIndex((video, index) => {
        const progress = course.userProgress.find(p => p.videoId === video.id);
        if (!progress || !progress.completed) return true;
        if (video.requiresQuiz && !progress.quizPassed) return true;
        return false;
      });
      
      if (lastIncompleteIndex !== -1) {
        setCurrentVideoIndex(lastIncompleteIndex);
      }
    }
  }, [course]);

  const currentVideo = course?.videos[currentVideoIndex];
  const currentProgress = course?.userProgress.find(p => p.videoId === currentVideo?.id);
  const canAccessVideo = (index: number) => {
    if (index === 0) return true;
    
    const previousVideo = course?.videos[index - 1];
    const previousProgress = course?.userProgress.find(p => p.videoId === previousVideo?.id);
    
    if (!previousProgress || !previousProgress.completed) return false;
    if (previousVideo?.requiresQuiz && !previousProgress.quizPassed) return false;
    
    return true;
  };

  const handleVideoEnd = () => {
    if (!currentVideo) return;
    
    updateProgressMutation.mutate({
      videoId: currentVideo.id,
      watchedSeconds: currentVideo.duration || 0,
    });

    if (currentVideo.requiresQuiz && !currentProgress?.quizPassed) {
      setShowQuiz(true);
    } else {
      handleNextVideo();
    }
  };

  const handleSubmitQuiz = async () => {
    if (!currentVideo || !questions) return;

    if (Object.keys(quizAnswers).length < questions.length) {
      toast({
        title: "Quiz Incompleto",
        description: "Rispondi a tutte le domande prima di inviare",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await submitQuizMutation.mutateAsync({
        videoId: currentVideo.id,
        answers: quizAnswers,
      });

      const results: Record<string, boolean> = {};
      questions.forEach((q) => {
        results[q.id] = quizAnswers[q.id] === q.correctAnswer;
      });
      
      setQuizResults(results);
      setQuizSubmitted(true);

      const allCorrect = Object.values(results).every(r => r);
      
      if (allCorrect) {
        toast({
          title: "Quiz Completato!",
          description: "Hai risposto correttamente a tutte le domande!",
        });
        
        setTimeout(() => {
          setShowQuiz(false);
          setQuizSubmitted(false);
          setQuizAnswers({});
          setQuizResults({});
          handleNextVideo();
        }, 3000);
      } else {
        const correctCount = Object.values(results).filter(r => r).length;
        toast({
          title: "Quiz Non Superato",
          description: `Hai risposto correttamente a ${correctCount}/${questions.length} domande. Riprova!`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio del quiz",
        variant: "destructive",
      });
    }
  };

  const handleRetryQuiz = () => {
    setQuizSubmitted(false);
    setQuizAnswers({});
    setQuizResults({});
  };

  const handleNextVideo = () => {
    if (course && currentVideoIndex < course.videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      setShowQuiz(false);
      setQuizSubmitted(false);
      setQuizAnswers({});
      setQuizResults({});
    }
  };

  if (authLoading || courseLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Caricamento corso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isPremiumPlus) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card className="text-center p-12">
            <div className="inline-block p-4 bg-purple-500/10 rounded-full mb-6">
              <Lock className="w-12 h-12 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Accesso Premium Plus Richiesto</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Questo corso è disponibile solo per gli abbonati Premium Plus.
            </p>
            <Link href="/subscribe">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Crown className="w-5 h-5 mr-2" />
                Passa a Premium Plus
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card className="text-center p-12">
            <h1 className="text-2xl font-bold mb-4">Corso non trovato</h1>
            <Button onClick={() => setLocation("/corsi-on-demand")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna ai Corsi
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const completedVideos = course.userProgress.filter(p => p.completed && (!course.videos.find(v => v.id === p.videoId)?.requiresQuiz || p.quizPassed)).length;
  const progressPercentage = (completedVideos / course.videos.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/corsi-on-demand")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna ai Corsi
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Progresso del corso</span>
                    <span>{completedVideos}/{course.videos.length} video completati</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </CardHeader>

              <CardContent>
                {!showQuiz ? (
                  <div>
                    <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden">
                      {currentVideo?.videoUrl ? (
                        <iframe
                          src={currentVideo.videoUrl}
                          className="w-full h-full"
                          allowFullScreen
                          data-testid="video-player"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-16 h-16 text-white/50" />
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold mb-2" data-testid="text-video-title">
                      {currentVideo?.title}
                    </h3>
                    {currentVideo?.description && (
                      <p className="text-muted-foreground mb-4">{currentVideo.description}</p>
                    )}

                    <div className="flex gap-4">
                      <Button 
                        onClick={handleVideoEnd}
                        className="flex-1"
                        data-testid="button-complete-video"
                      >
                        {currentVideo?.requiresQuiz && !currentProgress?.quizPassed ? (
                          <>
                            Completa e Rispondi al Quiz
                            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                          </>
                        ) : (
                          <>
                            Segna come Completato
                            <CheckCircle className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-2xl font-semibold mb-6">Quiz - {currentVideo?.title}</h3>
                    
                    {questions && questions.length > 0 ? (
                      <div className="space-y-6">
                        {questions.map((question, qIndex) => {
                          const isAnswered = !!quizAnswers[question.id];
                          const isCorrect = quizResults[question.id];
                          
                          return (
                            <Card key={question.id} className={quizSubmitted ? (isCorrect ? "border-green-500" : "border-red-500") : ""}>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-start justify-between">
                                  <span>
                                    {qIndex + 1}. {question.question}
                                  </span>
                                  {quizSubmitted && (
                                    isCorrect ? (
                                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    ) : (
                                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    )
                                  )}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <RadioGroup
                                  value={quizAnswers[question.id] || ""}
                                  onValueChange={(value) => {
                                    if (!quizSubmitted) {
                                      setQuizAnswers({ ...quizAnswers, [question.id]: value });
                                    }
                                  }}
                                  disabled={quizSubmitted}
                                >
                                  {question.options.map((option) => (
                                    <div key={option.label} className="flex items-center space-x-2 mb-2">
                                      <RadioGroupItem 
                                        value={option.label} 
                                        id={`${question.id}-${option.label}`}
                                        data-testid={`radio-question-${question.id}-${option.label}`}
                                      />
                                      <Label 
                                        htmlFor={`${question.id}-${option.label}`}
                                        className={`flex-1 cursor-pointer ${
                                          quizSubmitted && option.label === question.correctAnswer
                                            ? "text-green-600 font-semibold"
                                            : quizSubmitted && option.label === quizAnswers[question.id] && !isCorrect
                                            ? "text-red-600"
                                            : ""
                                        }`}
                                      >
                                        {option.label}. {option.text}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                                
                                {quizSubmitted && question.explanation && (
                                  <Alert className="mt-4">
                                    <AlertDescription>{question.explanation}</AlertDescription>
                                  </Alert>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}

                        <div className="flex gap-4">
                          {!quizSubmitted ? (
                            <Button 
                              onClick={handleSubmitQuiz}
                              className="flex-1"
                              disabled={Object.keys(quizAnswers).length < questions.length}
                              data-testid="button-submit-quiz"
                            >
                              Invia Risposte
                            </Button>
                          ) : Object.values(quizResults).every(r => r) ? (
                            <Button 
                              onClick={handleNextVideo}
                              className="flex-1"
                              data-testid="button-next-video"
                            >
                              Prossimo Video
                              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                            </Button>
                          ) : (
                            <Button 
                              onClick={handleRetryQuiz}
                              variant="outline"
                              className="flex-1"
                              data-testid="button-retry-quiz"
                            >
                              Riprova Quiz
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground">Nessuna domanda disponibile</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Contenuti del Corso</CardTitle>
                <CardDescription>{course.videos.length} video</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {course.videos.map((video, index) => {
                    const progress = course.userProgress.find(p => p.videoId === video.id);
                    const isCompleted = progress?.completed && (!video.requiresQuiz || progress.quizPassed);
                    const isCurrent = index === currentVideoIndex;
                    const canAccess = canAccessVideo(index);

                    return (
                      <button
                        key={video.id}
                        onClick={() => {
                          if (canAccess) {
                            setCurrentVideoIndex(index);
                            setShowQuiz(false);
                            setQuizSubmitted(false);
                            setQuizAnswers({});
                            setQuizResults({});
                          }
                        }}
                        disabled={!canAccess}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isCurrent 
                            ? "bg-primary text-primary-foreground" 
                            : canAccess
                            ? "hover:bg-muted"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                        data-testid={`button-video-${video.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`flex-shrink-0 ${isCurrent ? "text-primary-foreground" : ""}`}>
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : canAccess ? (
                                <Play className="w-5 h-5" />
                              ) : (
                                <Lock className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium truncate ${isCurrent ? "text-primary-foreground" : ""}`}>
                                {index + 1}. {video.title}
                              </p>
                              {video.duration && (
                                <p className={`text-sm ${isCurrent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                  {Math.floor(video.duration / 60)} min
                                </p>
                              )}
                            </div>
                          </div>
                          {video.requiresQuiz && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Quiz
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
