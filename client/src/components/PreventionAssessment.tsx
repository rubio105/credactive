import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Loader2,
  ClipboardCheck,
  User,
  Briefcase,
  FileText
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

interface AssessmentQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  orderIndex: number;
}

interface Assessment {
  id: string;
  title: string;
  status: string;
  score?: number;
  riskLevel?: string;
  recommendations?: string[];
  questions?: AssessmentQuestion[];
  userAge: number;
  userGender: string;
  userProfession: string;
}

const demographicsSchema = z.object({
  userAge: z.number().int().min(1).max(120),
  userGender: z.string().min(1),
  userProfession: z.string().min(1),
});

type DemographicsForm = z.infer<typeof demographicsSchema>;

interface PreventionAssessmentProps {
  onComplete?: () => void;
}

export default function PreventionAssessment({ onComplete }: PreventionAssessmentProps) {
  const [currentStep, setCurrentStep] = useState<'demographics' | 'questions' | 'results'>('demographics');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [userResponses, setUserResponses] = useState<Array<{ questionId: string; answer: string; isCorrect: boolean }>>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<DemographicsForm>({
    resolver: zodResolver(demographicsSchema),
  });

  // Start assessment mutation
  const startAssessmentMutation = useMutation({
    mutationFn: async (data: DemographicsForm) => {
      const response = await apiRequest("/api/prevention/assessment/start", "POST", data);
      return response as unknown as Assessment;
    },
    onSuccess: (data: Assessment) => {
      setAssessment(data);
      setCurrentStep('questions');
    },
  });

  // Save response mutation
  const saveResponseMutation = useMutation({
    mutationFn: ({ assessmentId, questionId, selectedAnswer, isCorrect }: any) =>
      apiRequest(`/api/prevention/assessment/${assessmentId}/response`, "POST", {
        questionId,
        selectedAnswer,
        isCorrect,
      }),
  });

  // Complete assessment mutation
  const completeAssessmentMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await apiRequest(`/api/prevention/assessment/${assessmentId}/complete`, "POST", {});
      return response as unknown as Assessment;
    },
    onSuccess: (data: Assessment) => {
      setAssessment(data);
      setCurrentStep('results');
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/assessment/latest"] });
    },
  });

  const onSubmitDemographics = (data: DemographicsForm) => {
    startAssessmentMutation.mutate(data);
  };

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || !assessment?.questions) return;

    const currentQuestion = assessment.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    // Save response to backend
    await saveResponseMutation.mutateAsync({
      assessmentId: assessment.id,
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
    });

    // Track response locally (update if exists, otherwise add)
    const existingIndex = userResponses.findIndex(r => r.questionId === currentQuestion.id);
    if (existingIndex >= 0) {
      const updated = [...userResponses];
      updated[existingIndex] = { questionId: currentQuestion.id, answer: selectedAnswer, isCorrect };
      setUserResponses(updated);
    } else {
      setUserResponses([...userResponses, {
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        isCorrect,
      }]);
    }

    // Move to next question or complete
    if (assessment.questions && currentQuestionIndex < (assessment.questions.length - 1)) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Restore previous answer if going to already-answered question
      const nextResponse = userResponses.find(r => r.questionId === assessment.questions?.[currentQuestionIndex + 1]?.id);
      setSelectedAnswer(nextResponse?.answer || "");
    } else {
      // All questions answered, complete assessment
      completeAssessmentMutation.mutate(assessment.id);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Find saved response for this specific question
      const prevQuestion = assessment?.questions?.[currentQuestionIndex - 1];
      const previousResponse = userResponses.find(r => r.questionId === prevQuestion?.id);
      setSelectedAnswer(previousResponse?.answer || "");
    }
  };

  const progress = assessment?.questions 
    ? ((currentQuestionIndex + 1) / assessment.questions.length) * 100
    : 0;

  // Demographics Step
  if (currentStep === 'demographics') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-2xl mx-auto"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-primary" />
              Assessment Prevenzione Sanitaria
            </CardTitle>
            <CardDescription>
              Compila i tuoi dati per ricevere domande personalizzate sulla prevenzione
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmitDemographics)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="userAge" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Età
                </Label>
                <Input
                  id="userAge"
                  type="number"
                  data-testid="input-age"
                  {...register("userAge", { valueAsNumber: true })}
                  placeholder="Es: 35"
                />
                {errors.userAge && (
                  <p className="text-sm text-destructive">{errors.userAge.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="userGender">Genere</Label>
                <RadioGroup
                  onValueChange={(value) => register("userGender").onChange({ target: { value } })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Maschio" id="male" data-testid="radio-male" />
                    <Label htmlFor="male">Maschio</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Femmina" id="female" data-testid="radio-female" />
                    <Label htmlFor="female">Femmina</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Altro" id="other" data-testid="radio-other" />
                    <Label htmlFor="other">Altro</Label>
                  </div>
                </RadioGroup>
                {errors.userGender && (
                  <p className="text-sm text-destructive">{errors.userGender.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="userProfession" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Professione
                </Label>
                <Input
                  id="userProfession"
                  data-testid="input-profession"
                  {...register("userProfession")}
                  placeholder="Es: Insegnante, Medico, Impiegato"
                />
                {errors.userProfession && (
                  <p className="text-sm text-destructive">{errors.userProfession.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={startAssessmentMutation.isPending}
                data-testid="button-start-assessment"
              >
                {startAssessmentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generazione domande...
                  </>
                ) : (
                  <>
                    Inizia Assessment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Helper to extract answer letter from option string
  const getAnswerLetter = (option: string, index: number): string => {
    // Try to extract letter from start of option (e.g., "A) ..." -> "A")
    const match = option.match(/^([A-D])[).:]/);
    if (match) return match[1];
    // Fallback to index-based mapping
    return ['A', 'B', 'C', 'D'][index] || 'A';
  };

  // Questions Step
  if (currentStep === 'questions' && assessment?.questions) {
    const currentQuestion = assessment.questions[currentQuestionIndex];

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Domanda {currentQuestionIndex + 1} di {assessment.questions.length}</span>
            <span>{Math.round(progress)}% completato</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{currentQuestion.questionText}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={selectedAnswer}
                  onValueChange={setSelectedAnswer}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => {
                    const answerLetter = getAnswerLetter(option, index);
                    return (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <RadioGroupItem 
                          value={answerLetter} 
                          id={`option-${index}`}
                          data-testid={`radio-option-${index}`}
                        />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    data-testid="button-previous"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Indietro
                  </Button>

                  <Button
                    onClick={handleAnswerSubmit}
                    disabled={!selectedAnswer || saveResponseMutation.isPending}
                    data-testid="button-next"
                  >
                    {saveResponseMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : currentQuestionIndex === assessment.questions.length - 1 ? (
                      <>
                        Completa Assessment
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Avanti
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Results Step
  if (currentStep === 'results' && assessment) {
    const getRiskColor = (level?: string) => {
      switch (level) {
        case 'low': return 'bg-green-500';
        case 'medium': return 'bg-yellow-500';
        case 'high': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    };

    const getRiskLabel = (level?: string) => {
      switch (level) {
        case 'low': return 'Rischio Basso';
        case 'medium': return 'Rischio Moderato';
        case 'high': return 'Rischio Alto';
        default: return 'Non valutato';
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-3xl">Assessment Completato!</CardTitle>
            <CardDescription>Ecco i tuoi risultati personalizzati</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Punteggio</p>
              <p className="text-6xl font-bold text-primary">{assessment.score}%</p>
            </div>

            {/* Risk Level */}
            <div className="flex justify-center">
              <Badge className={`${getRiskColor(assessment.riskLevel)} text-white px-6 py-2 text-lg`}>
                {getRiskLabel(assessment.riskLevel)}
              </Badge>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Raccomandazioni Personalizzate:</h3>
              <ul className="space-y-2">
                {assessment.recommendations?.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => {
                  // Download PDF report
                  window.open(`/api/prevention/assessment/${assessment.id}/pdf`, '_blank');
                }}
                variant="outline"
                className="flex-1"
                data-testid="button-download-pdf"
              >
                <FileText className="w-4 h-4 mr-2" />
                Scarica Report PDF
              </Button>
              <Button 
                onClick={onComplete}
                className="flex-1"
                data-testid="button-back-to-hub"
              >
                Torna al Hub Prevenzione
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            I risultati di questo assessment sono a scopo educativo. Per una valutazione medica completa, 
            consultare sempre un professionista sanitario.
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  return null;
}
