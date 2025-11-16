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
import { Pencil, Trash2, Plus, Sparkles, ArrowLeft, Gamepad2 } from "lucide-react";
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
  visibilityType?: 'public' | 'corporate_exclusive';
  gamingEnabled?: boolean;
  crosswordSolutionsCount?: number;
}

interface CorporateAgreement {
  id: string;
  companyName: string;
  isActive: boolean;
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
  const [selectedCorporateAccess, setSelectedCorporateAccess] = useState<string[]>([]);
  // Gaming/Crossword states
  const [gamingDialogOpen, setGamingDialogOpen] = useState(false);
  const [selectedQuizForGaming, setSelectedQuizForGaming] = useState<Quiz | null>(null);
  const [solutionsCount, setSolutionsCount] = useState('15');

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: corporateAgreements } = useQuery<CorporateAgreement[]>({
    queryKey: ["/api/admin/corporate-agreements"],
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
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<Quiz> }) =>
      apiRequest(`/api/admin/quizzes/${data.id}`, "PATCH", data.updates),
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
      console.log('=== MUTATION STARTING ===');
      console.log('Sending data:', data);
      try {
        const response = await apiRequest("/api/admin/generate-questions", "POST", data);
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        const jsonData = await response.json();
        console.log('Response JSON:', jsonData);
        return jsonData;
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    onSuccess: (data: { jobId: string }) => {
      console.log('=== MUTATION SUCCESS ===', data);
      setGeneratingJobId(data.jobId);
      setJobStatus('processing');
      toast({ 
        title: "Generazione avviata!", 
        description: "Le domande vengono generate in background. Monitoreremo il progresso..."
      });
      setAiDialogOpen(false);
      setSelectedQuizForAI(null);
    },
    onError: (error: any) => {
      console.error('=== MUTATION ERROR ===', error);
      toast({ title: "Errore durante la generazione", variant: "destructive" });
      setJobStatus('idle');
    },
  });

  const generateCrosswordMutation = useMutation({
    mutationFn: (data: { quizId: string; solutionsCount: number }) =>
      apiRequest(`/api/admin/quizzes/${data.quizId}/generate-crossword`, "POST", { solutionsCount: data.solutionsCount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories-with-quizzes"] });
      toast({ 
        title: "Cruciverba generato!", 
        description: "Il cruciverba è stato creato con successo e il quiz è ora abilitato al gaming."
      });
      setGamingDialogOpen(false);
      setSelectedQuizForGaming(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore durante la generazione", 
        description: error.message || "Si è verificato un errore",
        variant: "destructive" 
      });
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

  const handleGenerateGaming = (quiz: Quiz) => {
    setSelectedQuizForGaming(quiz);
    setSolutionsCount(quiz.crosswordSolutionsCount?.toString() || '15');
    setGamingDialogOpen(true);
  };

  const handleStartCrosswordGeneration = () => {
    if (!selectedQuizForGaming) return;
    generateCrosswordMutation.mutate({
      quizId: selectedQuizForGaming.id,
      solutionsCount: parseInt(solutionsCount),
    });
  };

  const handleEdit = async (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setIsCreating(false);
    setIsDialogOpen(true);
    
    // Load corporate access if quiz is corporate_exclusive
    if (quiz.visibilityType === 'corporate_exclusive') {
      try {
        const response = await fetch(`/api/admin/corporate-access/quiz/${quiz.id}`, {
          credentials: 'include'
        });
        const access = await response.json();
        setSelectedCorporateAccess(access.map((a: any) => a.corporateAgreementId));
      } catch (error) {
        console.error('Error loading corporate access:', error);
      }
    } else {
      setSelectedCorporateAccess([]);
    }
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
      visibilityType: 'public',
    });
    setSelectedCorporateAccess([]);
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

  const handleSave = async () => {
    if (!editingQuiz) return;
    
    try {
      if (isCreating) {
        const response = await createMutation.mutateAsync(editingQuiz);
        const result = await response.json();
        
        // Grant corporate access if needed
        if (editingQuiz.visibilityType === 'corporate_exclusive' && selectedCorporateAccess.length > 0) {
          for (const agreementId of selectedCorporateAccess) {
            await apiRequest('/api/admin/corporate-access/quiz', 'POST', {
              quizId: result.id,
              corporateAgreementId: agreementId
            });
          }
        }
      } else if (editingQuiz.id) {
        await updateMutation.mutateAsync({
          id: editingQuiz.id,
          updates: editingQuiz,
        });
        
        // Update corporate access
        if (editingQuiz.visibilityType === 'corporate_exclusive') {
          // Get current access
          const response = await fetch(`/api/admin/corporate-access/quiz/${editingQuiz.id}`, {
            credentials: 'include'
          });
          const currentAccess = await response.json();
          const currentIds = new Set(currentAccess.map((a: any) => a.corporateAgreementId));
          const selectedIds = new Set(selectedCorporateAccess);
          
          // Remove access that's no longer selected
          for (const access of currentAccess) {
            if (!selectedIds.has(access.corporateAgreementId)) {
              await apiRequest('/api/admin/corporate-access/quiz', 'DELETE', {
                quizId: editingQuiz.id,
                corporateAgreementId: access.corporateAgreementId
              });
            }
          }
          
          // Grant new access
          for (const agreementId of selectedCorporateAccess) {
            if (!currentIds.has(agreementId)) {
              await apiRequest('/api/admin/corporate-access/quiz', 'POST', {
                quizId: editingQuiz.id,
                corporateAgreementId: agreementId
              });
            }
          }
        } else {
          // Remove all corporate access if changing to public
          const response = await fetch(`/api/admin/corporate-access/quiz/${editingQuiz.id}`, {
            credentials: 'include'
          });
          const currentAccess = await response.json();
          for (const access of currentAccess) {
            await apiRequest('/api/admin/corporate-access/quiz', 'DELETE', {
              quizId: editingQuiz.id,
              corporateAgreementId: access.corporateAgreementId
            });
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/categories-with-quizzes"] });
      toast({ title: isCreating ? "Quiz creato con successo" : "Quiz aggiornato con successo" });
      setIsDialogOpen(false);
      setEditingQuiz(null);
      setSelectedCorporateAccess([]);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({ title: "Errore durante il salvataggio", variant: "destructive" });
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
        <Link href="/admin" data-testid="button-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Dashboard
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
                      size="sm"
                      onClick={() => handleGenerateGaming(quiz)}
                      className={quiz.gamingEnabled ? "text-green-600" : "text-orange-500"}
                      data-testid={`button-gaming-quiz-${quiz.id}`}
                    >
                      <Gamepad2 className="w-4 h-4 mr-1" />
                      {quiz.gamingEnabled ? "✓" : "Gaming"}
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
                <Label htmlFor="maxQuestions">Numero Domande per Tentativo (Rotazione)</Label>
                <Select
                  value={editingQuiz.maxQuestionsPerAttempt?.toString() || 'all'}
                  onValueChange={(value) => setEditingQuiz({ 
                    ...editingQuiz, 
                    maxQuestionsPerAttempt: value === 'all' ? null as any : parseInt(value)
                  })}
                >
                  <SelectTrigger data-testid="select-max-questions">
                    <SelectValue placeholder="Tutte le domande" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le domande</SelectItem>
                    <SelectItem value="10">10 domande</SelectItem>
                    <SelectItem value="20">20 domande</SelectItem>
                    <SelectItem value="30">30 domande</SelectItem>
                    <SelectItem value="40">40 domande</SelectItem>
                    <SelectItem value="50">50 domande</SelectItem>
                    <SelectItem value="60">60 domande</SelectItem>
                    <SelectItem value="70">70 domande</SelectItem>
                    <SelectItem value="80">80 domande</SelectItem>
                    <SelectItem value="90">90 domande</SelectItem>
                    <SelectItem value="100">100 domande</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Ad ogni tentativo, l'utente riceverà questo numero di domande casuali dal pool totale. Scegli "Tutte le domande" per non limitare.
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
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Visibilità Contenuto</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="visibilityType">Tipo di Visibilità</Label>
                    <Select
                      value={editingQuiz.visibilityType || 'public'}
                      onValueChange={(value: 'public' | 'corporate_exclusive') => {
                        setEditingQuiz({ ...editingQuiz, visibilityType: value });
                        if (value === 'public') {
                          setSelectedCorporateAccess([]);
                        }
                      }}
                    >
                      <SelectTrigger data-testid="select-visibility-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Pubblico (tutti gli utenti)</SelectItem>
                        <SelectItem value="corporate_exclusive">Esclusivo Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      I contenuti pubblici sono visibili a tutti. I contenuti esclusivi corporate sono visibili solo alle aziende selezionate.
                    </p>
                  </div>
                  
                  {editingQuiz.visibilityType === 'corporate_exclusive' && (
                    <div>
                      <Label>Aziende Autorizzate</Label>
                      <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                        {corporateAgreements?.filter(ca => ca.isActive).map((agreement) => (
                          <div key={agreement.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`corp-${agreement.id}`}
                              checked={selectedCorporateAccess.includes(agreement.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCorporateAccess([...selectedCorporateAccess, agreement.id]);
                                } else {
                                  setSelectedCorporateAccess(selectedCorporateAccess.filter(id => id !== agreement.id));
                                }
                              }}
                              className="rounded border-gray-300"
                              data-testid={`checkbox-corporate-${agreement.id}`}
                            />
                            <label htmlFor={`corp-${agreement.id}`} className="text-sm cursor-pointer">
                              {agreement.companyName}
                            </label>
                          </div>
                        ))}
                        {(!corporateAgreements || corporateAgreements.filter(ca => ca.isActive).length === 0) && (
                          <p className="text-sm text-muted-foreground">Nessun account corporate attivo disponibile</p>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Seleziona le aziende che possono accedere a questo quiz.
                      </p>
                    </div>
                  )}
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

      <Dialog open={gamingDialogOpen} onOpenChange={setGamingDialogOpen}>
        <DialogContent data-testid="dialog-gaming-generate">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-orange-500" />
              Genera Cruciverba Gaming
            </DialogTitle>
            <DialogDescription>
              {selectedQuizForGaming && `Genera un cruciverba interattivo per: ${selectedQuizForGaming.title}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="solutions-count">Numero di Soluzioni</Label>
              <Input
                id="solutions-count"
                type="number"
                value={solutionsCount}
                onChange={(e) => setSolutionsCount(e.target.value)}
                placeholder="es. 15"
                min="5"
                max="30"
                data-testid="input-solutions-count"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Numero di parole/soluzioni nel cruciverba (consigliato: 15-20)
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-muted-foreground">
                🎮 Il cruciverba verrà generato con AI basandosi sul tema del quiz. 
                Gli utenti potranno giocare e competere in una leaderboard!
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGamingDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleStartCrosswordGeneration} 
              disabled={generateCrosswordMutation.isPending || !solutionsCount}
              data-testid="button-start-crossword-generation"
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Gamepad2 className="w-4 h-4 mr-2" />
              {generateCrosswordMutation.isPending ? "Generazione..." : "Genera Cruciverba"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
