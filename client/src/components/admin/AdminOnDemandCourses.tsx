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

interface OnDemandCourse {
  id: string;
  title: string;
  description?: string;
  program?: string;
  instructor?: string;
  duration?: string;
  thumbnailUrl?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
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

interface VideoQuestion {
  id: string;
  videoId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  createdAt: string;
}

export function AdminOnDemandCourses() {
  const { toast } = useToast();
  const [editingCourse, setEditingCourse] = useState<Partial<OnDemandCourse> | null>(null);
  const [editingVideo, setEditingVideo] = useState<Partial<CourseVideo> | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Partial<VideoQuestion> | null>(null);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const { data: courses, isLoading: coursesLoading } = useQuery<OnDemandCourse[]>({
    queryKey: ["/api/admin/on-demand-courses"],
  });

  const { data: videos } = useQuery<CourseVideo[]>({
    queryKey: ["/api/admin/on-demand-courses", selectedCourseId, "videos"],
    enabled: !!selectedCourseId,
  });

  const { data: questions } = useQuery<VideoQuestion[]>({
    queryKey: ["/api/admin/course-videos", selectedVideoId, "questions"],
    enabled: !!selectedVideoId,
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: Partial<OnDemandCourse>) =>
      apiRequest("/api/admin/on-demand-courses", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/on-demand-courses"] });
      toast({ title: "Corso creato con successo" });
      setIsCourseDialogOpen(false);
      setEditingCourse(null);
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/on-demand-courses"] });
      toast({ title: "Corso aggiornato con successo" });
      setIsCourseDialogOpen(false);
      setEditingCourse(null);
    },
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
    mutationFn: (data: { videoId: string; question: Partial<VideoQuestion> }) =>
      apiRequest(`/api/admin/course-videos/${data.videoId}/questions`, "POST", data.question),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-videos", selectedVideoId, "questions"] });
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
    mutationFn: (data: { id: string; updates: Partial<VideoQuestion> }) =>
      apiRequest(`/api/admin/video-questions/${data.id}`, "PUT", data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-videos", selectedVideoId, "questions"] });
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
    mutationFn: (id: string) => apiRequest(`/api/admin/video-questions/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-videos", selectedVideoId, "questions"] });
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
      difficulty: 'beginner',
      isActive: true,
    });
    setIsCourseDialogOpen(true);
  };

  const handleEditCourse = (course: OnDemandCourse) => {
    setEditingCourse(course);
    setIsCourseDialogOpen(true);
  };

  const handleSaveCourse = () => {
    if (!editingCourse?.title) {
      toast({ title: "Il titolo è obbligatorio", variant: "destructive" });
      return;
    }

    if (editingCourse.id) {
      updateCourseMutation.mutate({
        id: editingCourse.id,
        updates: editingCourse,
      });
    } else {
      createCourseMutation.mutate(editingCourse);
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
    if (!selectedVideoId) return;
    
    setEditingQuestion({
      videoId: selectedVideoId,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleEditQuestion = (question: VideoQuestion) => {
    setEditingQuestion(question);
    setIsQuestionDialogOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion?.question) {
      toast({ title: "La domanda è obbligatoria", variant: "destructive" });
      return;
    }

    if (!editingQuestion.options || editingQuestion.options.some(opt => !opt.trim())) {
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
        videoId: selectedVideoId!,
        question: editingQuestion,
      });
    }
  };

  if (coursesLoading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  if (selectedVideoId && questions) {
    const video = videos?.find(v => v.id === selectedVideoId);
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Domande Video: {video?.title}</CardTitle>
              <CardDescription>
                Gestisci le domande per questo video
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVideoId(null)}
                data-testid="button-back-to-videos"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna ai Video
              </Button>
              <Button
                onClick={handleCreateQuestion}
                size="sm"
                data-testid="button-add-question"
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Domanda
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domanda</TableHead>
                <TableHead>Risposta Corretta</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nessuna domanda trovata
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="max-w-md truncate" data-testid={`text-question-${question.id}`}>
                      {question.question}
                    </TableCell>
                    <TableCell data-testid={`text-answer-${question.id}`}>
                      {question.options[question.correctAnswer]}
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
                ))
              )}
            </TableBody>
          </Table>
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
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-8">{index + 1}.</span>
                    <Input
                      value={editingQuestion?.options?.[index] || ""}
                      onChange={(e) => {
                        const newOptions = [...(editingQuestion?.options || ['', '', '', ''])];
                        newOptions[index] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOptions });
                      }}
                      placeholder={`Opzione ${index + 1}`}
                      data-testid={`input-option-${index}`}
                    />
                    {editingQuestion?.correctAnswer === index && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                ))}
              </div>

              <div>
                <Label htmlFor="correctAnswer">Risposta Corretta *</Label>
                <Input
                  id="correctAnswer"
                  type="number"
                  min="0"
                  max="3"
                  value={editingQuestion?.correctAnswer ?? 0}
                  onChange={(e) =>
                    setEditingQuestion({ 
                      ...editingQuestion, 
                      correctAnswer: parseInt(e.target.value) || 0 
                    })
                  }
                  data-testid="input-correct-answer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Indice della risposta corretta (0-3)
                </p>
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
      </Card>
    );
  }

  if (selectedCourseId && videos) {
    const course = courses?.find(c => c.id === selectedCourseId);
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Video del Corso: {course?.title}</CardTitle>
              <CardDescription>
                Gestisci i video e le domande associate
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCourseId(null)}
                data-testid="button-back-to-courses"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna ai Corsi
              </Button>
              <Button
                onClick={handleCreateVideo}
                size="sm"
                data-testid="button-add-video"
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Video
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
              {videos.length === 0 ? (
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
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVideoId(video.id)}
                            data-testid={`button-manage-questions-${video.id}`}
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Domande
                          </Button>
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
        </CardContent>

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
          <div className="grid gap-4 py-4">
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
