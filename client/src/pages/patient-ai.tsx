import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Send, FileText, Activity, Mic, MicOff, X, FileUp, Heart, TrendingUp, Clock, AlertCircle, Sparkles, Stethoscope, Info, MessageSquarePlus, Upload, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useLogout } from "@/hooks/useLogout";
import { MedicalReportCard } from "@/components/MedicalReportCard";
import { MedicalTimeline } from "@/components/MedicalTimeline";
import { MedicalImageAnalysis } from "@/components/MedicalImageAnalysis";
import { PreventionPathDialog } from "@/components/PreventionPathDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

// Urgency style for exam recommendations
function getUrgencyStyle(urgency: 'low' | 'medium' | 'high') {
  switch (urgency) {
    case 'high':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-400',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
        label: 'Alta priorità'
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        border: 'border-yellow-400',
        badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
        label: 'Priorità media'
      };
    case 'low':
      return {
        bg: 'bg-green-50 dark:bg-green-950/30',
        border: 'border-green-400',
        badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
        label: 'Bassa priorità'
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-950/30',
        border: 'border-gray-400',
        badge: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200',
        label: 'Normale'
      };
  }
}

export default function PatientAIPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const { isMobileView } = useViewMode();
  const handleLogout = useLogout();
  
  const isDoctor = (user as any)?.isDoctor;
  const [isListening, setIsListening] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showExamsDialog, setShowExamsDialog] = useState(false);
  const [showAnalyzeReportDialog, setShowAnalyzeReportDialog] = useState(false);
  const [showPreventionPathDialog, setShowPreventionPathDialog] = useState(false);
  const [preventionPathData, setPreventionPathData] = useState<any>(null);
  const [examsRecommendations, setExamsRecommendations] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [prohmedCode, setProhmedCode] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [dismissedAlertId, setDismissedAlertId] = useState<string | null>(
    localStorage.getItem('dismissedAlertId')
  );
  const [currentPage, setCurrentPage] = useState(1);
  const REPORTS_PER_PAGE = 2;
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
    queryKey: ["/api/health-score/reports"],
    enabled: !!user,
  });

  // Query per Prevention Index
  const { data: preventionIndex } = useQuery<any>({
    queryKey: ["/api/prevention-index"],
    enabled: !!user,
  });

  // Query per dati wearable
  const { data: wearableData } = useQuery<any>({
    queryKey: ["/api/wearable/monitoring"],
    enabled: !!user,
  });

  // Reset current page if it exceeds total pages (e.g., after report deletion)
  useEffect(() => {
    const totalPages = Math.ceil(healthReports.length / REPORTS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [healthReports.length, currentPage]);

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
      // Poi richiedi contatto medico (email Prohmed o redirect appuntamenti)
      const res = await apiRequest("/api/triage/request-medical-contact", "POST", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      // Clear dismissed alert ID when contacting doctor
      setDismissedAlertId(null);
      localStorage.removeItem('dismissedAlertId');
      
      queryClient.invalidateQueries({ queryKey: ["/api/triage/pending-alert"] });
      
      // Check if we need to redirect to appointments
      if (data.redirectTo) {
        toast({
          title: "📅 Prenota Visita",
          description: data.message || "Ti reindirizziamo alla pagina appuntamenti"
        });
        // Redirect after a short delay to show the toast
        setTimeout(() => {
          window.location.href = data.redirectTo;
        }, 1500);
      } else {
        // Email Prohmed sent
        toast({
          title: "✉️ Email inviata!",
          description: data.message || "Riceverai presto un'email da Prohmed con le istruzioni per prenotare una visita medica."
        });
      }
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

  const generatePreventionPathMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/prevention/generate-path", "POST", {});
      return response.json();
    },
    onSuccess: (data) => {
      setPreventionPathData(data);
      toast({
        title: "Percorso generato!",
        description: "Il tuo percorso di prevenzione personalizzato è pronto.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Errore durante la generazione del percorso",
        variant: "destructive"
      });
    },
  });

  // Generate Exams Recommendations Mutation
  const generateExamsRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/exams/recommend", "POST", { language: "it" });
      return response.json();
    },
    onSuccess: (data) => {
      setExamsRecommendations(data);
      toast({ 
        title: "Raccomandazioni generate!", 
        description: "Le raccomandazioni sugli esami sono pronte."
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore durante la generazione delle raccomandazioni",
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
            {isMobileView && (
              <Button
                variant="outline"
                onClick={handleLogout}
                data-testid="button-logout-mobile"
              >
                Esci
              </Button>
            )}
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
                  {/* Alert Follow-up personalizzato - solo per pazienti, non per medici */}
                  {!isDoctor && pendingAlert && !sessionId && dismissedAlertId !== pendingAlert.id && (
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
                      {/* Widget Stato Salute */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Prevention Index */}
                        {preventionIndex && (
                          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Prevention Index</span>
                              </div>
                              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {preventionIndex.currentScore?.toFixed(1) || 'N/A'}
                                <span className="text-sm font-normal">/10</span>
                              </div>
                            </div>
                          </Card>
                        )}

                        {/* Dati Wearable */}
                        {wearableData && (
                          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-900 dark:text-green-100">Dispositivo</span>
                              </div>
                              <div className="text-xs text-green-800 dark:text-green-200 space-y-1">
                                {wearableData.latestBloodPressure && (
                                  <div>BP: {wearableData.latestBloodPressure}</div>
                                )}
                                {wearableData.latestHeartRate && (
                                  <div>HR: {wearableData.latestHeartRate} bpm</div>
                                )}
                              </div>
                            </div>
                          </Card>
                        )}

                        {/* Referti */}
                        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Referti</span>
                            </div>
                            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                              {healthReports.length}
                            </div>
                          </div>
                        </Card>
                      </div>

                      <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                        <AlertDescription className="text-sm text-emerald-800 dark:text-emerald-200">
                          <p className="font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Come posso aiutarti oggi?
                          </p>
                          <p className="text-xs">
                            Chiedi informazioni sui tuoi referti, ricevi consigli di prevenzione personalizzati o approfondisci argomenti di salute.
                          </p>
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Quick Actions:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            className="text-left h-auto py-3 px-4 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                            onClick={() => setShowExamsDialog(true)}
                            data-testid="action-exams-recommendation"
                          >
                            <div className="flex items-start gap-2">
                              <Stethoscope className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                                🔬 Quali esami devo fare?
                              </span>
                            </div>
                          </Button>

                          <Button
                            variant="outline"
                            className="text-left h-auto py-3 px-4 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                            onClick={() => setShowAnalyzeReportDialog(true)}
                            data-testid="action-analyze-report"
                          >
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                                📄 Analizza il mio referto
                              </span>
                            </div>
                          </Button>

                          <Button
                            variant="outline"
                            className="text-left h-auto py-3 px-4 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                            onClick={() => setShowPreventionPathDialog(true)}
                            data-testid="action-prevention-path"
                          >
                            <div className="flex items-start gap-2">
                              <Shield className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                                🛡️ Percorso di prevenzione
                              </span>
                            </div>
                          </Button>

                          <Button
                            variant="outline"
                            className="text-left h-auto py-3 px-4 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                            onClick={() => setLocation('/teleconsulto')}
                            data-testid="action-book-visit"
                          >
                            <div className="flex items-start gap-2">
                              <Calendar className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                                🏥 Prenota una visita
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
                        {(() => {
                          const totalPages = Math.ceil(healthReports.length / REPORTS_PER_PAGE);
                          const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
                          const endIndex = startIndex + REPORTS_PER_PAGE;
                          const paginatedReports = healthReports.slice(startIndex, endIndex);

                          return (
                            <>
                              {paginatedReports.map((report) => (
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
                              
                              {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                                    data-testid="button-prev-page"
                                  >
                                    ← Precedente
                                  </Button>
                                  
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                      <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={currentPage === page 
                                          ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                          : "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                                        }
                                        data-testid={`button-page-${page}`}
                                      >
                                        {page}
                                      </Button>
                                    ))}
                                  </div>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                                    data-testid="button-next-page"
                                  >
                                    Successivo →
                                  </Button>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Prevention Path Dialog */}
      <PreventionPathDialog
        open={showPreventionPathDialog}
        onOpenChange={setShowPreventionPathDialog}
        preventionPathData={preventionPathData}
        onReset={() => setPreventionPathData(null)}
        onGenerate={() => generatePreventionPathMutation.mutate()}
        isGenerating={generatePreventionPathMutation.isPending}
      />

      {/* Exams Recommendation Dialog */}
      <Dialog 
        open={showExamsDialog} 
        onOpenChange={(open) => {
          setShowExamsDialog(open);
          if (open) {
            // Reset state first to ensure fresh generation
            setExamsRecommendations(null);
            generateExamsRecommendationsMutation.reset();
            // Then trigger new generation
            generateExamsRecommendationsMutation.mutate();
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Quali esami devo fare?
            </DialogTitle>
            <DialogDescription>
              Raccomandazioni personalizzate basate sul tuo profilo medico
            </DialogDescription>
          </DialogHeader>

          {/* Loading State */}
          {generateExamsRecommendationsMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-muted-foreground">Sto analizzando il tuo profilo medico...</p>
            </div>
          )}

          {/* Error State */}
          {generateExamsRecommendationsMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Errore durante la generazione delle raccomandazioni. 
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => generateExamsRecommendationsMutation.mutate()}
                  className="ml-2"
                >
                  Riprova
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {examsRecommendations && !generateExamsRecommendationsMutation.isPending && (
            <div className="space-y-6 py-4">
              {/* Summary */}
              <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-sm text-blue-900 dark:text-blue-200">
                  {examsRecommendations.summary}
                </AlertDescription>
              </Alert>

              {/* Recommendations by Category */}
              {examsRecommendations.recommendations?.map((category: any, catIdx: number) => (
                <div key={catIdx} className="space-y-3">
                  <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                    <div className="w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded" />
                    {category.category}
                  </h3>
                  <div className="space-y-2 pl-4">
                    {category.exams?.map((exam: any, examIdx: number) => {
                      const urgencyStyle = getUrgencyStyle(exam.urgency);
                      return (
                        <div 
                          key={examIdx} 
                          className={`p-4 rounded-lg border-l-4 ${urgencyStyle.bg} ${urgencyStyle.border}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground">{exam.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${urgencyStyle.badge}`}>
                                  {urgencyStyle.label}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{exam.reason}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{exam.frequency}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExamsDialog(false);
                    setUserInput(`Ho letto le raccomandazioni sugli esami. Vorrei approfondire: ${examsRecommendations.recommendations?.map((c: any) => c.category).join(', ')}`);
                    setTimeout(() => handleStart(), 100);
                  }}
                  className="flex-1"
                  data-testid="button-discuss-exams"
                >
                  <MessageSquarePlus className="w-4 h-4 mr-2" />
                  Discuti con l'AI
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowExamsDialog(false)}
                  className="flex-1"
                  data-testid="button-close-exams"
                >
                  Chiudi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Analyze Report Dialog */}
      <Dialog open={showAnalyzeReportDialog} onOpenChange={setShowAnalyzeReportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Analizza il mio referto
            </DialogTitle>
            <DialogDescription>
              Analisi AI del tuo ultimo referto medico caricato
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(() => {
              const latestReport = healthReports[0];
              const reportAge = latestReport 
                ? Math.floor((Date.now() - new Date(latestReport.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
                : null;
              const isOldReport = reportAge && reportAge >= 3;

              if (!latestReport) {
                return (
                  <>
                    <Alert className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <AlertDescription className="text-sm text-yellow-900 dark:text-yellow-200">
                        Non hai ancora caricato nessun referto medico. Puoi caricare un documento per un'analisi dettagliata, oppure chiedere consigli preventivi all'AI.
                      </AlertDescription>
                    </Alert>
                    <div className="flex justify-center gap-3">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-emerald-300 dark:border-emerald-700"
                        onClick={() => {
                          setShowAnalyzeReportDialog(false);
                          setUserInput('Non ho ancora caricato referti medici. Puoi darmi consigli generali sulla prevenzione e sugli esami che dovrei fare?');
                          setTimeout(() => handleStart(), 100);
                        }}
                        data-testid="button-ask-ai-without-report"
                      >
                        <MessageSquarePlus className="w-4 h-4 mr-2" />
                        Chiedi all'AI
                      </Button>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        onClick={() => {
                          setShowAnalyzeReportDialog(false);
                          setShowUploadDialog(true);
                        }}
                        data-testid="button-upload-first-report"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Carica Referto
                      </Button>
                    </div>
                  </>
                );
              }

              return (
                <>
                  {isOldReport && (
                    <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-sm text-amber-900 dark:text-amber-200">
                        Il tuo ultimo referto risale a {reportAge} {reportAge === 1 ? 'mese' : 'mesi'} fa. 
                        Considera di caricare referti più recenti per un'analisi più accurata.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Alert className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <AlertDescription className="text-sm text-emerald-900 dark:text-emerald-200">
                      <strong>Ultimo referto:</strong> {latestReport.reportType || 'Documento'} caricato il {new Date(latestReport.createdAt).toLocaleDateString('it-IT')}
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-center gap-3">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                      onClick={() => {
                        setShowAnalyzeReportDialog(false);
                        setUserInput('Analizza in dettaglio il mio ultimo referto caricato. Spiegami i risultati, evidenzia eventuali valori anomali e suggerisci azioni preventive.');
                        setTimeout(() => handleStart(), 100);
                      }}
                      data-testid="button-analyze-latest-report"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Analizza Referto
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
