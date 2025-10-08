import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Send, Users, MessageSquare, BarChart3, AlertCircle, Video, Lock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface LiveSession {
  id: string;
  courseId: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolled: number;
  status: string;
  course: {
    title: string;
    description?: string;
    instructor?: string;
  };
}

interface StreamingSession {
  id: string;
  sessionId: string;
  streamUrl: string;
  title: string;
  isActive: boolean;
  startedAt?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
  isAdmin: boolean;
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  showResults: boolean;
  createdAt: string;
}

interface PollWithResults extends Poll {
  responses: { option: string; count: number }[];
  totalVotes: number;
  userResponse?: string;
}

export default function LiveSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activePolls, setActivePolls] = useState<PollWithResults[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<number>();

  // Fetch session details
  const { data: session, isLoading: sessionLoading } = useQuery<LiveSession>({
    queryKey: ["/api/live-course-sessions", sessionId],
    enabled: !!sessionId,
  });

  // Check enrollment
  const { data: isEnrolled, isLoading: enrollmentLoading } = useQuery<boolean>({
    queryKey: ["/api/live-courses/check-enrollment", sessionId],
    enabled: !!sessionId && !!user,
  });

  // Fetch active streaming session
  const { data: streamingSession, isLoading: streamLoading } = useQuery<StreamingSession>({
    queryKey: ["/api/live-streaming", sessionId],
    enabled: !!sessionId && isEnrolled === true,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch chat history
  const { data: chatHistory } = useQuery<ChatMessage[]>({
    queryKey: ["/api/live-streaming/chat", streamingSession?.id],
    enabled: !!streamingSession?.id,
  });

  // Fetch active polls
  const { data: pollsData } = useQuery<PollWithResults[]>({
    queryKey: ["/api/live-streaming/polls", streamingSession?.id],
    enabled: !!streamingSession?.id,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      apiRequest("/api/live-streaming/chat/send", "POST", {
        streamingSessionId: streamingSession?.id,
        message,
      }),
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/live-streaming/chat"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile inviare il messaggio",
        variant: "destructive",
      });
    },
  });

  // Vote on poll mutation
  const votePollMutation = useMutation({
    mutationFn: (data: { pollId: string; option: string }) =>
      apiRequest("/api/live-streaming/poll/vote", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-streaming/polls"] });
      toast({
        title: "Voto registrato",
        description: "Il tuo voto è stato registrato con successo",
      });
    },
  });

  // Setup WebSocket
  useEffect(() => {
    if (!streamingSession?.id || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("[WebSocket] Connected");
      websocket.send(JSON.stringify({
        type: "join",
        streamingSessionId: streamingSession.id,
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "chat") {
        setChatMessages(prev => [...prev, data.message]);
        // Auto-scroll to bottom
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } else if (data.type === "poll_created" || data.type === "poll_updated") {
        queryClient.invalidateQueries({ queryKey: ["/api/live-streaming/polls"] });
      } else if (data.type === "session_ended") {
        toast({
          title: "Sessione terminata",
          description: "La sessione live è terminata",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/live-streaming/session"] });
      }
    };

    websocket.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
    };

    websocket.onclose = () => {
      console.log("[WebSocket] Disconnected");
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (streamingSession?.isActive) {
          console.log("[WebSocket] Reconnecting...");
          setWs(null); // Trigger re-effect
        }
      }, 3000);
    };

    setWs(websocket);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      websocket.close();
    };
  }, [streamingSession?.id, user]);

  // Load chat history into state
  useEffect(() => {
    if (chatHistory) {
      setChatMessages(chatHistory);
    }
  }, [chatHistory]);

  // Load polls into state
  useEffect(() => {
    if (pollsData) {
      setActivePolls(pollsData);
    }
  }, [pollsData]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(messageInput);
  };

  const handleVotePoll = (pollId: string, option: string) => {
    votePollMutation.mutate({ pollId, option });
  };

  // Render loading state
  if (authLoading || sessionLoading || enrollmentLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Devi effettuare il login per accedere a questa sessione.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Check enrollment
  if (isEnrolled === false) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center p-12">
            <div className="inline-block p-4 bg-red-500/10 rounded-full mb-6">
              <Lock className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Accesso Negato</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Non sei iscritto a questa sessione live. Iscriviti per partecipare.
            </p>
            <Button onClick={() => window.location.href = "/"} data-testid="button-back-home">
              Torna alla Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Check if streaming is active
  if (!streamingSession || !streamingSession.isActive) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center p-12">
            <div className="inline-block p-4 bg-yellow-500/10 rounded-full mb-6">
              <Video className="w-12 h-12 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Sessione Non Attiva</h1>
            <p className="text-lg text-muted-foreground mb-4">
              La sessione live non è ancora iniziata.
            </p>
            {session && (
              <div className="text-left max-w-md mx-auto space-y-2 mb-8">
                <p><strong>Corso:</strong> {session.course.title}</p>
                <p><strong>Inizio:</strong> {format(new Date(session.startDate), "d MMMM yyyy 'alle' HH:mm", { locale: it })}</p>
                <p><strong>Fine:</strong> {format(new Date(session.endDate), "d MMMM yyyy 'alle' HH:mm", { locale: it })}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-8">
              Riceverai una notifica quando la sessione sarà attiva.
            </p>
            <Button onClick={() => window.location.href = "/"} data-testid="button-back-home">
              Torna alla Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Extract video ID from URL for embedding
  const getEmbedUrl = (url: string) => {
    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be") 
        ? url.split("/").pop()?.split("?")[0]
        : new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Zoom (direct embed not supported, show link instead)
    if (url.includes("zoom.us")) {
      return null; // Will show link instead
    }
    // Google Meet (direct embed not supported)
    if (url.includes("meet.google.com")) {
      return null;
    }
    // Return as-is for other embeddable sources
    return url;
  };

  const embedUrl = getEmbedUrl(streamingSession.streamUrl);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-session-title">
                {streamingSession.title}
              </h1>
              <p className="text-muted-foreground">
                {session?.course.title} - {session?.course.instructor}
              </p>
            </div>
            <Badge variant="destructive" className="animate-pulse" data-testid="badge-live">
              🔴 LIVE
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                {embedUrl ? (
                  <div className="aspect-video bg-black">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      data-testid="iframe-video"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <Video className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg mb-4">Apri il link per partecipare alla sessione:</p>
                      <a
                        href={streamingSession.streamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                        data-testid="link-external-video"
                      >
                        {streamingSession.streamUrl}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Polls */}
            {activePolls.length > 0 && (
              <div className="mt-6 space-y-4">
                {activePolls.map((poll) => (
                  <Card key={poll.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Sondaggio
                      </CardTitle>
                      <CardDescription>{poll.question}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {poll.userResponse ? (
                        <div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Hai votato: <strong>{poll.userResponse}</strong>
                          </p>
                          {poll.showResults && (
                            <div className="space-y-3">
                              {poll.responses.map((resp) => {
                                const percentage = poll.totalVotes > 0 
                                  ? Math.round((resp.count / poll.totalVotes) * 100)
                                  : 0;
                                return (
                                  <div key={resp.option}>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span>{resp.option}</span>
                                      <span className="text-muted-foreground">
                                        {resp.count} voti ({percentage}%)
                                      </span>
                                    </div>
                                    <Progress value={percentage} />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <RadioGroup onValueChange={(value) => handleVotePoll(poll.id, value)}>
                          {poll.options.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${poll.id}-${option}`} data-testid={`radio-poll-${poll.id}-${option}`} />
                              <Label htmlFor={`${poll.id}-${option}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          <div>
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Chat Live
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {session?.enrolled || 0} partecipanti
                </CardDescription>
              </CardHeader>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${msg.isAdmin ? 'text-red-500' : 'text-primary'}`}>
                          {msg.userName}
                          {msg.isAdmin && <Badge variant="destructive" className="ml-1 text-xs">Admin</Badge>}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.createdAt), "HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm" data-testid={`message-${msg.id}`}>{msg.message}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Scrivi un messaggio..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={sendMessageMutation.isPending}
                    data-testid="input-chat-message"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
