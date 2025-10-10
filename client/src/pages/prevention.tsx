import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Send, FileText, AlertTriangle, Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import PreventionAssessment from "@/components/PreventionAssessment";

interface PreventionDocument {
  id: string;
  title: string;
  fileUrl: string;
  extractedTopics: string[];
  summary?: string;
}

interface TriageMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface TriageSession {
  id: string;
  status: string;
  hasAlert: boolean;
}

interface LatestAssessment {
  id: string;
  status: string;
  score?: number;
  riskLevel?: string;
}

export default function PreventionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [showAssessment, setShowAssessment] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: latestAssessment, isLoading: assessmentLoading } = useQuery<LatestAssessment>({
    queryKey: ["/api/prevention/assessment/latest"],
    retry: false,
  });

  const { data: documents } = useQuery<PreventionDocument[]>({
    queryKey: ["/api/prevention/documents"],
  });

  // Check if user needs to take assessment
  useEffect(() => {
    if (!assessmentLoading) {
      if (!latestAssessment || latestAssessment.status !== 'completed') {
        setShowAssessment(true);
      }
    }
  }, [latestAssessment, assessmentLoading]);

  const { data: activeSession } = useQuery<TriageSession>({
    queryKey: ["/api/triage/session/active"],
    enabled: !sessionId,
  });

  const { data: session } = useQuery<TriageSession>({
    queryKey: ["/api/triage/session", sessionId],
    enabled: !!sessionId,
  });

  const { data: messages } = useQuery<TriageMessage[]>({
    queryKey: ["/api/triage/messages", sessionId],
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (activeSession?.id && !sessionId) {
      setSessionId(activeSession.id);
    }
  }, [activeSession, sessionId]);

  const startTriageMutation = useMutation({
    mutationFn: (symptom: string) =>
      apiRequest("/api/triage/start", "POST", { initialSymptom: symptom }),
    onSuccess: (data: any) => {
      setSessionId(data.session.id);
      queryClient.invalidateQueries({ queryKey: ["/api/triage/session", data.session.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/triage/messages", data.session.id] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      apiRequest(`/api/triage/${sessionId}/message`, "POST", { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/triage/messages", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/triage/session", sessionId] });
      setUserInput("");
    },
  });

  const handleStart = () => {
    if (!userInput.trim()) {
      toast({ title: "Inserisci un sintomo o domanda", variant: "destructive" });
      return;
    }
    startTriageMutation.mutate(userInput);
  };

  const handleSend = () => {
    if (!userInput.trim() || !sessionId) return;
    sendMessageMutation.mutate(userInput);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show assessment if user hasn't completed it
  if (showAssessment) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Hub Prevenzione Medica</h1>
            <p className="text-muted-foreground">
              Completa l'assessment per accedere alle risorse di prevenzione
            </p>
          </div>
          <PreventionAssessment onComplete={() => {
            setShowAssessment(false);
            queryClient.invalidateQueries({ queryKey: ["/api/prevention/assessment/latest"] });
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Hub Prevenzione Medica</h1>
          <p className="text-muted-foreground">
            Risorse educative e assistente AI per la tua salute
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documenti Prevenzione
                </CardTitle>
                <CardDescription>Guide educative verificate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {documents?.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`doc-card-${doc.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{doc.title}</h4>
                        {doc.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {doc.summary}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {doc.extractedTopics?.slice(0, 2).map((topic, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" data-testid={`button-view-${doc.id}`}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Chiedi Approfondimenti a Prohmed
                    </CardTitle>
                    <CardDescription>
                      Assistente AI per orientamento medico (non sostituisce il medico)
                    </CardDescription>
                  </div>
                  {session?.hasAlert && (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Richiesta Consulto
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {session?.hasAlert && (
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      Sulla base dei sintomi descritti, ti consigliamo di contattare un medico.
                      Il nostro team ha ricevuto la tua segnalazione.
                    </AlertDescription>
                  </Alert>
                )}

                {!sessionId ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Descrivi i tuoi sintomi o domande sulla prevenzione. 
                      L'assistente AI ti fornirà informazioni educative e, se necessario, 
                      suggerirà di consultare un medico.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Es: Ho mal di testa frequente..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                        data-testid="input-triage-start"
                      />
                      <Button
                        onClick={handleStart}
                        disabled={startTriageMutation.isPending}
                        data-testid="button-start-triage"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Inizia
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-[400px] border rounded-md p-4">
                      <div className="space-y-4">
                        {messages?.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            data-testid={`message-${msg.id}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {session?.status === 'active' && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Scrivi un messaggio..."
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          data-testid="input-triage-message"
                        />
                        <Button
                          onClick={handleSend}
                          disabled={sendMessageMutation.isPending}
                          data-testid="button-send-message"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
