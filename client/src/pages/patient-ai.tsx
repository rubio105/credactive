import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Send, FileText, Activity, Mic, MicOff, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const ciryLogo = "/images/ciry-full-logo.png";

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

export default function PatientAIPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [prohmedCode, setProhmedCode] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: activeSession } = useQuery<TriageSession>({
    queryKey: ["/api/triage/session/active"],
    enabled: !!user && !sessionId,
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

  const handleProhmedLogin = async () => {
    if (!prohmedCode.trim()) {
      toast({
        title: "Codice richiesto",
        description: "Inserisci il tuo codice Prohmed",
        variant: "destructive"
      });
      return;
    }

    setIsAuthenticating(true);
    try {
      const response = await apiRequest("/api/patient-ai/login", "POST", { code: prohmedCode });
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Accesso autorizzato",
          description: "Benvenuto nella sezione AI Prevenzione"
        });
        window.location.reload(); // Reload to update auth state
      } else {
        toast({
          title: "Codice non valido",
          description: data.message || "Il codice Prohmed non è valido o è già stato utilizzato",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile verificare il codice",
        variant: "destructive"
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const startTriageMutation = useMutation({
    mutationFn: async (symptom: string) => {
      const response = await apiRequest("/api/triage/start", "POST", { initialSymptom: symptom });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (!data || !data.session || !data.session.id) {
        toast({
          title: "Errore",
          description: "Risposta non valida dal server",
          variant: "destructive"
        });
        return;
      }
      setSessionId(data.session.id);
      queryClient.setQueryData(["/api/triage/session", data.session.id], data.session);
      queryClient.setQueryData(["/api/triage/messages", data.session.id], data.messages);
      setUserInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Errore durante l'avvio della conversazione",
        variant: "destructive"
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("/api/triage/message", "POST", {
        sessionId,
        message,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/triage/messages", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/triage/session", sessionId] });
      setUserInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Errore durante l'invio del messaggio",
        variant: "destructive"
      });
    },
  });

  const handleStart = () => {
    if (!userInput.trim()) return;
    startTriageMutation.mutate(userInput);
  };

  const handleSend = () => {
    if (!userInput.trim()) return;
    sendMessageMutation.mutate(userInput);
  };

  const handleCloseSession = () => {
    setSessionId(null);
    queryClient.invalidateQueries({ queryKey: ["/api/triage/session/active"] });
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-emerald-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <img src={ciryLogo} alt="CIRY" className="h-16 mx-auto mb-4" />
            <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-300">
              Accesso AI Prevenzione
            </CardTitle>
            <CardDescription>
              Inserisci il tuo codice Prohmed per accedere
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
              <Shield className="w-5 h-5 text-emerald-600" />
              <AlertDescription className="ml-2 text-sm text-emerald-800 dark:text-emerald-200">
                <p className="font-semibold mb-1">🔒 Accesso Sicuro</p>
                <p>Il tuo codice Prohmed ti garantisce accesso dedicato alla sezione AI Prevenzione</p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Input
                placeholder="PROHMED-XXXXX-XXXXX"
                value={prohmedCode}
                onChange={(e) => setProhmedCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleProhmedLogin()}
                className="border-emerald-200 focus:border-emerald-500 dark:border-emerald-800 text-center font-mono"
                data-testid="input-prohmed-code"
              />
              <Button
                onClick={handleProhmedLogin}
                disabled={isAuthenticating || !prohmedCode.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                data-testid="button-prohmed-login"
              >
                {isAuthenticating ? "Verifica in corso..." : "Accedi"}
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Non hai un codice Prohmed?
              </p>
              <Button
                variant="link"
                className="text-emerald-600 dark:text-emerald-400"
                onClick={() => setLocation('/')}
                data-testid="link-home"
              >
                Torna alla Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-emerald-950">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={ciryLogo} alt="CIRY" className="h-12" />
              <div>
                <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  AI Prevenzione
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Assistente AI dedicato alla tua salute
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/api/auth/logout';
              }}
              data-testid="button-logout"
            >
              Esci
            </Button>
          </div>

          <Card className="shadow-lg border-emerald-100 dark:border-emerald-900">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <Shield className="w-5 h-5" />
                    Conversazione Prevenzione
                  </CardTitle>
                  <CardDescription>
                    L'AI ti guida nell'apprendimento di strategie preventive
                  </CardDescription>
                </div>
                {sessionId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCloseSession}
                    className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                    data-testid="button-close-session"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Nuova Conversazione
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {!sessionId ? (
                <div className="space-y-4">
                  <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                    <AlertDescription className="text-sm text-emerald-800 dark:text-emerald-200">
                      <p className="font-semibold mb-2">💡 Come funziona?</p>
                      <ul className="space-y-1">
                        <li>• Condividi il tuo caso personale o interesse</li>
                        <li>• L'AI ti guida nell'apprendimento di strategie preventive</li>
                        <li>• Ricevi consigli pratici basati su evidenze scientifiche</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Es: Vorrei imparare a prevenire l'ipertensione..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                      className="border-emerald-200 focus:border-emerald-500 dark:border-emerald-800"
                      data-testid="input-start-chat"
                    />
                    <Button
                      onClick={handleStart}
                      disabled={startTriageMutation.isPending}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                      data-testid="button-start-chat"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {startTriageMutation.isPending ? "Avvio..." : "Inizia"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[500px] border border-emerald-100 dark:border-emerald-800 rounded-lg p-4 bg-gradient-to-b from-white to-emerald-50/30 dark:from-gray-950 dark:to-emerald-950/30">
                    <div className="space-y-4">
                      {messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          data-testid={`message-${msg.id}`}
                        >
                          <div
                            className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                                : 'bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-800'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
                        className="border-emerald-200 focus:border-emerald-500 dark:border-emerald-800"
                        data-testid="input-message"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={sendMessageMutation.isPending}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                        data-testid="button-send"
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
  );
}
