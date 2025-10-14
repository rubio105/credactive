import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Send, FileText, Activity, Mic, MicOff, X, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { MedicalReportCard } from "@/components/MedicalReportCard";
import { MedicalTimeline } from "@/components/MedicalTimeline";
import { MedicalImageAnalysis } from "@/components/MedicalImageAnalysis";

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

interface TriageAlert {
  id: string;
  sessionId: string;
  userId: string;
  alertType: string;
  reason: string;
  urgencyLevel: string;
  status: string;
  userResolved: boolean;
  createdAt: string;
}

interface HealthReport {
  id: string;
  reportType: string;
  fileName: string;
  fileType: string;
  reportDate: string | null;
  issuer: string | null;
  aiSummary: string;
  extractedValues: Record<string, any>;
  radiologicalAnalysis: {
    imageType: string;
    bodyPart: string;
    findings: Array<{
      category: 'normal' | 'attention' | 'urgent';
      description: string;
      location?: string;
      confidence?: number;
    }>;
    overallAssessment: string;
    recommendations: string[];
    confidence: number;
  } | null;
  createdAt: string;
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
  const [dismissedAlertId, setDismissedAlertId] = useState<string | null>(
    localStorage.getItem('dismissedAlertId')
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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

  // Query per i referti del paziente
  const { data: healthReports = [] } = useQuery<HealthReport[]>({
    queryKey: ["/api/health-score/reports/my"],
    enabled: !!user,
  });

  // Query per alert pendente
  const { data: pendingAlert } = useQuery<TriageAlert | null>({
    queryKey: ["/api/triage/pending-alert"],
    enabled: !!user,
  });

  // Mutation per risolvere l'alert (Sì, risolto)
  const resolveAlertMutation = useMutation({
    mutationFn: async ({ alertId, response }: { alertId: string; response: string }) => {
      const res = await apiRequest("/api/triage/resolve-alert", "POST", { alertId, response });
      return res.json();
    },
    onSuccess: () => {
      // Clear dismissed alert ID immediately when resolved
      setDismissedAlertId(null);
      localStorage.removeItem('dismissedAlertId');
      
      queryClient.invalidateQueries({ queryKey: ["/api/triage/pending-alert"] });
      toast({
        title: "Ottimo!",
        description: "Siamo felici che il problema sia risolto. C'è qualcos'altro con cui possiamo aiutarti?"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Impossibile aggiornare lo stato",
        variant: "destructive"
      });
    },
  });

  // Mutation per contattare medico Prohmed
  const contactProhmedMutation = useMutation({
    mutationFn: async ({ alertId }: { alertId: string }) => {
      // Prima metti l'alert in monitoring
      await apiRequest("/api/triage/monitor-alert", "POST", { 
        alertId, 
        response: "Richiesta contatto medico Prohmed" 
      });
      // Poi invia email Prohmed
      const res = await apiRequest("/api/triage/request-medical-contact", "POST", {});
      return res.json();
    },
    onSuccess: () => {
      // Clear dismissed alert ID when contacting doctor
      setDismissedAlertId(null);
      localStorage.removeItem('dismissedAlertId');
      
      queryClient.invalidateQueries({ queryKey: ["/api/triage/pending-alert"] });
      toast({
        title: "✉️ Email inviata!",
        description: "Riceverai presto un'email da Prohmed con le istruzioni per prenotare una visita medica."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Impossibile inviare la richiesta",
        variant: "destructive"
      });
    },
  });

  useEffect(() => {
    if (activeSession?.id && !sessionId) {
      setSessionId(activeSession.id);
    }
  }, [activeSession, sessionId]);

  // Clear dismissed alert when alert changes or is resolved
  useEffect(() => {
    if (!pendingAlert && dismissedAlertId) {
      setDismissedAlertId(null);
      localStorage.removeItem('dismissedAlertId');
    }
  }, [pendingAlert, dismissedAlertId]);

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
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: "smooth",
          block: "end",
          inline: "nearest"
        });
      }
    }, 150); // Delay to ensure DOM is updated with new message
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

          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-emerald-50 dark:bg-emerald-950/50">
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white"
                data-testid="tab-chat"
              >
                <Shield className="w-4 h-4 mr-2" />
                Chat AI
              </TabsTrigger>
              <TabsTrigger 
                value="reports"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white"
                data-testid="tab-reports"
              >
                <FileText className="w-4 h-4 mr-2" />
                I Miei Referti
                {healthReports.length > 0 && (
                  <span className="ml-2 bg-emerald-600 text-white rounded-full px-2 py-0.5 text-xs">
                    {healthReports.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-4">
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
                  {/* Alert Follow-up personalizzato */}
                  {pendingAlert && !sessionId && dismissedAlertId !== pendingAlert.id && (
                    <Alert className={`border-2 ${
                      pendingAlert.urgencyLevel === 'high' || pendingAlert.urgencyLevel === 'emergency' 
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700' 
                        : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700'
                    }`} data-testid="alert-followup">
                      <AlertDescription className="space-y-3">
                        <p className="text-sm">
                          Ciao {user?.firstName || 'utente'},<br />
                          Riguardo al problema di salute individuato recentemente, è ancora presente?
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => resolveAlertMutation.mutate({ 
                              alertId: pendingAlert.id, 
                              response: "Sì, risolto" 
                            })}
                            disabled={resolveAlertMutation.isPending || contactProhmedMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            data-testid="button-resolve-yes"
                          >
                            ✓ Sì, risolto
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDismissedAlertId(pendingAlert.id);
                              localStorage.setItem('dismissedAlertId', pendingAlert.id);
                            }}
                            disabled={resolveAlertMutation.isPending || contactProhmedMutation.isPending}
                            className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
                            data-testid="button-dismiss-alert"
                          >
                            Ignora
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => contactProhmedMutation.mutate({ alertId: pendingAlert.id })}
                            disabled={resolveAlertMutation.isPending || contactProhmedMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            data-testid="button-contact-prohmed"
                          >
                            📞 Contatta medico Prohmed
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

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

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          💬 Prova uno scenario di esempio:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            className="text-left h-auto py-3 px-4 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                            onClick={() => setUserInput("Raccontami l'ultimo referto")}
                            data-testid="example-latest-report"
                          >
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                                Raccontami l'ultimo referto
                              </span>
                            </div>
                          </Button>
                          <Button
                            variant="outline"
                            className="text-left h-auto py-3 px-4 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                            onClick={() => setUserInput("Vorrei imparare a prevenire l'ipertensione")}
                            data-testid="example-hypertension"
                          >
                            <div className="flex items-start gap-2">
                              <Activity className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                                Vorrei imparare a prevenire l'ipertensione
                              </span>
                            </div>
                          </Button>
                          <Button
                            variant="outline"
                            className="text-left h-auto py-3 px-4 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                            onClick={() => setUserInput("Come posso migliorare i miei valori del colesterolo?")}
                            data-testid="example-cholesterol"
                          >
                            <div className="flex items-start gap-2">
                              <Activity className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                                Come posso migliorare i miei valori del colesterolo?
                              </span>
                            </div>
                          </Button>
                          <Button
                            variant="outline"
                            className="text-left h-auto py-3 px-4 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                            onClick={() => setUserInput("Quali esami di screening sono consigliati per la mia età?")}
                            data-testid="example-screening"
                          >
                            <div className="flex items-start gap-2">
                              <Shield className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                                Quali esami di screening sono consigliati per la mia età?
                              </span>
                            </div>
                          </Button>
                        </div>
                      </div>

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
                      <ScrollArea ref={scrollAreaRef} className="h-[500px] border border-emerald-100 dark:border-emerald-800 rounded-lg p-4 bg-gradient-to-b from-white to-emerald-50/30 dark:from-gray-950 dark:to-emerald-950/30">
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
                        <div className="space-y-2">
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
                          
                          <Button
                            onClick={() => setShowUploadDialog(true)}
                            variant="outline"
                            className="w-full border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                            data-testid="button-upload-report-chat"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Carica Referto/Analisi
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="mt-4">
              <Card className="shadow-lg border-emerald-100 dark:border-emerald-900">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                  <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <FileText className="w-5 h-5" />
                    I Miei Referti Medici
                  </CardTitle>
                  <CardDescription>
                    Visualizza i tuoi referti anonimizzati caricati nel sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {healthReports.length === 0 ? (
                    <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                      <FileUp className="w-5 h-5 text-emerald-600" />
                      <AlertDescription className="ml-2 text-emerald-800 dark:text-emerald-200">
                        <p className="font-semibold mb-1">Nessun referto caricato</p>
                        <p className="text-sm">I referti che caricherai tramite l'AI appariranno qui, completamente anonimizzati per la tua privacy.</p>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-6">
                      <MedicalTimeline 
                        reports={healthReports.map(r => ({
                          id: r.id,
                          title: r.fileName,
                          reportType: r.reportType,
                          uploadDate: r.createdAt,
                          summary: r.aiSummary
                        }))}
                      />
                      
                      <div className="space-y-4">
                        {healthReports.map((report) => (
                          <div key={report.id} className="space-y-4">
                            <MedicalReportCard 
                              report={{
                                id: report.id,
                                title: report.fileName,
                                reportType: report.reportType,
                                uploadDate: report.createdAt,
                                aiSummary: report.aiSummary,
                                medicalValues: Object.entries(report.extractedValues || {}).map(([name, value]) => ({
                                  name,
                                  value: String(value)
                                })),
                                hospitalName: report.issuer || undefined
                              }}
                            />
                            
                            {report.radiologicalAnalysis && (
                              <MedicalImageAnalysis 
                                analysis={{
                                  id: report.id,
                                  uploadDate: report.createdAt,
                                  imageType: report.radiologicalAnalysis.imageType as 'xray' | 'mri' | 'ct' | 'ultrasound' | 'general',
                                  bodyPart: report.radiologicalAnalysis.bodyPart,
                                  findings: report.radiologicalAnalysis.findings,
                                  overallAssessment: report.radiologicalAnalysis.overallAssessment,
                                  recommendations: report.radiologicalAnalysis.recommendations,
                                  confidence: report.radiologicalAnalysis.confidence
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
