import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Sparkles, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Quiz {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  isPremium: boolean;
  isActive: boolean;
  maxQuestionsPerAttempt?: number;
  documentPdfUrl?: string;
}

interface Category {
  id: string;
  name: string;
}

export function AdminQuizzes() {
  const { toast } = useToast();
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedQuizForAI, setSelectedQuizForAI] = useState<Quiz | null>(null);
  const [aiQuestionCount, setAiQuestionCount] = useState('100');
  const [aiDifficulty, setAiDifficulty] = useState('intermediate');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: categoriesWithQuizzes, isLoading } = useQuery<Array<Category & { quizzes: Quiz[] }>>({
    queryKey: ["/api/categories-with-quizzes"],
  });

  const allQuizzes = categoriesWithQuizzes?.flatMap(cat => cat.quizzes) || [];

  // Poll for job status when generating
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!generatingJobId || jobStatus !== 'processing') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const pollJobStatus = async () => {
      try {
        const response = await fetch(`/api/admin/generation-jobs/${generatingJobId}`, {
          credentials: 'include'
        });
        const job = await response.json();
        
        if (job.status === 'completed') {
          setJobStatus('completed');
          setGeneratingJobId(null);
          queryClient.invalidateQueries({ queryKey: ["/api/categories-with-quizzes"] });
          toast({
            title: "Generazione completata!",
            description: `${job.generatedCount} domande sono state generate con successo.`
          });
        } else if (job.status === 'failed') {
          setJobStatus('failed');
          setGeneratingJobId(null);
          toast({
            title: "Generazione fallita",
            description: job.error || "Si è verificato un errore durante la generazione.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    };

    pollJobStatus(); // Initial check
    pollIntervalRef.current = setInterval(pollJobStatus, 3000); // Poll every 3 seconds

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [generatingJobId, jobStatus]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Quiz>) => apiRequest("/api/admin/quizzes", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories-with-quizzes"] });
      toast({ title: "Quiz creato con successo" });
      setIsDialogOpen(false);
      setEditingQuiz(null);
      setIsCreating(false);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<Quiz> }) =>
      apiRequest(`/api/admin/quizzes/${data.id}`, "PATCH", data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories-with-quizzes"] });
      toast({ title: "Quiz aggiornato con successo" });
      setIsDialogOpen(false);
      setEditingQuiz(null);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/quizzes/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories-with-quizzes"] });
      toast({ title: "Quiz eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const generateAIMutation = useMutation({
    mutationFn: async (data: { quizId: string; count: number; difficulty: string }) => {
      const response = await apiRequest("/api/admin/generate-questions", "POST", data);
      return await response.json();
    },
    onSuccess: (data: { jobId: string }) => {
      setGeneratingJobId(data.jobId);
      setJobStatus('processing');
      toast({ 
        title: "Generazione avviata!", 
        description: "Le domande vengono generate in background. Monitoreremo il progresso..."
      });
      setAiDialogOpen(false);
      setSelectedQuizForAI(null);
    },
    onError: () => {
      toast({ title: "Errore durante la generazione", variant: "destructive" });
      setJobStatus('idle');
    },
  });

  const handleGenerateAI = (quiz: Quiz) => {
    setSelectedQuizForAI(quiz);
    setAiDialogOpen(true);
  };

  const handleStartGeneration = () => {
    if (!selectedQuizForAI) return;
    generateAIMutation.mutate({
      quizId: selectedQuizForAI.id,
      count: parseInt(aiQuestionCount),
      difficulty: aiDifficulty,
    });
  };

  const handleEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingQuiz({
      categoryId: categories?.[0]?.id || '',
      title: '',
      description: '',
      duration: 30,
      difficulty: 'intermediate',
      isPremium: true,
      isActive: true,
    });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Errore',
        description: 'Solo file PDF sono consentiti',
        variant: 'destructive',
      });
      return;
    }

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/admin/upload-pdf', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload fallito');
      }

      const data = await response.json();
      setEditingQuiz({ ...editingQuiz, documentPdfUrl: data.url });
      toast({
        title: 'PDF caricato',
        description: `${data.pages} pagine elaborate con successo`,
      });
    } catch (error: any) {
      toast({
        title: 'Errore upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSave = () => {
    if (!editingQuiz) return;
    
    if (isCreating) {
      createMutation.mutate(editingQuiz);
    } else if (editingQuiz.id) {
      updateMutation.mutate({
        id: editingQuiz.id,
        updates: editingQuiz,
      });
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || categoryId;
  };

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div>
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/" data-testid="button-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Home
        </Link>
      </Button>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestione Quiz</h2>
          <p className="text-muted-foreground">Gestisci i quiz della piattaforma</p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-quiz">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Quiz
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titolo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Durata</TableHead>
              <TableHead>Difficoltà</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Attivo</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allQuizzes.map((quiz) => (
              <TableRow key={quiz.id} data-testid={`row-quiz-${quiz.id}`}>
                <TableCell className="font-medium">{quiz.title}</TableCell>
                <TableCell>{getCategoryName(quiz.categoryId)}</TableCell>
                <TableCell>{quiz.duration} min</TableCell>
                <TableCell>
                  <Badge variant="outline">{quiz.difficulty}</Badge>
                </TableCell>
                <TableCell>
                  {quiz.isPremium ? (
                    <Badge variant="default">Premium</Badge>
                  ) : (
                    <Badge variant="secondary">Free</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {quiz.isActive ? (
                    <Badge variant="default">Attivo</Badge>
                  ) : (
                    <Badge variant="secondary">Inattivo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGenerateAI(quiz)}
                      className="text-primary"
                      data-testid={`button-ai-quiz-${quiz.id}`}
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      AI
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(quiz)}
                      data-testid={`button-edit-quiz-${quiz.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Sei sicuro di voler eliminare questo quiz?')) {
                          deleteMutation.mutate(quiz.id);
                        }
                      }}
                      data-testid={`button-delete-quiz-${quiz.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-quiz">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Nuovo Quiz' : 'Modifica Quiz'}</DialogTitle>
            <DialogDescription>
              {isCreating ? 'Crea un nuovo quiz' : 'Modifica i dati del quiz'}
            </DialogDescription>
          </DialogHeader>
          {editingQuiz && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={editingQuiz.categoryId}
                  onValueChange={(value) => setEditingQuiz({ ...editingQuiz, categoryId: value })}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Titolo</Label>
                <Input
                  id="title"
                  value={editingQuiz.title || ''}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                  data-testid="input-title"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={editingQuiz.description || ''}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                  data-testid="textarea-description"
                />
              </div>
              <div>
                <Label htmlFor="pdf-document">Documento PDF (opzionale)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Carica un documento PDF (max 600 pagine) per generare domande basate sul contenuto
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="pdf-document"
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    disabled={uploadingPdf}
                    data-testid="input-pdf-document"
                  />
                  {uploadingPdf && <span className="text-sm text-muted-foreground">Caricamento...</span>}
                </div>
                {editingQuiz.documentPdfUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline">PDF caricato</Badge>
                    <a 
                      href={editingQuiz.documentPdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Visualizza documento
                    </a>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="maxQuestions">Numero Domande per Tentativo (opzionale)</Label>
                <Input
                  id="maxQuestions"
                  type="number"
                  value={editingQuiz.maxQuestionsPerAttempt || ''}
                  onChange={(e) => setEditingQuiz({ 
                    ...editingQuiz, 
                    maxQuestionsPerAttempt: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="Lascia vuoto per tutte le domande"
                  min="1"
                  data-testid="input-max-questions"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Limita il numero di domande mostrate per ogni tentativo. Lascia vuoto per mostrare tutte le domande disponibili.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Durata (minuti)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={editingQuiz.duration || 30}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, duration: parseInt(e.target.value) })}
                    data-testid="input-duration"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficoltà</Label>
                  <Select
                    value={editingQuiz.difficulty}
                    onValueChange={(value) => setEditingQuiz({ ...editingQuiz, difficulty: value })}
                  >
                    <SelectTrigger data-testid="select-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Principiante</SelectItem>
                      <SelectItem value="intermediate">Intermedio</SelectItem>
                      <SelectItem value="advanced">Avanzato</SelectItem>
                      <SelectItem value="expert">Esperto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isPremium">Premium</Label>
                <Switch
                  id="isPremium"
                  checked={editingQuiz.isPremium}
                  onCheckedChange={(checked) => setEditingQuiz({ ...editingQuiz, isPremium: checked })}
                  data-testid="switch-isPremium"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Attivo</Label>
                <Switch
                  id="isActive"
                  checked={editingQuiz.isActive}
                  onCheckedChange={(checked) => setEditingQuiz({ ...editingQuiz, isActive: checked })}
                  data-testid="switch-isActive"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-quiz"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent data-testid="dialog-ai-generate">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Genera Domande con AI
            </DialogTitle>
            <DialogDescription>
              {selectedQuizForAI && `Genera domande automaticamente per: ${selectedQuizForAI.title}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="ai-count">Numero di Domande</Label>
              <Input
                id="ai-count"
                type="number"
                value={aiQuestionCount}
                onChange={(e) => setAiQuestionCount(e.target.value)}
                placeholder="es. 100"
                min="1"
                max="1000"
                data-testid="input-ai-count"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Consigliato: 100-1000 domande per una buona rotazione
              </p>
            </div>
            <div>
              <Label htmlFor="ai-difficulty">Livello di Difficoltà</Label>
              <Select value={aiDifficulty} onValueChange={setAiDifficulty}>
                <SelectTrigger data-testid="select-ai-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzato</SelectItem>
                  <SelectItem value="expert">Esperto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ⚡ La generazione avverrà in background e potrebbe richiedere alcuni minuti.
                Le domande saranno automaticamente salvate nel database.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleStartGeneration} 
              disabled={generateAIMutation.isPending || !aiQuestionCount}
              data-testid="button-start-ai-generation"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generateAIMutation.isPending ? "Avvio..." : "Genera Domande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
