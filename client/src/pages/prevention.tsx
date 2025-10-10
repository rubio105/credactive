import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Send, FileText, AlertTriangle, Download, X, RotateCcw } from "lucide-react";
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

  // Assessment is optional - user can access directly without completing it
  // Educational focus: learn about prevention, not mandatory diagnostic assessment

  const { data: activeSession } = useQuery<TriageSession>({
    queryKey: ["/api/triage/session/active"],
    enabled: !sessionId && !!user, // Only check for active sessions if user is authenticated
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
      // Set data directly in cache instead of invalidating to avoid race conditions
      queryClient.setQueryData(["/api/triage/session", data.session.id], data.session);
      queryClient.setQueryData(["/api/triage/messages", data.session.id], data.messages);
    },
    onError: (error: any) => {
      const message = error?.message || "Errore durante l'avvio della conversazione";
      toast({ 
        title: "Errore", 
        description: message.includes("quota") || message.includes("429") 
          ? "Il servizio AI ha raggiunto il limite giornaliero. Riprova più tardi." 
          : message,
        variant: "destructive" 
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      apiRequest(`/api/triage/${sessionId}/message`, "POST", { content: message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/triage/messages", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/triage/session", sessionId] });
      setUserInput("");
    },
    onError: (error: any) => {
      const message = error?.message || "Errore durante l'invio del messaggio";
      toast({ 
        title: "Errore", 
        description: message.includes("quota") || message.includes("429") 
          ? "Il servizio AI ha raggiunto il limite giornaliero. Riprova più tardi." 
          : message,
        variant: "destructive" 
      });
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

  const closeSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest(`/api/triage/${sessionId}/close`, "POST", {}),
    onSuccess: () => {
      // Clear cached active session BEFORE clearing local state to prevent useEffect from restoring it
      queryClient.setQueryData(["/api/triage/session/active"], null);
      setSessionId(null);
      setUserInput("");
      toast({ title: "Conversazione terminata" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: "Errore durante la chiusura della conversazione",
        variant: "destructive" 
      });
    },
  });

  const handleCloseSession = () => {
    if (sessionId) {
      closeSessionMutation.mutate(sessionId);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            AI Prohmed - Impara la Prevenzione
          </h1>
          <p className="text-muted-foreground text-lg">
            Condividi il tuo caso personale e scopri strategie pratiche per la prevenzione con l'intelligenza artificiale
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
                      <Shield className="w-5 h-5 text-emerald-600" />
                      Parla del Tuo Caso
                    </CardTitle>
                    <CardDescription>
                      Conversazione educativa personalizzata sulla prevenzione
                    </CardDescription>
                  </div>
                  {sessionId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseSession}
                      data-testid="button-close-session"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Nuova Conversazione
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!sessionId ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-2">
                        💡 Come funziona l'educazione alla prevenzione?
                      </p>
                      <ul className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
                        <li>• Condividi il tuo caso personale o interesse</li>
                        <li>• L'AI ti guida nell'apprendimento di strategie preventive</li>
                        <li>• Ricevi consigli pratici basati su evidenze scientifiche</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Esempi di casi pratici:</p>
                      <div className="grid grid-cols-1 gap-2">
                        <Button 
                          variant="outline" 
                          className="justify-start text-left h-auto py-2"
                          onClick={() => setUserInput("Ho familiarità con il diabete, come posso prevenirlo?")}
                          data-testid="button-example-diabetes"
                        >
                          <span className="text-xs">Ho familiarità con il diabete, come posso prevenirlo?</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start text-left h-auto py-2"
                          onClick={() => setUserInput("Lavoro molto seduto, cosa posso fare per la mia salute cardiovascolare?")}
                          data-testid="button-example-cardiovascular"
                        >
                          <span className="text-xs">Lavoro molto seduto, cosa posso fare per la salute cardiovascolare?</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start text-left h-auto py-2"
                          onClick={() => setUserInput("Ho 45 anni, quali screening preventivi dovrei fare?")}
                          data-testid="button-example-screening"
                        >
                          <span className="text-xs">Ho 45 anni, quali screening preventivi dovrei fare?</span>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Es: Vorrei imparare a prevenire l'ipertensione..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                        data-testid="input-triage-start"
                      />
                      <Button
                        onClick={handleStart}
                        disabled={startTriageMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
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
