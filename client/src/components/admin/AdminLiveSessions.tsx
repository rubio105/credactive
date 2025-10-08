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
import { Badge } from "@/components/ui/badge";
import { Play, StopCircle, BarChart3, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

interface LiveCourseSession {
  id: string;
  liveCourseId: string;
  title: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolled: number;
  status: string;
  course?: {
    title: string;
  };
}

interface LiveStreamingSession {
  id: string;
  sessionId: string;
  streamUrl: string;
  title: string;
  isActive: boolean;
}

interface StreamingMessage {
  id: string;
  userName: string;
  message: string;
  isAdminMessage: boolean;
  createdAt: string;
}

interface Poll {
  id: string;
  question: string;
  options: { label: string; text: string }[];
  isActive: boolean;
  showResults: boolean;
}

export function AdminLiveSessions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<LiveCourseSession | null>(null);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isPollDialogOpen, setIsPollDialogOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<{ label: string; text: string }[]>([
    { label: "A", text: "" },
    { label: "B", text: "" }
  ]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [chatMessages, setChatMessages] = useState<StreamingMessage[]>([]);

  const { data: sessions, isLoading } = useQuery<LiveCourseSession[]>({
    queryKey: ["/api/admin/live-course-sessions"],
  });

  // Fetch all active streaming sessions (independent of selected session)
  const { data: allActiveStreamings } = useQuery<LiveStreamingSession[]>({
    queryKey: ["/api/admin/active-streaming-sessions"],
    refetchInterval: 5000,
  });

  // Get active streaming for selected session if any
  const activeStreaming = allActiveStreamings?.find(s => s.sessionId === selectedSession?.id);

  // Auto-select first active session after reload (when selectedSession is null but there are active sessions)
  useEffect(() => {
    if (!selectedSession && allActiveStreamings && allActiveStreamings.length > 0 && sessions) {
      const firstActiveSession = sessions.find(s => 
        allActiveStreamings.some(a => a.sessionId === s.id)
      );
      if (firstActiveSession) {
        setSelectedSession(firstActiveSession);
      }
    }
  }, [allActiveStreamings, sessions, selectedSession]);

  const startStreamingMutation = useMutation({
    mutationFn: (data: { sessionId: string; streamUrl: string; title: string }) =>
      apiRequest("/api/admin/live-streaming/start", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/active-streaming-sessions"] });
      setIsStartDialogOpen(false);
      toast({ title: "Sessione live avviata con successo" });
    },
    onError: (error: any) => {
      toast({ title: "Errore: " + (error?.message || "Impossibile avviare sessione"), variant: "destructive" });
    },
  });

  const endStreamingMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/admin/live-streaming/${id}/end`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/active-streaming-sessions"] });
      toast({ title: "Sessione live terminata" });
      if (ws) {
        ws.close();
        setWs(null);
      }
    },
    onError: () => {
      toast({ title: "Errore durante la chiusura", variant: "destructive" });
    },
  });

  const createPollMutation = useMutation({
    mutationFn: (data: { question: string; options: { label: string; text: string }[] }) =>
      apiRequest(`/api/admin/live-streaming/${activeStreaming?.id}/poll`, "POST", data),
    onSuccess: () => {
      setIsPollDialogOpen(false);
      setPollQuestion("");
      setPollOptions([{ label: "A", text: "" }, { label: "B", text: "" }]);
      toast({ title: "Poll creato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante la creazione del poll", variant: "destructive" });
    },
  });

  // WebSocket connection
  useEffect(() => {
    if (!activeStreaming?.isActive || !user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-stream`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("WebSocket connected");
      websocket.send(JSON.stringify({
        type: 'auth',
        userId: user.id,
        sessionId: activeStreaming.sessionId,
        userName: `${user.firstName} ${user.lastName} (Admin)`
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'history') {
        setChatMessages(data.messages);
      } else if (data.type === 'chat') {
        setChatMessages(prev => [...prev, data.message]);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({ title: "Errore connessione WebSocket", variant: "destructive" });
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [activeStreaming, user]);

  const handleStartStreaming = () => {
    if (!selectedSession || !streamUrl) return;
    
    startStreamingMutation.mutate({
      sessionId: selectedSession.id,
      streamUrl,
      title: selectedSession.title
    });
  };

  const handleCreatePoll = () => {
    if (!pollQuestion || pollOptions.some(opt => !opt.text)) {
      toast({ title: "Compila tutti i campi del poll", variant: "destructive" });
      return;
    }

    createPollMutation.mutate({
      question: pollQuestion,
      options: pollOptions
    });
  };

  const addPollOption = () => {
    const nextLabel = String.fromCharCode(65 + pollOptions.length); // A, B, C, D...
    setPollOptions([...pollOptions, { label: nextLabel, text: "" }]);
  };

  if (isLoading) {
    return <div className="text-center py-8">Caricamento sessioni...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestione Sessioni Live</CardTitle>
          <CardDescription>
            Avvia e gestisci le sessioni di streaming live per i corsi programmati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corso</TableHead>
                <TableHead>Sessione</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Iscritti</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions?.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.course?.title}</TableCell>
                  <TableCell>{session.title}</TableCell>
                  <TableCell>
                    {new Date(session.startDate).toLocaleString('it-IT')}
                  </TableCell>
                  <TableCell>
                    {session.enrolled}/{session.capacity}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant={session.status === 'available' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                      {allActiveStreamings?.some(s => s.sessionId === session.id) && (
                        <Badge variant="destructive" className="animate-pulse">
                          🔴 LIVE
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSession(session);
                          setIsStartDialogOpen(true);
                        }}
                        data-testid={`button-start-streaming-${session.id}`}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Avvia Live
                      </Button>
                      {activeStreaming?.isActive && activeStreaming.sessionId === session.id && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => endStreamingMutation.mutate(activeStreaming.id)}
                          data-testid={`button-end-streaming-${session.id}`}
                        >
                          <StopCircle className="w-4 h-4 mr-1" />
                          Termina
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!sessions?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nessuna sessione programmata
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Active Streaming Control */}
      {activeStreaming?.isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Sessione Live Attiva: {activeStreaming.title}</CardTitle>
            <CardDescription>
              Stream URL: <a href={activeStreaming.streamUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{activeStreaming.streamUrl}</a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setIsPollDialogOpen(true)}
                data-testid="button-create-poll"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Crea Poll
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-muted/30">
              <h3 className="font-semibold mb-2">Chat in Tempo Reale</h3>
              <div className="space-y-2">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded ${msg.isAdminMessage ? 'bg-primary/10' : 'bg-background'}`}
                  >
                    <div className="text-sm font-medium">{msg.userName}</div>
                    <div className="text-sm">{msg.message}</div>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <div className="text-sm text-muted-foreground">Nessun messaggio ancora</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Streaming Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avvia Sessione Live</DialogTitle>
            <DialogDescription>
              Inserisci l'URL dello streaming (YouTube Live, Zoom, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stream-url">URL Streaming</Label>
              <Input
                id="stream-url"
                placeholder="https://youtube.com/watch?v=..."
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                data-testid="input-stream-url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStartDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={handleStartStreaming}
              disabled={!streamUrl || startStreamingMutation.isPending}
              data-testid="button-confirm-start-streaming"
            >
              {startStreamingMutation.isPending ? "Avvio..." : "Avvia Streaming"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Poll Dialog */}
      <Dialog open={isPollDialogOpen} onOpenChange={setIsPollDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crea Poll Interattivo</DialogTitle>
            <DialogDescription>
              Crea un sondaggio o quiz per i partecipanti
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="poll-question">Domanda</Label>
              <Input
                id="poll-question"
                placeholder="Inserisci la domanda..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                data-testid="input-poll-question"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Opzioni di Risposta</Label>
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    className="w-16"
                    value={option.label}
                    disabled
                  />
                  <Input
                    placeholder="Testo dell'opzione..."
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...pollOptions];
                      newOptions[index].text = e.target.value;
                      setPollOptions(newOptions);
                    }}
                    data-testid={`input-poll-option-${index}`}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPollOption}
                className="mt-2"
                data-testid="button-add-poll-option"
              >
                <Plus className="w-4 h-4 mr-1" />
                Aggiungi Opzione
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPollDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={handleCreatePoll}
              disabled={createPollMutation.isPending}
              data-testid="button-confirm-create-poll"
            >
              {createPollMutation.isPending ? "Creazione..." : "Crea Poll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
