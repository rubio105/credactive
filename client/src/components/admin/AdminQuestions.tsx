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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, Plus, PlusCircle, X, Upload, Image as ImageIcon, ArrowLeft, Volume2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Question {
  id: string;
  quizId: string;
  question: string;
  imageUrl?: string;
  options: { text: string; isCorrect: boolean; label?: string; explanation?: string }[];
  correctAnswer?: string; // Legacy: single correct answer
  correctAnswers?: string[]; // Array of correct answer labels
  explanation: string;
  explanationAudioUrl?: string;
  difficulty: string;
  language?: string; // Original language (it, en, es, fr)
}

interface Quiz {
  id: string;
  title: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
}

export function AdminQuestions() {
  const { toast } = useToast();
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedQuiz, setSelectedQuiz] = useState<string>('all');
  const [questionType, setQuestionType] = useState<string>('all'); // all, ai, manual
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Reset selections when filters change to prevent deleting hidden questions
  useEffect(() => {
    setSelectedQuestions(new Set());
  }, [selectedCategory, selectedQuiz, questionType]);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: categoriesWithQuizzes } = useQuery<Array<Category & { quizzes: Quiz[] }>>({
    queryKey: ["/api/categories-with-quizzes"],
  });

  const allQuizzes = categoriesWithQuizzes?.flatMap(cat => cat.quizzes) || [];

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: ["/api/admin/questions"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Question>) => apiRequest("/api/admin/questions", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      toast({ title: "Domanda creata con successo" });
      setIsDialogOpen(false);
      setEditingQuestion(null);
      setIsCreating(false);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<Question> }) =>
      apiRequest(`/api/admin/questions/${data.id}`, "PATCH", data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      toast({ title: "Domanda aggiornata con successo" });
      setIsDialogOpen(false);
      setEditingQuestion(null);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/questions/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      toast({ title: "Domanda eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete all selected questions in parallel
      await Promise.all(ids.map(id => apiRequest(`/api/admin/questions/${id}`, "DELETE")));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      setSelectedQuestions(new Set());
      setIsDeleteDialogOpen(false);
      toast({ title: `${selectedQuestions.size} domande eliminate con successo` });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const generateAudioMutation = useMutation({
    mutationFn: (data: { id: string; language: string }) =>
      apiRequest(`/api/admin/questions/${data.id}/generate-audio`, "POST", { language: data.language }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      toast({ title: "Audio generato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante la generazione audio", variant: "destructive" });
    },
  });

  const handleEdit = (question: Question) => {
    // Transform options from database format {label, text} to edit format {text, isCorrect}
    const correctAnswersSet = new Set(question.correctAnswers || [question.correctAnswer].filter(Boolean));
    const transformedOptions = question.options.map(opt => ({
      text: opt.text,
      isCorrect: correctAnswersSet.has(opt.label),
      explanation: opt.explanation
    }));
    
    setEditingQuestion({
      ...question,
      options: transformedOptions
    });
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingQuestion({
      quizId: allQuizzes[0]?.id || '',
      question: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      explanation: '',
      difficulty: 'intermediate',
    });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingQuestion) return;
    
    // Transform options to the format expected by the quiz
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const transformedOptions = editingQuestion.options?.map((opt, index) => ({
      label: labels[index],
      text: opt.text,
      explanation: opt.explanation || ''
    })) || [];
    
    // Extract correct answers
    const correctAnswers = editingQuestion.options
      ?.map((opt, index) => opt.isCorrect ? labels[index] : null)
      .filter(Boolean) as string[] || [];
    
    // For backward compatibility, set correctAnswer to the first correct answer
    const correctAnswer = correctAnswers[0] || '';
    
    const questionData = {
      ...editingQuestion,
      options: transformedOptions,
      correctAnswers: correctAnswers.length > 0 ? correctAnswers : undefined,
      correctAnswer: correctAnswer
    };
    
    if (isCreating) {
      createMutation.mutate(questionData as any);
    } else if (editingQuestion.id) {
      updateMutation.mutate({
        id: editingQuestion.id,
        updates: questionData as any,
      });
    }
  };

  const addOption = () => {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      options: [...(editingQuestion.options || []), { text: '', isCorrect: false }],
    });
  };

  const removeOption = (index: number) => {
    if (!editingQuestion) return;
    const newOptions = [...(editingQuestion.options || [])];
    newOptions.splice(index, 1);
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const updateOption = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    if (!editingQuestion) return;
    const newOptions = [...(editingQuestion.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setEditingQuestion({ ...editingQuestion, imageUrl: data.url });
      toast({ title: "Immagine caricata con successo" });
    } catch (error) {
      toast({ 
        title: "Errore durante il caricamento dell'immagine", 
        variant: "destructive" 
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const getQuizTitle = (quizId: string) => {
    return allQuizzes.find(q => q.id === quizId)?.title || quizId;
  };

  const getCategoryName = (quizId: string) => {
    const quiz = allQuizzes.find(q => q.id === quizId);
    return categories?.find(c => c.id === quiz?.categoryId)?.name || '';
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.size === filteredQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  const handleBulkDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedQuestions));
  };

  const filteredQuestions = questions?.filter(q => {
    // Filter by quiz
    if (selectedQuiz !== 'all' && q.quizId !== selectedQuiz) return false;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      const quiz = allQuizzes.find(quiz => quiz.id === q.quizId);
      if (quiz?.categoryId !== selectedCategory) return false;
    }
    
    // Filter by question type (AI vs Manual)
    if (questionType === 'ai') {
      // AI questions have language field set (not null/undefined)
      if (!q.language) return false;
    } else if (questionType === 'manual') {
      // Manual questions don't have language field or have it as null
      if (q.language) return false;
    }
    
    return true;
  }) || [];

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
          <h2 className="text-2xl font-bold">Gestione Domande</h2>
          <p className="text-muted-foreground">Gestisci le domande dei quiz</p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-question">
          <Plus className="w-4 h-4 mr-2" />
          Nuova Domanda
        </Button>
      </div>

      {selectedQuestions.size > 0 && (
        <div className="mb-4 flex justify-between items-center bg-muted p-3 rounded-lg">
          <span className="text-sm font-medium">
            {selectedQuestions.size} domand{selectedQuestions.size === 1 ? 'a' : 'e'} selezionat{selectedQuestions.size === 1 ? 'a' : 'e'}
          </span>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleBulkDelete}
            data-testid="button-bulk-delete"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Elimina Selezionate
          </Button>
        </div>
      )}

      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <Label>Filtra per Categoria</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger data-testid="select-filter-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le categorie</SelectItem>
              {categories?.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label>Filtra per Quiz</Label>
          <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
            <SelectTrigger data-testid="select-filter-quiz">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i quiz</SelectItem>
              {allQuizzes.map(quiz => (
                <SelectItem key={quiz.id} value={quiz.id}>{quiz.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label>Filtra per Tipo</Label>
          <Select value={questionType} onValueChange={setQuestionType}>
            <SelectTrigger data-testid="select-filter-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le domande</SelectItem>
              <SelectItem value="ai">🤖 Generate dall'AI</SelectItem>
              <SelectItem value="manual">✍️ Manuali</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0}
                  onCheckedChange={toggleSelectAll}
                  data-testid="checkbox-select-all"
                />
              </TableHead>
              <TableHead>Domanda</TableHead>
              <TableHead>Quiz</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Opzioni</TableHead>
              <TableHead>Difficoltà</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.map((question) => (
              <TableRow key={question.id} data-testid={`row-question-${question.id}`}>
                <TableCell>
                  <Checkbox
                    checked={selectedQuestions.has(question.id)}
                    onCheckedChange={() => toggleQuestionSelection(question.id)}
                    data-testid={`checkbox-question-${question.id}`}
                  />
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium">{question.question}</div>
                    {question.language && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        🤖 AI
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getQuizTitle(question.quizId)}</TableCell>
                <TableCell>{getCategoryName(question.quizId)}</TableCell>
                <TableCell>{question.options.length}</TableCell>
                <TableCell>
                  <Badge variant="outline">{question.difficulty}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {question.explanation && !question.explanationAudioUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const language = prompt('Seleziona la lingua per la spiegazione audio (it/en/es):', 'it');
                          if (language && ['it', 'en', 'es'].includes(language.toLowerCase())) {
                            generateAudioMutation.mutate({ id: question.id, language: language.toLowerCase() });
                          } else if (language) {
                            toast({ title: "Lingua non supportata. Usa: it, en o es", variant: "destructive" });
                          }
                        }}
                        disabled={generateAudioMutation.isPending}
                        title="Genera audio spiegazione"
                        data-testid={`button-generate-audio-${question.id}`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    )}
                    {question.explanationAudioUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-600"
                        onClick={() => {
                          const audio = new Audio(question.explanationAudioUrl);
                          audio.play();
                        }}
                        title="Ascolta audio"
                        data-testid={`button-play-audio-${question.id}`}
                      >
                        <Volume2 className="w-4 h-4 fill-current" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(question)}
                      data-testid={`button-edit-question-${question.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const questionType = question.language ? 'AI' : 'manuale';
                        const questionPreview = question.question.substring(0, 60) + (question.question.length > 60 ? '...' : '');
                        const confirmMessage = `⚠️ ELIMINAZIONE DOMANDA ${questionType.toUpperCase()}\n\n"${questionPreview}"\n\nQuiz: ${getQuizTitle(question.quizId)}\n\nQuesta azione è irreversibile. Sei sicuro di voler procedere?`;
                        
                        if (confirm(confirmMessage)) {
                          deleteMutation.mutate(question.id);
                        }
                      }}
                      data-testid={`button-delete-question-${question.id}`}
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
        <DialogContent className="max-w-3xl" data-testid="dialog-question">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Nuova Domanda' : 'Modifica Domanda'}</DialogTitle>
            <DialogDescription>
              {isCreating ? 'Crea una nuova domanda' : 'Modifica i dati della domanda'}
            </DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="quiz">Quiz</Label>
                <Select
                  value={editingQuestion.quizId}
                  onValueChange={(value) => setEditingQuestion({ ...editingQuestion, quizId: value })}
                >
                  <SelectTrigger data-testid="select-quiz">
                    <SelectValue placeholder="Seleziona quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {allQuizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="question">Domanda</Label>
                <Textarea
                  id="question"
                  value={editingQuestion.question || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  rows={3}
                  data-testid="textarea-question"
                />
              </div>
              <div>
                <Label>Immagine (opzionale)</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      data-testid="button-upload-image"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImage ? "Caricamento..." : "Carica Immagine"}
                    </Button>
                    {editingQuestion.imageUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingQuestion({ ...editingQuestion, imageUrl: '' })}
                        data-testid="button-remove-image"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rimuovi
                      </Button>
                    )}
                  </div>
                  {editingQuestion.imageUrl && (
                    <div className="relative border rounded-lg p-2">
                      <img
                        src={editingQuestion.imageUrl}
                        alt="Preview"
                        className="max-h-48 rounded"
                        data-testid="img-preview"
                      />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Carica un'immagine per domande di solution design, diagrammi, architetture, ecc.
                  </p>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <Label>Opzioni di Risposta</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seleziona una o più risposte corrette. Se selezioni più risposte, l'utente dovrà selezionarle tutte per ottenere il punto.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    data-testid="button-add-option"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Aggiungi Opzione
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingQuestion.options?.map((option, index) => (
                    <div key={index} className="flex gap-2 items-start p-2 border rounded">
                      <div className="flex-1">
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(index, 'text', e.target.value)}
                          placeholder={`Opzione ${index + 1}`}
                          data-testid={`input-option-${index}`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`correct-${index}`} className="text-sm whitespace-nowrap">
                          Corretta
                        </Label>
                        <input
                          id={`correct-${index}`}
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                          className="h-4 w-4"
                          data-testid={`checkbox-correct-${index}`}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        data-testid={`button-remove-option-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="explanation">Spiegazione</Label>
                <Textarea
                  id="explanation"
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  rows={3}
                  data-testid="textarea-explanation"
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficoltà</Label>
                <Select
                  value={editingQuestion.difficulty}
                  onValueChange={(value) => setEditingQuestion({ ...editingQuestion, difficulty: value })}
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-question"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare {selectedQuestions.size} domand{selectedQuestions.size === 1 ? 'a' : 'e'}?
              Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              data-testid="button-confirm-bulk-delete"
            >
              {bulkDeleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
