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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Video, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface OnDemandCourse {
  id: string;
  title: string;
  description?: string;
  program?: string;
  categoryId: string;
  instructor?: string;
  duration?: string;
  thumbnailUrl?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  visibilityType?: 'public' | 'corporate_exclusive';
}

interface CorporateAgreement {
  id: string;
  companyName: string;
  isActive: boolean;
}

interface CourseVideo {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration?: number;
  orderIndex: number;
  createdAt: string;
}

interface CourseQuestion {
  id: string;
  courseId: string;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  sortOrder?: number;
  createdAt: string;
}

export function AdminOnDemandCourses() {
  const { toast } = useToast();
  const [editingCourse, setEditingCourse] = useState<Partial<OnDemandCourse> | null>(null);
  const [editingVideo, setEditingVideo] = useState<Partial<CourseVideo> | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Partial<CourseQuestion> | null>(null);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"videos" | "questions">("videos");
  const [selectedCorporateAccess, setSelectedCorporateAccess] = useState<string[]>([]);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: corporateAgreements } = useQuery<CorporateAgreement[]>({
    queryKey: ["/api/admin/corporate-agreements"],
  });

  const { data: courses, isLoading: coursesLoading } = useQuery<OnDemandCourse[]>({
    queryKey: ["/api/admin/on-demand-courses"],
  });

  const { data: videos } = useQuery<CourseVideo[]>({
    queryKey: ["/api/admin/on-demand-courses", selectedCourseId, "videos"],
    enabled: !!selectedCourseId,
  });

  const { data: questions } = useQuery<CourseQuestion[]>({
    queryKey: ["/api/admin/on-demand-courses", selectedCourseId, "questions"],
    enabled: !!selectedCourseId,
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: Partial<OnDemandCourse>) =>
      apiRequest("/api/admin/on-demand-courses", "POST", data),
    onError: (error: any) => {
      toast({ 
        title: "Errore durante la creazione", 
        description: error?.message || "Errore sconosciuto",
        variant: "destructive" 
      });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<OnDemandCourse> }) =>
      apiRequest(`/api/admin/on-demand-courses/${data.id}`, "PUT", data.updates),
    onError: (error: any) => {
      toast({ 
        title: "Errore durante l'aggiornamento",
        description: error?.message || "Errore sconosciuto",
        variant: "destructive" 
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/on-demand-courses/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/on-demand-courses"] });
      toast({ title: "Corso eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const createVideoMutation = useMutation({
    mutationFn: (data: { courseId: string; video: Partial<CourseVideo> }) =>
      apiRequest(`/api/admin/on-demand-courses/${data.courseId}/videos`, "POST", data.video),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/on-demand-courses", selectedCourseId, "videos"] });
      toast({ title: "Video aggiunto con successo" });
      setIsVideoDialogOpen(false);
      setEditingVideo(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore durante la creazione",
        description: error?.message || "Errore sconosciuto",
        variant: "destructive" 
      });
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<CourseVideo> }) =>
      apiRequest(`/api/admin/course-videos/${data.id}`, "PUT", data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/on-demand-courses", selectedCourseId, "videos"] });
      toast({ title: "Video aggiornato con successo" });
      setIsVideoDialogOpen(false);
      setEditingVideo(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore durante l'aggiornamento",
        description: error?.message || "Errore sconosciuto",
        variant: "destructive" 
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/course-videos/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/on-demand-courses", selectedCourseId, "videos"] });
      toast({ title: "Video eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: (data: { courseId: string; question: Partial<CourseQuestion> }) =>
      apiRequest(`/api/admin/on-demand-courses/${data.courseId}/questions`, "POST", data.question),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/on-demand-courses", selectedCourseId, "questions"] });
      toast({ title: "Domanda creata con successo" });
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore durante la creazione",
        description: error?.message || "Errore sconosciuto",
        variant: "destructive" 
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<CourseQuestion> }) =>
      apiRequest(`/api/admin/course-questions/${data.id}`, "PUT", data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/on-demand-courses", selectedCourseId, "questions"] });
      toast({ title: "Domanda aggiornata con successo" });
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore durante l'aggiornamento",
        description: error?.message || "Errore sconosciuto",
        variant: "destructive" 
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/course-questions/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/on-demand-courses", selectedCourseId, "questions"] });
      toast({ title: "Domanda eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const handleCreateCourse = () => {
    setEditingCourse({
      title: '',
      description: '',
      categoryId: categories?.[0]?.id || '',
      difficulty: 'beginner',
      isActive: true,
      visibilityType: 'public',
    });
    setSelectedCorporateAccess([]);
    setIsCourseDialogOpen(true);
  };

  const handleEditCourse = async (course: OnDemandCourse) => {
    setEditingCourse(course);
    setIsCourseDialogOpen(true);
    
    // Load corporate access if course is corporate_exclusive
    if (course.visibilityType === 'corporate_exclusive') {
      try {
        const response = await fetch(`/api/admin/corporate-access/on-demand-course/${course.id}`, {
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

  const handleSaveCourse = async () => {
    if (!editingCourse?.title) {
      toast({ title: "Il titolo è obbligatorio", variant: "destructive" });
      return;
    }

    if (!editingCourse?.categoryId) {
      toast({ title: "La categoria è obbligatoria", variant: "destructive" });
      return;
    }

    try {
      if (editingCourse.id) {
        await updateCourseMutation.mutateAsync({
          id: editingCourse.id,
          updates: editingCourse,
        });
        
        // Update corporate access
        if (editingCourse.visibilityType === 'corporate_exclusive') {
          const response = await fetch(`/api/admin/corporate-access/on-demand-course/${editingCourse.id}`, {
            credentials: 'include'
          });
          const currentAccess = await response.json();
          const currentIds = new Set(currentAccess.map((a: any) => a.corporateAgreementId));
          const selectedIds = new Set(selectedCorporateAccess);
          
          for (const access of currentAccess) {
            if (!selectedIds.has(access.corporateAgreementId)) {
              await apiRequest('/api/admin/corporate-access/on-demand-course', 'DELETE', {
                onDemandCourseId: editingCourse.id,
                corporateAgreementId: access.corporateAgreementId
              });
            }
          }
          
          for (const agreementId of selectedCorporateAccess) {
            if (!currentIds.has(agreementId)) {
              await apiRequest('/api/admin/corporate-access/on-demand-course', 'POST', {
                onDemandCourseId: editingCourse.id,
                corporateAgreementId: agreementId
              });
            }
          }
        } else {
          const response = await fetch(`/api/admin/corporate-access/on-demand-course/${editingCourse.id}`, {
            credentials: 'include'
          });
          const currentAccess = await response.json();
          for (const access of currentAccess) {
            await apiRequest('/api/admin/corporate-access/on-demand-course', 'DELETE', {
              onDemandCourseId: editingCourse.id,
              corporateAgreementId: access.corporateAgreementId
            });
          }
        }
      } else {
        const response = await createCourseMutation.mutateAsync(editingCourse);
        const result = await response.json();
        
        if (editingCourse.visibilityType === 'corporate_exclusive' && selectedCorporateAccess.length > 0) {
          for (const agreementId of selectedCorporateAccess) {
            await apiRequest('/api/admin/corporate-access/on-demand-course', 'POST', {
              onDemandCourseId: result.id,
              corporateAgreementId: agreementId
            });
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/on-demand-courses"] });
      toast({ title: editingCourse.id ? "Corso aggiornato con successo" : "Corso creato con successo" });
      setIsCourseDialogOpen(false);
      setEditingCourse(null);
      setSelectedCorporateAccess([]);
    } catch (error) {
      console.error('Error saving course:', error);
      toast({ title: "Errore durante il salvataggio", variant: "destructive" });
    }
  };

  const handleCreateVideo = () => {
    if (!selectedCourseId) return;
    
    const maxOrder = videos?.reduce((max, v) => Math.max(max, v.orderIndex), 0) || 0;
    setEditingVideo({
      courseId: selectedCourseId,
      title: '',
      videoUrl: '',
      orderIndex: maxOrder + 1,
    });
    setIsVideoDialogOpen(true);
  };

  const handleEditVideo = (video: CourseVideo) => {
    setEditingVideo(video);
    setIsVideoDialogOpen(true);
  };

  const handleSaveVideo = () => {
    if (!editingVideo?.title || !editingVideo?.videoUrl) {
      toast({ title: "Titolo e URL sono obbligatori", variant: "destructive" });
      return;
    }

    if (editingVideo.id) {
      updateVideoMutation.mutate({
        id: editingVideo.id,
        updates: editingVideo,
      });
    } else {
      createVideoMutation.mutate({
        courseId: selectedCourseId!,
        video: editingVideo,
      });
    }
  };

  const handleCreateQuestion = () => {
    if (!selectedCourseId) return;
    
    const maxOrder = questions?.reduce((max, q) => Math.max(max, q.sortOrder || 0), 0) || 0;
    setEditingQuestion({
      courseId: selectedCourseId,
      question: '',
      options: [
        { label: 'A', text: '' },
        { label: 'B', text: '' },
        { label: 'C', text: '' },
        { label: 'D', text: '' }
      ],
      correctAnswer: 'A',
      sortOrder: maxOrder + 1,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleEditQuestion = (question: CourseQuestion) => {
    setEditingQuestion(question);
    setIsQuestionDialogOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion?.question) {
      toast({ title: "La domanda è obbligatoria", variant: "destructive" });
      return;
    }

    if (!editingQuestion.options || editingQuestion.options.some(opt => !opt.text.trim())) {
      toast({ title: "Tutte le opzioni sono obbligatorie", variant: "destructive" });
      return;
    }

    if (editingQuestion.id) {
      updateQuestionMutation.mutate({
        id: editingQuestion.id,
        updates: editingQuestion,
      });
    } else {
      createQuestionMutation.mutate({
        courseId: selectedCourseId!,
        question: editingQuestion,
      });
    }
  };

  if (coursesLoading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  if (selectedCourseId && (videos || questions)) {
    const course = courses?.find(c => c.id === selectedCourseId);
    const [activeTab, setActiveTab] = useState<"videos" | "questions">("videos");

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestione Corso: {course?.title}</CardTitle>
              <CardDescription>
                Gestisci video e domande del corso
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCourseId(null)}
              data-testid="button-back-to-courses"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna ai Corsi
            </Button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === "videos" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("videos")}
              data-testid="tab-videos"
            >
              <Video className="w-4 h-4 mr-2" />
              Video
            </Button>
            <Button
              variant={activeTab === "questions" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("questions")}
              data-testid="tab-questions"
            >
              Domande
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "videos" ? (
            <>
              <div className="flex justify-end mb-4">
                <Button
                  onClick={handleCreateVideo}
                  size="sm"
                  data-testid="button-add-video"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Video
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordine</TableHead>
                    <TableHead>Titolo</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Durata (min)</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!videos || videos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nessun video trovato
                      </TableCell>
                    </TableRow>
                  ) : (
                    videos
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((video) => (
                        <TableRow key={video.id}>
                          <TableCell data-testid={`text-order-${video.id}`}>{video.orderIndex}</TableCell>
                          <TableCell data-testid={`text-title-${video.id}`}>{video.title}</TableCell>
                          <TableCell className="max-w-xs truncate" data-testid={`text-url-${video.id}`}>
                            <a 
                              href={video.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {video.videoUrl}
                            </a>
                          </TableCell>
                          <TableCell data-testid={`text-duration-${video.id}`}>
                            {video.duration || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditVideo(video)}
                                data-testid={`button-edit-video-${video.id}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Sei sicuro di voler eliminare questo video?")) {
                                    deleteVideoMutation.mutate(video.id);
                                  }
                                }}
                                data-testid={`button-delete-video-${video.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button
                  onClick={handleCreateQuestion}
                  size="sm"
                  data-testid="button-add-question"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Domanda
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domanda</TableHead>
                    <TableHead>Risposta Corretta</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!questions || questions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Nessuna domanda trovata
                      </TableCell>
                    </TableRow>
                  ) : (
                    questions.map((question) => {
                      const correctOption = question.options.find(opt => opt.label === question.correctAnswer);
                      return (
                        <TableRow key={question.id}>
                          <TableCell className="max-w-md truncate" data-testid={`text-question-${question.id}`}>
                            {question.question}
                          </TableCell>
                          <TableCell data-testid={`text-answer-${question.id}`}>
                            {correctOption?.label}: {correctOption?.text}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditQuestion(question)}
                                data-testid={`button-edit-question-${question.id}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Sei sicuro di voler eliminare questa domanda?")) {
                                    deleteQuestionMutation.mutate(question.id);
                                  }
                                }}
                                data-testid={`button-delete-question-${question.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>

        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion?.id ? "Modifica Domanda" : "Nuova Domanda"}
              </DialogTitle>
              <DialogDescription>
                Inserisci i dettagli della domanda per il video quiz
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="question">Domanda *</Label>
                <Textarea
                  id="question"
                  value={editingQuestion?.question || ""}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, question: e.target.value })
                  }
                  placeholder="Inserisci la domanda"
                  rows={3}
                  data-testid="input-question"
                />
              </div>

              <div className="space-y-2">
                <Label>Opzioni di Risposta *</Label>
                {['A', 'B', 'C', 'D'].map((label, index) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-8">{label}.</span>
                    <Input
                      value={editingQuestion?.options?.[index]?.text || ""}
                      onChange={(e) => {
                        const newOptions = [...(editingQuestion?.options || [
                          { label: 'A', text: '' },
                          { label: 'B', text: '' },
                          { label: 'C', text: '' },
                          { label: 'D', text: '' }
                        ])];
                        newOptions[index] = { label, text: e.target.value };
                        setEditingQuestion({ ...editingQuestion, options: newOptions });
                      }}
                      placeholder={`Opzione ${label}`}
                      data-testid={`input-option-${index}`}
                    />
                    {editingQuestion?.correctAnswer === label && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                ))}
              </div>

              <div>
                <Label htmlFor="correctAnswer">Risposta Corretta *</Label>
                <select
                  id="correctAnswer"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editingQuestion?.correctAnswer || 'A'}
                  onChange={(e) =>
                    setEditingQuestion({ 
                      ...editingQuestion, 
                      correctAnswer: e.target.value 
                    })
                  }
                  data-testid="select-correct-answer"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <Label htmlFor="explanation">Spiegazione (opzionale)</Label>
                <Textarea
                  id="explanation"
                  value={editingQuestion?.explanation || ""}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                  }
                  placeholder="Spiega perché questa è la risposta corretta"
                  rows={3}
                  data-testid="input-explanation"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsQuestionDialogOpen(false)}
                data-testid="button-cancel-question"
              >
                Annulla
              </Button>
              <Button onClick={handleSaveQuestion} data-testid="button-save-question">
                Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVideo?.id ? "Modifica Video" : "Nuovo Video"}
              </DialogTitle>
              <DialogDescription>
                Inserisci i dettagli del video (YouTube, Vimeo, Cloudflare Stream)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="videoTitle">Titolo *</Label>
                <Input
                  id="videoTitle"
                  value={editingVideo?.title || ""}
                  onChange={(e) =>
                    setEditingVideo({ ...editingVideo, title: e.target.value })
                  }
                  placeholder="Introduzione al corso"
                  data-testid="input-video-title"
                />
              </div>

              <div>
                <Label htmlFor="videoUrl">URL Video *</Label>
                <Input
                  id="videoUrl"
                  value={editingVideo?.videoUrl || ""}
                  onChange={(e) =>
                    setEditingVideo({ ...editingVideo, videoUrl: e.target.value })
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                  data-testid="input-video-url"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supporta YouTube, Vimeo, Cloudflare Stream
                </p>
              </div>

              <div>
                <Label htmlFor="videoDescription">Descrizione</Label>
                <Textarea
                  id="videoDescription"
                  value={editingVideo?.description || ""}
                  onChange={(e) =>
                    setEditingVideo({ ...editingVideo, description: e.target.value })
                  }
                  placeholder="Descrizione del video"
                  rows={3}
                  data-testid="input-video-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Durata (minuti)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={editingVideo?.duration || ""}
                    onChange={(e) =>
                      setEditingVideo({ 
                        ...editingVideo, 
                        duration: e.target.value ? parseInt(e.target.value) : undefined 
                      })
                    }
                    placeholder="60"
                    data-testid="input-video-duration"
                  />
                </div>
                <div>
                  <Label htmlFor="orderIndex">Posizione nel corso</Label>
                  <Input
                    id="orderIndex"
                    type="number"
                    min="1"
                    value={editingVideo?.orderIndex || 1}
                    onChange={(e) =>
                      setEditingVideo({ 
                        ...editingVideo, 
                        orderIndex: parseInt(e.target.value) || 1 
                      })
                    }
                    data-testid="input-video-order"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsVideoDialogOpen(false)}
                data-testid="button-cancel-video"
              >
                Annulla
              </Button>
              <Button onClick={handleSaveVideo} data-testid="button-save-video">
                Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Corsi On-Demand</CardTitle>
            <CardDescription>
              Gestisci i corsi video on-demand con quiz integrati
            </CardDescription>
          </div>
          <Button onClick={handleCreateCourse} data-testid="button-create-course">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Corso
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titolo</TableHead>
              <TableHead>Docente</TableHead>
              <TableHead>Difficoltà</TableHead>
              <TableHead>Durata</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!courses || courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nessun corso trovato
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium" data-testid={`text-course-title-${course.id}`}>
                    {course.title}
                  </TableCell>
                  <TableCell data-testid={`text-instructor-${course.id}`}>
                    {course.instructor || "-"}
                  </TableCell>
                  <TableCell data-testid={`text-difficulty-${course.id}`}>
                    <Badge variant={
                      course.difficulty === 'beginner' ? 'secondary' :
                      course.difficulty === 'intermediate' ? 'default' :
                      'destructive'
                    }>
                      {course.difficulty === 'beginner' ? 'Principiante' :
                       course.difficulty === 'intermediate' ? 'Intermedio' :
                       'Avanzato'}
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`text-duration-${course.id}`}>
                    {course.duration || "-"}
                  </TableCell>
                  <TableCell data-testid={`text-status-${course.id}`}>
                    <Badge variant={course.isActive ? "default" : "secondary"}>
                      {course.isActive ? "Attivo" : "Inattivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCourseId(course.id)}
                        data-testid={`button-manage-videos-${course.id}`}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Video
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCourse(course)}
                        data-testid={`button-edit-course-${course.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Sei sicuro di voler eliminare questo corso?")) {
                            deleteCourseMutation.mutate(course.id);
                          }
                        }}
                        data-testid={`button-delete-course-${course.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCourse?.id ? "Modifica Corso" : "Nuovo Corso"}
            </DialogTitle>
            <DialogDescription>
              Inserisci i dettagli del corso on-demand
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={editingCourse?.title || ""}
                onChange={(e) =>
                  setEditingCourse({ ...editingCourse, title: e.target.value })
                }
                placeholder="Nome del corso"
                data-testid="input-course-title"
              />
            </div>

            <div>
              <Label htmlFor="categoryId">Categoria *</Label>
              <select
                id="categoryId"
                className="w-full px-3 py-2 border rounded-md"
                value={editingCourse?.categoryId || ''}
                onChange={(e) =>
                  setEditingCourse({ ...editingCourse, categoryId: e.target.value })
                }
                data-testid="select-category"
              >
                <option value="">Seleziona categoria</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={editingCourse?.description || ""}
                onChange={(e) =>
                  setEditingCourse({ ...editingCourse, description: e.target.value })
                }
                placeholder="Descrizione del corso"
                rows={3}
                data-testid="input-course-description"
              />
            </div>

            <div>
              <Label htmlFor="program">Programma del Corso</Label>
              <Textarea
                id="program"
                value={editingCourse?.program || ""}
                onChange={(e) =>
                  setEditingCourse({ ...editingCourse, program: e.target.value })
                }
                placeholder="Dettagli del programma, moduli, argomenti trattati..."
                rows={4}
                data-testid="input-course-program"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instructor">Docente</Label>
                <Input
                  id="instructor"
                  value={editingCourse?.instructor || ""}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, instructor: e.target.value })
                  }
                  placeholder="Nome del docente"
                  data-testid="input-course-instructor"
                />
              </div>

              <div>
                <Label htmlFor="duration">Durata</Label>
                <Input
                  id="duration"
                  value={editingCourse?.duration || ""}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, duration: e.target.value })
                  }
                  placeholder="Es. 10 ore, 2 settimane..."
                  data-testid="input-course-duration"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="thumbnailUrl">URL Thumbnail</Label>
              <Input
                id="thumbnailUrl"
                value={editingCourse?.thumbnailUrl || ""}
                onChange={(e) =>
                  setEditingCourse({ ...editingCourse, thumbnailUrl: e.target.value })
                }
                placeholder="https://..."
                data-testid="input-course-thumbnail"
              />
            </div>

            <div>
              <Label htmlFor="difficulty">Difficoltà *</Label>
              <select
                id="difficulty"
                className="w-full px-3 py-2 border rounded-md"
                value={editingCourse?.difficulty || 'beginner'}
                onChange={(e) =>
                  setEditingCourse({ 
                    ...editingCourse, 
                    difficulty: e.target.value as "beginner" | "intermediate" | "advanced" 
                  })
                }
                data-testid="select-difficulty"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzato</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={editingCourse?.isActive ?? true}
                onCheckedChange={(checked) =>
                  setEditingCourse({ ...editingCourse, isActive: checked })
                }
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive">Corso attivo e visibile agli utenti</Label>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Visibilità Contenuto</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="visibilityType">Tipo di Visibilità</Label>
                  <select
                    id="visibilityType"
                    className="w-full px-3 py-2 border rounded-md"
                    value={editingCourse?.visibilityType || 'public'}
                    onChange={(e) => {
                      setEditingCourse({ ...editingCourse, visibilityType: e.target.value as 'public' | 'corporate_exclusive' });
                      if (e.target.value === 'public') {
                        setSelectedCorporateAccess([]);
                      }
                    }}
                    data-testid="select-on-demand-visibility-type"
                  >
                    <option value="public">Pubblico (tutti gli utenti)</option>
                    <option value="corporate_exclusive">Esclusivo Corporate</option>
                  </select>
                  <p className="text-sm text-muted-foreground mt-1">
                    I corsi pubblici sono visibili a tutti. I corsi esclusivi corporate sono visibili solo alle aziende selezionate.
                  </p>
                </div>
                
                {editingCourse?.visibilityType === 'corporate_exclusive' && (
                  <div>
                    <Label>Aziende Autorizzate</Label>
                    <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                      {corporateAgreements?.filter(ca => ca.isActive).map((agreement) => (
                        <div key={agreement.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`corp-on-demand-${agreement.id}`}
                            checked={selectedCorporateAccess.includes(agreement.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCorporateAccess([...selectedCorporateAccess, agreement.id]);
                              } else {
                                setSelectedCorporateAccess(selectedCorporateAccess.filter(id => id !== agreement.id));
                              }
                            }}
                            className="rounded border-gray-300"
                            data-testid={`checkbox-on-demand-corporate-${agreement.id}`}
                          />
                          <label htmlFor={`corp-on-demand-${agreement.id}`} className="text-sm cursor-pointer">
                            {agreement.companyName}
                          </label>
                        </div>
                      ))}
                      {(!corporateAgreements || corporateAgreements.filter(ca => ca.isActive).length === 0) && (
                        <p className="text-sm text-muted-foreground">Nessun account corporate attivo disponibile</p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seleziona le aziende che possono accedere a questo corso.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCourseDialogOpen(false)}
              data-testid="button-cancel-course"
            >
              Annulla
            </Button>
            <Button onClick={handleSaveCourse} data-testid="button-save-course">
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
