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
  FileText,
  Lightbulb
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
        case 'low': return 'bg-gradient-to-r from-green-500 to-emerald-500';
        case 'medium': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
        case 'high': return 'bg-gradient-to-r from-red-500 to-rose-500';
        default: return 'bg-gradient-to-r from-gray-500 to-slate-500';
      }
    };

    const getRiskLabel = (level?: string) => {
      switch (level) {
        case 'low': return '✅ Rischio Basso';
        case 'medium': return '⚠️ Rischio Moderato';
        case 'high': return '🚨 Rischio Alto';
        default: return 'Non valutato';
      }
    };

    const getScoreColor = () => {
      const score = assessment.score || 0;
      if (score >= 70) return 'from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400';
      if (score >= 40) return 'from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400';
      return 'from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400';
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/50 dark:via-teal-950/50 dark:to-cyan-950/50 pb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg"
            >
              <CheckCircle2 className="w-14 h-14 text-white" />
            </motion.div>
            <CardTitle className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              Assessment Completato!
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Ecco i tuoi risultati personalizzati
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            {/* Score - Design circolare migliorato */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                  className="w-40 h-40 rounded-full bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center border-8 border-primary/20 shadow-2xl"
                >
                  <div className="text-center">
                    <p className={`text-6xl font-black bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}>
                      {assessment.score}
                    </p>
                    <p className="text-sm font-semibold text-muted-foreground">su 100</p>
                  </div>
                </motion.div>
                {/* Decorative rings */}
                <div className="absolute inset-0 -z-10">
                  <div className={`w-44 h-44 rounded-full border-4 ${assessment.riskLevel === 'low' ? 'border-green-400' : assessment.riskLevel === 'medium' ? 'border-yellow-400' : 'border-red-400'} -translate-x-2 -translate-y-2 opacity-20 animate-pulse`}></div>
                </div>
              </div>
            </div>

            {/* Risk Level */}
            <div className="flex justify-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Badge className={`${getRiskColor(assessment.riskLevel)} text-white px-8 py-3 text-xl font-bold shadow-lg`}>
                  {getRiskLabel(assessment.riskLevel)}
                </Badge>
              </motion.div>
            </div>

            {/* Recommendations */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-6 rounded-xl"
            >
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                Raccomandazioni Personalizzate
              </h3>
              <ul className="space-y-3">
                {assessment.recommendations?.map((rec, index) => (
                  <motion.li 
                    key={index} 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg"
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground font-medium">{rec}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Actions */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-4 pt-4"
            >
              <Button 
                onClick={() => {
                  // Download PDF report
                  window.open(`/api/prevention/assessment/${assessment.id}/pdf`, '_blank');
                }}
                variant="outline"
                className="flex-1 h-12 text-base font-semibold border-2"
                data-testid="button-download-pdf"
              >
                <FileText className="w-5 h-5 mr-2" />
                Scarica Report PDF
              </Button>
              <Button 
                onClick={onComplete}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                data-testid="button-back-to-hub"
              >
                Torna al Hub Prevenzione
              </Button>
            </motion.div>
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
