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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Calendar, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

interface LiveCourse {
  id: string;
  quizId: string;
  title: string;
  description?: string;
  objectives?: string;
  instructor?: string;
  duration?: string;
  language?: string;
  price: number;
  isWebinarHealth?: boolean;
  createdAt: string;
  updatedAt?: string;
  visibilityType?: 'public' | 'corporate_exclusive';
}

interface CorporateAgreement {
  id: string;
  companyName: string;
  isActive: boolean;
}

interface LiveCourseSession {
  id: string;
  courseId: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolled: number;
  status: 'available' | 'full' | 'cancelled' | 'completed';
  streamingUrl?: string | null;
}

interface Quiz {
  id: string;
  title: string;
}

export function AdminLiveCourses() {
  const { toast } = useToast();
  const [editingCourse, setEditingCourse] = useState<Partial<LiveCourse> | null>(null);
  const [editingSession, setEditingSession] = useState<Partial<LiveCourseSession> | null>(null);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCorporateAccess, setSelectedCorporateAccess] = useState<string[]>([]);

  const { data: courses, isLoading: coursesLoading } = useQuery<LiveCourse[]>({
    queryKey: ["/api/admin/live-courses"],
  });

  const { data: corporateAgreements } = useQuery<CorporateAgreement[]>({
    queryKey: ["/api/admin/corporate-agreements"],
  });

  const { data: quizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });

  const { data: sessions } = useQuery<LiveCourseSession[]>({
    queryKey: ["/api/admin/live-courses", selectedCourseId, "sessions"],
    enabled: !!selectedCourseId,
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: Partial<LiveCourse>) => {
      console.log("Mutation data:", data);
      return apiRequest("/api/admin/live-courses", "POST", data);
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast({ title: "Errore durante la creazione: " + (error?.message || "Errore sconosciuto"), variant: "destructive" });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<LiveCourse> }) =>
      apiRequest(`/api/admin/live-courses/${data.id}`, "PUT", data.updates),
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/live-courses/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/live-courses"] });
      toast({ title: "Corso eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: { courseId: string; session: Partial<LiveCourseSession> }) =>
      apiRequest(`/api/admin/live-courses/${data.courseId}/sessions`, "POST", data.session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/live-courses", selectedCourseId, "sessions"] });
      toast({ title: "Sessione creata con successo" });
      setIsSessionDialogOpen(false);
      setEditingSession(null);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<LiveCourseSession> }) =>
      apiRequest(`/api/admin/live-course-sessions/${data.id}`, "PUT", data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/live-courses", selectedCourseId, "sessions"] });
      toast({ title: "Sessione aggiornata con successo" });
      setIsSessionDialogOpen(false);
      setEditingSession(null);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/live-course-sessions/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/live-courses", selectedCourseId, "sessions"] });
      toast({ title: "Sessione eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const handleCreateCourse = () => {
    setEditingCourse({
      title: '',
      description: '',
      objectives: '',
      instructor: '',
      duration: '',
      price: 0,
      quizId: '',
      isWebinarHealth: false,
      visibilityType: 'public',
    });
    setSelectedCorporateAccess([]);
    setIsCourseDialogOpen(true);
  };

  const handleEditCourse = async (course: LiveCourse) => {
    setEditingCourse(course);
    setIsCourseDialogOpen(true);
    
    // Load corporate access if course is corporate_exclusive
    if (course.visibilityType === 'corporate_exclusive') {
      try {
        const response = await fetch(`/api/admin/corporate-access/live-course/${course.id}`, {
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
    if (!editingCourse) return;

    // Validate required fields
    if (!editingCourse.title || !editingCourse.quizId) {
      toast({
        title: "Campi mancanti",
        description: "Titolo e Quiz Associato sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    // Sanitize: remove server-managed fields and removed JSON fields
    const { id, createdAt, updatedAt, sessions, programModules, cosaInclude, ...cleanData } = editingCourse as any;

    console.log("Saving course with data:", cleanData);

    try {
      if (editingCourse.id) {
        await updateCourseMutation.mutateAsync({ id: editingCourse.id, updates: cleanData });
        
        // Update corporate access
        if (editingCourse.visibilityType === 'corporate_exclusive') {
          const response = await fetch(`/api/admin/corporate-access/live-course/${editingCourse.id}`, {
            credentials: 'include'
          });
          const currentAccess = await response.json();
          const currentIds = new Set(currentAccess.map((a: any) => a.corporateAgreementId));
          const selectedIds = new Set(selectedCorporateAccess);
          
          for (const access of currentAccess) {
            if (!selectedIds.has(access.corporateAgreementId)) {
              await apiRequest('/api/admin/corporate-access/live-course', 'DELETE', {
                liveCourseId: editingCourse.id,
                corporateAgreementId: access.corporateAgreementId
              });
            }
          }
          
          for (const agreementId of selectedCorporateAccess) {
            if (!currentIds.has(agreementId)) {
              await apiRequest('/api/admin/corporate-access/live-course', 'POST', {
                liveCourseId: editingCourse.id,
                corporateAgreementId: agreementId
              });
            }
          }
        } else {
          const response = await fetch(`/api/admin/corporate-access/live-course/${editingCourse.id}`, {
            credentials: 'include'
          });
          const currentAccess = await response.json();
          for (const access of currentAccess) {
            await apiRequest('/api/admin/corporate-access/live-course', 'DELETE', {
              liveCourseId: editingCourse.id,
              corporateAgreementId: access.corporateAgreementId
            });
          }
        }
      } else {
        const response = await createCourseMutation.mutateAsync(cleanData);
        const result = await response.json();
        
        if (editingCourse.visibilityType === 'corporate_exclusive' && selectedCorporateAccess.length > 0) {
          for (const agreementId of selectedCorporateAccess) {
            await apiRequest('/api/admin/corporate-access/live-course', 'POST', {
              liveCourseId: result.id,
              corporateAgreementId: agreementId
            });
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/live-courses"] });
      toast({ title: editingCourse.id ? "Corso aggiornato con successo" : "Corso creato con successo" });
      setIsCourseDialogOpen(false);
      setEditingCourse(null);
      setSelectedCorporateAccess([]);
    } catch (error) {
      console.error('Error saving course:', error);
      toast({ title: "Errore durante il salvataggio", variant: "destructive" });
    }
  };

  const handleCreateSession = (courseId: string) => {
    setSelectedCourseId(courseId);
    setEditingSession({
      courseId,
      startDate: '',
      endDate: '',
      capacity: 30,
      enrolled: 0,
      status: 'available',
      streamingUrl: '',
    });
    setIsSessionDialogOpen(true);
  };

  const handleEditSession = (session: LiveCourseSession) => {
    setEditingSession(session);
    setIsSessionDialogOpen(true);
  };

  const handleSaveSession = () => {
    if (!editingSession) return;

    if (editingSession.id) {
      updateSessionMutation.mutate({ id: editingSession.id, updates: editingSession });
    } else if (editingSession.courseId) {
      createSessionMutation.mutate({ courseId: editingSession.courseId, session: editingSession });
    }
  };

  if (coursesLoading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Corsi Live</CardTitle>
              <CardDescription>Gestisci i corsi live e le relative sessioni</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link href="/admin">
                <Button variant="outline" data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Torna alla Dashboard
                </Button>
              </Link>
              <Button onClick={handleCreateCourse} data-testid="button-create-course">
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Corso
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titolo</TableHead>
                <TableHead>Quiz</TableHead>
                <TableHead>Lingua</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Prezzo</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses?.map((course) => (
                <TableRow key={course.id} data-testid={`course-row-${course.id}`}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>{quizzes?.find(q => q.id === course.quizId)?.title || course.quizId}</TableCell>
                  <TableCell>
                    {course.language === 'it' && '🇮🇹 IT'}
                    {course.language === 'en' && '🇬🇧 EN'}
                    {course.language === 'es' && '🇪🇸 ES'}
                  </TableCell>
                  <TableCell>{course.instructor || '-'}</TableCell>
                  <TableCell>€{(course.price / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
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
                        onClick={() => handleCreateSession(course.id)}
                        data-testid={`button-add-session-${course.id}`}
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCourseMutation.mutate(course.id)}
                        data-testid={`button-delete-course-${course.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedCourseId && sessions && (
        <Card>
          <CardHeader>
            <CardTitle>Sessioni del Corso</CardTitle>
            <CardDescription>
              {courses?.find(c => c.id === selectedCourseId)?.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Inizio</TableHead>
                  <TableHead>Data Fine</TableHead>
                  <TableHead>Capacità</TableHead>
                  <TableHead>Iscritti</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} data-testid={`session-row-${session.id}`}>
                    <TableCell>{new Date(session.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(session.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{session.capacity}</TableCell>
                    <TableCell>{session.enrolled || 0}</TableCell>
                    <TableCell>
                      <Badge variant={session.status === 'available' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSession(session)}
                          data-testid={`button-edit-session-${session.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSessionMutation.mutate(session.id)}
                          data-testid={`button-delete-session-${session.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-[95vw] sm:max-w-[600px] overflow-y-auto" data-testid="dialog-course">
          <DialogHeader>
            <DialogTitle>{editingCourse?.id ? 'Modifica Corso' : 'Nuovo Corso'}</DialogTitle>
            <DialogDescription>Inserisci i dettagli del corso live</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titolo</Label>
              <Input
                id="title"
                value={editingCourse?.title || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                data-testid="input-course-title"
              />
            </div>
            <div>
              <Label htmlFor="quiz">Quiz Associato</Label>
              <Select
                value={editingCourse?.quizId || ''}
                onValueChange={(value) => setEditingCourse({ ...editingCourse, quizId: value })}
              >
                <SelectTrigger data-testid="select-course-quiz">
                  <SelectValue placeholder="Seleziona quiz" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes?.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Descrizione Breve</Label>
              <Textarea
                id="description"
                value={editingCourse?.description || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                data-testid="input-course-description"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="objectives">Obiettivi del Corso</Label>
              <Textarea
                id="objectives"
                value={editingCourse?.objectives || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, objectives: e.target.value })}
                placeholder="Comprendere i principi del GDPR, Applicare correttamente le misure di sicurezza..."
                data-testid="input-course-objectives"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instructor">Docente</Label>
                <Input
                  id="instructor"
                  value={editingCourse?.instructor || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })}
                  placeholder="Nome del docente"
                  data-testid="input-course-instructor"
                />
              </div>
              <div>
                <Label htmlFor="duration">Durata</Label>
                <Input
                  id="duration"
                  value={editingCourse?.duration || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                  placeholder="Es: 2 giorni, 3 settimane"
                  data-testid="input-course-duration"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language">Lingua del Corso</Label>
                <Select
                  value={editingCourse?.language || 'it'}
                  onValueChange={(value) => setEditingCourse({ ...editingCourse, language: value })}
                >
                  <SelectTrigger data-testid="select-course-language">
                    <SelectValue placeholder="Seleziona lingua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Prezzo (€)</Label>
                <Input
                  id="price"
                  type="number"
                  value={editingCourse?.price ? editingCourse.price / 100 : 0}
                  onChange={(e) => setEditingCourse({ ...editingCourse, price: parseFloat(e.target.value) * 100 })}
                  data-testid="input-course-price"
                />
              </div>
            </div>
            
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isWebinarHealth"
                  checked={editingCourse?.isWebinarHealth || false}
                  onChange={(e) => setEditingCourse({ ...editingCourse, isWebinarHealth: e.target.checked })}
                  className="rounded border-gray-300"
                  data-testid="checkbox-webinar-health"
                />
                <label htmlFor="isWebinarHealth" className="text-sm font-medium cursor-pointer">
                  💡 Webinar Health
                </label>
                <p className="text-sm text-muted-foreground">
                  (Apparirà nella sezione Webinar Health della pagina AI Prevenzione)
                </p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Visibilità Contenuto</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="visibilityType">Tipo di Visibilità</Label>
                  <Select
                    value={editingCourse?.visibilityType || 'public'}
                    onValueChange={(value: 'public' | 'corporate_exclusive') => {
                      setEditingCourse({ ...editingCourse, visibilityType: value });
                      if (value === 'public') {
                        setSelectedCorporateAccess([]);
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-course-visibility-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Pubblico (tutti gli utenti)</SelectItem>
                      <SelectItem value="corporate_exclusive">Esclusivo Corporate</SelectItem>
                    </SelectContent>
                  </Select>
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
                            id={`corp-course-${agreement.id}`}
                            checked={selectedCorporateAccess.includes(agreement.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCorporateAccess([...selectedCorporateAccess, agreement.id]);
                              } else {
                                setSelectedCorporateAccess(selectedCorporateAccess.filter(id => id !== agreement.id));
                              }
                            }}
                            className="rounded border-gray-300"
                            data-testid={`checkbox-course-corporate-${agreement.id}`}
                          />
                          <label htmlFor={`corp-course-${agreement.id}`} className="text-sm cursor-pointer">
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
            <Button variant="outline" onClick={() => setIsCourseDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveCourse} data-testid="button-save-course">
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-[95vw] sm:max-w-[500px] overflow-y-auto" data-testid="dialog-session">
          <DialogHeader>
            <DialogTitle>{editingSession?.id ? 'Modifica Sessione' : 'Nuova Sessione'}</DialogTitle>
            <DialogDescription>Inserisci le date e la capacità della sessione</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="startDate">Data Inizio</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={editingSession?.startDate ? new Date(editingSession.startDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditingSession({ ...editingSession, startDate: e.target.value })}
                data-testid="input-session-start"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Fine</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={editingSession?.endDate ? new Date(editingSession.endDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditingSession({ ...editingSession, endDate: e.target.value })}
                data-testid="input-session-end"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">Capacità</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={editingSession?.capacity || 30}
                  onChange={(e) => setEditingSession({ ...editingSession, capacity: parseInt(e.target.value) })}
                  data-testid="input-session-capacity"
                />
              </div>
              <div>
                <Label htmlFor="status">Stato</Label>
                <Select
                  value={editingSession?.status || 'available'}
                  onValueChange={(value) => setEditingSession({ ...editingSession, status: value as any })}
                >
                  <SelectTrigger data-testid="select-session-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponibile</SelectItem>
                    <SelectItem value="full">Completo</SelectItem>
                    <SelectItem value="cancelled">Cancellato</SelectItem>
                    <SelectItem value="completed">Completato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="streamingUrl">Link Streaming (opzionale)</Label>
              <Input
                id="streamingUrl"
                type="url"
                placeholder="https://zoom.us/j/... o Google Meet o Teams"
                value={editingSession?.streamingUrl || ''}
                onChange={(e) => setEditingSession({ ...editingSession, streamingUrl: e.target.value })}
                data-testid="input-session-streaming-url"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Link per partecipare al webinar (Zoom, Google Meet, Teams, etc.)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSessionDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveSession} data-testid="button-save-session">
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
