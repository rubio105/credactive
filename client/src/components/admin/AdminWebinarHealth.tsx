import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Calendar, Users, Link as LinkIcon, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface WebinarSession {
  id: string;
  courseId: string;
  startDate: Date;
  endDate: Date;
  capacity: number | null;
  enrolled: number;
  status: string;
  streamingUrl: string | null;
}

interface Webinar {
  id: string;
  title: string;
  description: string;
  instructor: string | null;
  sessions: WebinarSession[];
}

interface Enrollment {
  id: string;
  userId: string;
  enrolledAt: Date;
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export function AdminWebinarHealth() {
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<WebinarSession | null>(null);
  const [streamingUrl, setStreamingUrl] = useState("");
  const [isStreamingDialogOpen, setIsStreamingDialogOpen] = useState(false);
  const [isEnrollmentsDialogOpen, setIsEnrollmentsDialogOpen] = useState(false);

  const { data: webinars, isLoading } = useQuery<Webinar[]>({
    queryKey: ["/api/admin/webinar-health"],
  });

  const { data: enrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/admin/webinar-health/enrollments", selectedSession?.id],
    enabled: !!selectedSession && isEnrollmentsDialogOpen,
  });

  const updateStreamingMutation = useMutation({
    mutationFn: (data: { sessionId: string; streamingUrl: string }) =>
      apiRequest("/api/admin/webinar-health/streaming-url", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webinar-health"] });
      setIsStreamingDialogOpen(false);
      setStreamingUrl("");
      setSelectedSession(null);
      toast({ title: "Link streaming aggiornato con successo" });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Impossibile aggiornare il link streaming",
        variant: "destructive",
      });
    },
  });

  const handleOpenStreamingDialog = (session: WebinarSession) => {
    setSelectedSession(session);
    setStreamingUrl(session.streamingUrl || "");
    setIsStreamingDialogOpen(true);
  };

  const handleOpenEnrollmentsDialog = (session: WebinarSession) => {
    setSelectedSession(session);
    setIsEnrollmentsDialogOpen(true);
  };

  const handleUpdateStreaming = () => {
    if (!selectedSession) return;
    updateStreamingMutation.mutate({
      sessionId: selectedSession.id,
      streamingUrl,
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Caricamento webinar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Gestione Webinar Health
          </CardTitle>
          <CardDescription>
            Gestisci i webinar sulla prevenzione, aggiungi link streaming e visualizza gli iscritti
          </CardDescription>
        </CardHeader>
      </Card>

      {!webinars || webinars.length === 0 ? (
        <Card className="text-center p-12">
          <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nessun webinar disponibile</h3>
          <p className="text-muted-foreground">
            Crea corsi live con "webinar" o "prevenzione" nel titolo nella sezione Corsi Live
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {webinars.map((webinar) => (
            <Card key={webinar.id}>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{webinar.title}</CardTitle>
                    <CardDescription className="mt-2">{webinar.description}</CardDescription>
                    {webinar.instructor && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <Users className="w-4 h-4 inline mr-1" />
                        Relatore: {webinar.instructor}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Sessioni
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data e Orario</TableHead>
                      <TableHead>Iscritti</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Link Streaming</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webinar.sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {format(new Date(session.startDate), "EEEE d MMMM yyyy", { locale: it })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(session.startDate), "HH:mm")} - {format(new Date(session.endDate), "HH:mm")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.enrolled} / {session.capacity || '∞'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              session.status === 'available' ? 'default' :
                              session.status === 'full' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {session.status === 'available' ? 'Disponibile' :
                             session.status === 'full' ? 'Completo' :
                             session.status === 'completed' ? 'Completato' : 'Annullato'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {session.streamingUrl ? (
                            <a
                              href={session.streamingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Apri
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">Non configurato</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenStreamingDialog(session)}
                              data-testid={`button-add-streaming-${session.id}`}
                            >
                              <LinkIcon className="w-4 h-4 mr-1" />
                              {session.streamingUrl ? 'Modifica' : 'Aggiungi'} Link
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEnrollmentsDialog(session)}
                              data-testid={`button-view-enrollments-${session.id}`}
                            >
                              <Users className="w-4 h-4 mr-1" />
                              Iscritti ({session.enrolled})
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Streaming URL Dialog */}
      <Dialog open={isStreamingDialogOpen} onOpenChange={setIsStreamingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Streaming Webinar</DialogTitle>
            <DialogDescription>
              Inserisci il link per partecipare al webinar (Zoom, Google Meet, Teams, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="streaming-url">URL Streaming</Label>
              <Input
                id="streaming-url"
                placeholder="https://zoom.us/j/..."
                value={streamingUrl}
                onChange={(e) => setStreamingUrl(e.target.value)}
                data-testid="input-streaming-url"
              />
              <p className="text-sm text-muted-foreground">
                Questo link verrà inviato agli iscritti via email 24 ore prima del webinar
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStreamingDialogOpen(false);
                setStreamingUrl("");
                setSelectedSession(null);
              }}
            >
              Annulla
            </Button>
            <Button
              onClick={handleUpdateStreaming}
              disabled={!streamingUrl || updateStreamingMutation.isPending}
              data-testid="button-save-streaming-url"
            >
              {updateStreamingMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollments Dialog */}
      <Dialog open={isEnrollmentsDialogOpen} onOpenChange={setIsEnrollmentsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Iscritti al Webinar</DialogTitle>
            <DialogDescription>
              Lista degli utenti iscritti a questa sessione
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {!enrollments || enrollments.length === 0 ? (
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
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        {enrollment.user.firstName && enrollment.user.lastName
                          ? `${enrollment.user.firstName} ${enrollment.user.lastName}`
                          : enrollment.user.firstName || enrollment.user.lastName || 'N/A'}
                      </TableCell>
                      <TableCell>{enrollment.user.email}</TableCell>
                      <TableCell>
                        {format(new Date(enrollment.enrolledAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsEnrollmentsDialogOpen(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
