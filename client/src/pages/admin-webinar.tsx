import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Video, Plus, Users, Calendar, Link as LinkIcon, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Webinar {
  id: string;
  title: string;
  description: string;
  sessions: WebinarSession[];
}

interface WebinarSession {
  id: string;
  startDate: string;
  endDate: string;
  enrolled: number;
  capacity: number;
  streamingUrl?: string;
}

export default function AdminWebinarPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showEnrollmentsDialog, setShowEnrollmentsDialog] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [selectedSession, setSelectedSession] = useState<WebinarSession | null>(null);
  
  const [newWebinar, setNewWebinar] = useState({
    title: "",
    description: "",
    sessionDate: "",
    sessionTime: "10:00",
    capacity: 50,
    streamingUrl: ""
  });

  const { data: webinars = [], isLoading: webinarsLoading } = useQuery<Webinar[]>({
    queryKey: ["/api/admin/webinar-health"],
    enabled: !!(user as any)?.isAdmin,
  });

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/webinar-health/enrollments", selectedSession?.id],
    enabled: !!selectedSession,
  });

  const createWebinarMutation = useMutation({
    mutationFn: async (data: typeof newWebinar) => {
      // Create webinar course
      const courseResponse = await apiRequest("/api/admin/live-courses", "POST", {
        title: data.title,
        description: data.description,
        price: 0,
        imageUrl: "/webinar-default.jpg",
        isWebinarHealth: true
      });
      
      const course = await courseResponse.json();
      
      // Create session
      const sessionDateTime = new Date(`${data.sessionDate}T${data.sessionTime}`);
      const endDateTime = new Date(sessionDateTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours
      
      await apiRequest(`/api/admin/live-courses/${course.id}/sessions`, "POST", {
        startDate: sessionDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        capacity: data.capacity,
        status: "available",
        streamingUrl: data.streamingUrl || undefined
      });
      
      return course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webinar-health"] });
      setShowCreateDialog(false);
      setNewWebinar({
        title: "",
        description: "",
        sessionDate: "",
        sessionTime: "10:00",
        capacity: 50,
        streamingUrl: ""
      });
      toast({
        title: "Webinar creato",
        description: "Il webinar è stato creato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile creare il webinar",
        variant: "destructive",
      });
    },
  });

  const updateStreamingUrlMutation = useMutation({
    mutationFn: async ({ sessionId, streamingUrl }: { sessionId: string; streamingUrl: string }) => {
      return apiRequest("/api/admin/webinar-health/streaming-url", "POST", {
        sessionId,
        streamingUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webinar-health"] });
      toast({
        title: "URL aggiornato",
        description: "Link streaming aggiornato con successo",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!(user as any)?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>
              Non hai i permessi necessari per accedere a questa sezione.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalSessions = webinars.reduce((acc, w) => acc + w.sessions.length, 0);
  const totalEnrollments = webinars.reduce((acc, w) => 
    acc + w.sessions.reduce((sum, s) => sum + (s.enrolled || 0), 0), 0
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestione Webinar</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Webinar gratuiti per prevenzione sanitaria</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-webinar">
                <Plus className="w-4 h-4 mr-2" />
                Crea Webinar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crea Nuovo Webinar</DialogTitle>
                <DialogDescription>
                  Crea un webinar gratuito per la prevenzione sanitaria
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titolo *</Label>
                  <Input
                    id="title"
                    value={newWebinar.title}
                    onChange={(e) => setNewWebinar({ ...newWebinar, title: e.target.value })}
                    placeholder="es: Prevenzione Cardiovascolare"
                    data-testid="input-webinar-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione *</Label>
                  <Textarea
                    id="description"
                    value={newWebinar.description}
                    onChange={(e) => setNewWebinar({ ...newWebinar, description: e.target.value })}
                    placeholder="Descrivi il contenuto del webinar..."
                    rows={4}
                    data-testid="input-webinar-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data Sessione *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newWebinar.sessionDate}
                      onChange={(e) => setNewWebinar({ ...newWebinar, sessionDate: e.target.value })}
                      data-testid="input-session-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Ora Inizio *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newWebinar.sessionTime}
                      onChange={(e) => setNewWebinar({ ...newWebinar, sessionTime: e.target.value })}
                      data-testid="input-session-time"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacità Massima</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newWebinar.capacity}
                    onChange={(e) => setNewWebinar({ ...newWebinar, capacity: parseInt(e.target.value) })}
                    data-testid="input-capacity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="streamingUrl">Link Streaming (opzionale)</Label>
                  <Input
                    id="streamingUrl"
                    value={newWebinar.streamingUrl}
                    onChange={(e) => setNewWebinar({ ...newWebinar, streamingUrl: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                    data-testid="input-streaming-url"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => createWebinarMutation.mutate(newWebinar)}
                  disabled={!newWebinar.title || !newWebinar.description || !newWebinar.sessionDate || createWebinarMutation.isPending}
                  data-testid="button-submit-webinar"
                >
                  {createWebinarMutation.isPending ? "Creazione..." : "Crea Webinar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Webinar Attivi</p>
                  <p className="text-2xl font-bold">{webinars.length}</p>
                </div>
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sessioni Totali</p>
                  <p className="text-2xl font-bold">{totalSessions}</p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Iscrizioni Totali</p>
                  <p className="text-2xl font-bold">{totalEnrollments}</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Webinars List */}
        <Card>
          <CardHeader>
            <CardTitle>Webinar Disponibili</CardTitle>
            <CardDescription>Gestisci i webinar e le loro sessioni</CardDescription>
          </CardHeader>
          <CardContent>
            {webinarsLoading ? (
              <p className="text-center text-muted-foreground py-8">Caricamento...</p>
            ) : webinars.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nessun webinar creato</p>
                <p className="text-sm text-muted-foreground mt-1">Crea il primo webinar per iniziare</p>
              </div>
            ) : (
              <div className="space-y-4">
                {webinars.map((webinar) => (
                  <div key={webinar.id} className="border rounded-lg p-4" data-testid={`webinar-card-${webinar.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{webinar.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{webinar.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Sessioni:</p>
                      {webinar.sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nessuna sessione programmata</p>
                      ) : (
                        <div className="space-y-2">
                          {webinar.sessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between bg-muted/50 p-3 rounded" data-testid={`session-${session.id}`}>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {format(new Date(session.startDate), "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Iscritti: {session.enrolled || 0}/{session.capacity}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {session.streamingUrl && (
                                  <Badge variant="outline" className="text-xs">
                                    <LinkIcon className="w-3 h-3 mr-1" />
                                    Con link
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setShowEnrollmentsDialog(true);
                                  }}
                                  data-testid={`button-view-enrollments-${session.id}`}
                                >
                                  <Users className="w-4 h-4 mr-1" />
                                  Iscritti
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const url = prompt("Inserisci URL streaming:", session.streamingUrl || "");
                                    if (url !== null) {
                                      updateStreamingUrlMutation.mutate({
                                        sessionId: session.id,
                                        streamingUrl: url
                                      });
                                    }
                                  }}
                                  data-testid={`button-edit-url-${session.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enrollments Dialog */}
        <Dialog open={showEnrollmentsDialog} onOpenChange={setShowEnrollmentsDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Iscritti alla Sessione</DialogTitle>
              <DialogDescription>
                Lista degli utenti iscritti a questa sessione
              </DialogDescription>
            </DialogHeader>
            {enrollmentsLoading ? (
              <p className="text-center py-8">Caricamento...</p>
            ) : enrollments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nessun iscritto</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data Iscrizione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment: any) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        {enrollment.user?.firstName || enrollment.user?.lastName
                          ? `${enrollment.user.firstName || ''} ${enrollment.user.lastName || ''}`.trim()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{enrollment.user?.email}</TableCell>
                      <TableCell>
                        {format(new Date(enrollment.enrollmentDate), "d MMM yyyy", { locale: it })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
