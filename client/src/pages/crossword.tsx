import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trophy, Clock } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CrosswordPuzzle {
  id: string;
  quizId: string | null;
  title: string;
  topic: string;
  difficulty: string;
  cluesData: any[];
  gridData: string[][];
  solutions?: Array<{ number: number; answer: string }>;
}

export default function CrosswordPage() {
  const [, params] = useRoute("/crossword/:id");
  const puzzleId = params?.id;
  const { toast } = useToast();
  
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selectedClue, setSelectedClue] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);

  // Timer
  useEffect(() => {
    if (!isTimerActive) return;
    
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive]);
  
  const { data: puzzle, isLoading } = useQuery<CrosswordPuzzle>({
    queryKey: ["/api/crossword/puzzles", puzzleId],
    enabled: !!puzzleId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implement save/submit logic
      return apiRequest(`/api/crossword/attempts/submit`, "POST", {
        puzzleId,
        answers: userAnswers,
        timeSpent: elapsedTime,
      });
    },
    onSuccess: () => {
      setIsTimerActive(false);
      toast({
        title: "Risposta salvata!",
        description: "Il tuo progresso è stato salvato.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Caricamento cruciverba...</div>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Cruciverba non trovato
            </p>
            <div className="mt-4 text-center">
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Torna alla Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const acrossClues = puzzle.cluesData.filter((c: any) => c.direction === "across");
  const downClues = puzzle.cluesData.filter((c: any) => c.direction === "down");

  const handleCellClick = (clueNumber: number) => {
    setSelectedClue(clueNumber);
  };

  const handleAnswerChange = (clueNumber: number, value: string) => {
    setUserAnswers({
      ...userAnswers,
      [clueNumber]: value.toUpperCase(),
    });
  };

  // Check if answer is correct
  const isCorrect = (clueNumber: number): boolean | null => {
    const userAnswer = userAnswers[clueNumber];
    if (!userAnswer) return null;
    
    const solution = puzzle?.solutions?.find(s => s.number === clueNumber);
    if (!solution) return null;
    
    return userAnswer === solution.answer;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Home
          </Link>
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{puzzle.title}</h1>
          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="outline">{puzzle.topic}</Badge>
              <Badge variant="secondary">{puzzle.difficulty}</Badge>
            </div>
            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950 px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="font-mono font-bold text-orange-600">
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-500" />
                  Griglia Cruciverba
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border">
                  <div 
                    className="grid gap-0.5 mx-auto"
                    style={{ 
                      gridTemplateColumns: `repeat(${puzzle.gridData[0]?.length || 15}, 2rem)`,
                      maxWidth: 'fit-content'
                    }}
                  >
                    {puzzle.gridData.map((row, rowIdx) => (
                      row.map((cell, colIdx) => {
                        const clue = puzzle.cluesData.find(
                          (c: any) => c.row === rowIdx && c.col === colIdx
                        );
                        
                        return (
                          <div
                            key={`${rowIdx}-${colIdx}`}
                            className={`
                              w-8 h-8 border flex items-center justify-center relative text-sm font-medium
                              ${cell ? 'bg-white dark:bg-slate-800 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900' : 'bg-slate-900 dark:bg-slate-950'}
                              ${selectedClue === clue?.number ? 'ring-2 ring-orange-500' : ''}
                            `}
                            onClick={() => clue && handleCellClick(clue.number)}
                          >
                            {clue && (
                              <span className="absolute top-0 left-0.5 text-[10px] text-orange-600 font-bold">
                                {clue.number}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Orizzontali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {acrossClues.map((clue: any) => (
                  <div
                    key={clue.number}
                    className={`p-2 rounded ${
                      selectedClue === clue.number ? 'bg-orange-50 dark:bg-orange-950' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600 min-w-[2rem]">
                        {clue.number}.
                      </span>
                      <div className="flex-1">
                        <p className="text-sm mb-2">{clue.clue}</p>
                        <Input
                          value={userAnswers[clue.number] || ''}
                          onChange={(e) => handleAnswerChange(clue.number, e.target.value)}
                          placeholder="Risposta..."
                          className={`h-8 text-sm uppercase ${
                            isCorrect(clue.number) === true 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' 
                              : isCorrect(clue.number) === false 
                              ? 'border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' 
                              : ''
                          }`}
                          maxLength={clue.answer.length}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verticali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {downClues.map((clue: any) => (
                  <div
                    key={clue.number}
                    className={`p-2 rounded ${
                      selectedClue === clue.number ? 'bg-orange-50 dark:bg-orange-950' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600 min-w-[2rem]">
                        {clue.number}.
                      </span>
                      <div className="flex-1">
                        <p className="text-sm mb-2">{clue.clue}</p>
                        <Input
                          value={userAnswers[clue.number] || ''}
                          onChange={(e) => handleAnswerChange(clue.number, e.target.value)}
                          placeholder="Risposta..."
                          className={`h-8 text-sm uppercase ${
                            isCorrect(clue.number) === true 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' 
                              : isCorrect(clue.number) === false 
                              ? 'border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' 
                              : ''
                          }`}
                          maxLength={clue.answer.length}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button 
              onClick={() => submitMutation.mutate()} 
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={submitMutation.isPending}
            >
              <Clock className="w-4 h-4 mr-2" />
              {submitMutation.isPending ? "Salvataggio..." : "Salva Progresso"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
