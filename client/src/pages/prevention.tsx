import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Send, FileText, AlertTriangle, Download, X, RotateCcw, Crown, Mic, MicOff, Activity, BarChart3, Smartphone, ArrowLeft, TrendingUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import PreventionAssessment from "@/components/PreventionAssessment";
import ciryFullLogo from "@assets/ChatGPT Image 10 ott 2025, 12_49_48_1760093428797.png";
import prohmedLogo from "@assets/image_1760071152562.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [showAssessment, setShowAssessment] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreventionPathDialog, setShowPreventionPathDialog] = useState(false);
  const [showAttentionPointsDialog, setShowAttentionPointsDialog] = useState(false);
  const [preventionPathData, setPreventionPathData] = useState<any>(null);
  const [attentionPointsData, setAttentionPointsData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Prevention page is publicly accessible - both authenticated and anonymous users can use it
  // Anonymous users have limited features, authenticated users see token limits and personalized features

  const { data: latestAssessment, isLoading: assessmentLoading } = useQuery<LatestAssessment>({
    queryKey: ["/api/prevention/assessment/latest"],
    retry: false,
  });

  const { data: documents } = useQuery<PreventionDocument[]>({
    queryKey: ["/api/prevention/documents"],
  });

  interface PreventionIndexData {
    score: number;
    tier: 'low' | 'medium' | 'high';
    breakdown: {
      frequencyScore: number;
      depthScore: number;
      documentScore: number;
      alertScore: number;
      insightScore: number;
    };
  }

  const { data: preventionIndex } = useQuery<PreventionIndexData>({
    queryKey: ["/api/prevention/index"],
    enabled: !!user,
  });

  interface TokenUsageData {
    tokensUsed: number;
    tokenLimit: number;
    messageCount: number;
    tier: string;
    hasUnlimitedTokens: boolean;
    tokensRemaining: number;
  }

  const { data: tokenUsage } = useQuery<TokenUsageData>({
    queryKey: ["/api/user/token-usage"],
    enabled: !!user,
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
    mutationFn: async (symptom: string) => {
      const response = await apiRequest("/api/triage/start", "POST", { initialSymptom: symptom });
      return response.json();
    },
    onSuccess: (data: any) => {
      // Validate response structure
      if (!data || !data.session || !data.session.id) {
        toast({ 
          title: "Errore", 
          description: "Risposta non valida dal server. Riprova.",
          variant: "destructive" 
        });
        return;
      }
      
      setSessionId(data.session.id);
      // Set data directly in cache instead of invalidating to avoid race conditions
      queryClient.setQueryData(["/api/triage/session", data.session.id], data.session);
      queryClient.setQueryData(["/api/triage/messages", data.session.id], data.messages);
      // Clear input field after starting conversation
      setUserInput("");
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
    mutationFn: async (message: string) => {
      // Use fetch directly to check status before throwing
      const response = await fetch(`/api/triage/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
        credentials: "include",
      });
      
      const data = await response.json();
      
      // Check if upgrade is required before throwing error
      if (response.status === 403 && data.requiresUpgrade) {
        throw { requiresUpgrade: true, ...data };
      }
      
      // Throw for other errors
      if (!response.ok) {
        throw new Error(data.message || "Errore durante l'invio del messaggio");
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/triage/messages", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/triage/session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/index"] });
      setUserInput("");
      
      // Riattiva automaticamente il microfono se era attivo (conversazione continua)
      if (isListening && recognitionRef.current) {
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 1000); // Aspetta 1 sec per la risposta AI
      }
    },
    onError: (error: any) => {
      // Check if this is an upgrade requirement
      if (error?.requiresUpgrade) {
        setShowUpgradeDialog(true);
        return;
      }
      
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
    if (!userInput.trim()) return;
    
    if (!sessionId) {
      toast({ 
        title: "Nessuna sessione attiva", 
        description: "Inizia una conversazione prima di inviare messaggi.",
        variant: "destructive" 
      });
      return;
    }
    
    sendMessageMutation.mutate(userInput);
  };

  const closeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest(`/api/triage/${sessionId}/close`, "POST", {});
      return response.json();
    },
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

  // Generate Prevention Path Mutation
  const generatePreventionPathMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/prevention/generate-path", "POST", {});
      return response.json();
    },
    onSuccess: (data) => {
      setPreventionPathData(data);
      toast({ title: "Percorso generato con successo!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore durante la generazione del percorso",
        variant: "destructive" 
      });
    },
  });

  // Generate Attention Points Mutation
  const generateAttentionPointsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/prevention/generate-attention-points", "POST", {});
      return response.json();
    },
    onSuccess: (data) => {
      setAttentionPointsData(data);
      toast({ title: "Analisi completata con successo!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore durante l'analisi",
        variant: "destructive" 
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'it-IT';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast({ 
            title: "Microfono non autorizzato", 
            description: "Consenti l'accesso al microfono per usare l'input vocale.",
            variant: "destructive" 
          });
        } else if (event.error === 'no-speech') {
          toast({ 
            title: "Nessun audio rilevato", 
            description: "Prova a parlare più vicino al microfono.",
            variant: "destructive" 
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({ 
        title: "Browser non supportato", 
        description: "L'input vocale non è supportato da questo browser. Usa Chrome o Safari.",
        variant: "destructive" 
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container py-8 max-w-7xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="gap-2"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla Home
          </Button>
        </div>

        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <img src={ciryFullLogo} alt="CIRY - Power by Prohmed" className="h-24 object-contain" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            AI Assistente Prevenzione
          </h1>
          <p className="text-muted-foreground text-lg max-w-4xl mx-auto leading-relaxed">
            Guidati da esperti riconosciuti a livello nazionale e internazionale, offriamo una piattaforma interattiva dedicata ad aziende e professionisti che vogliono eccellere nelle certificazioni di Cybersecurity, Compliance, AI Security, Leadership e guida alla prevenzione medica intelligente con il supporto di AI avanzata.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            {/* Indicatore Prevenzione */}
            <Card className="shadow-lg border-emerald-100 dark:border-emerald-900">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <Activity className="w-5 h-5" />
                  Indice di Prevenzione
                </CardTitle>
                <CardDescription>Il tuo engagement con la prevenzione</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Score e Tier */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-prevention-score">
                        {preventionIndex?.score || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">su 100</div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        preventionIndex?.tier === 'high' 
                          ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300' 
                          : preventionIndex?.tier === 'medium'
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-950 dark:text-gray-300'
                      }
                      data-testid="badge-prevention-tier"
                    >
                      {preventionIndex?.tier === 'high' ? 'Alto' : preventionIndex?.tier === 'medium' ? 'Medio' : 'Basso'}
                    </Badge>
                  </div>

                  {/* Metriche Breakdown */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Frequenza consultazioni</span>
                        <span className="font-medium">{preventionIndex?.breakdown.frequencyScore || 0}/30</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                          style={{ width: `${((preventionIndex?.breakdown.frequencyScore || 0) / 30) * 100}%` }}
                          data-testid="bar-frequency"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Profondità conversazioni</span>
                        <span className="font-medium">{preventionIndex?.breakdown.depthScore || 0}/20</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                          style={{ width: `${((preventionIndex?.breakdown.depthScore || 0) / 20) * 100}%` }}
                          data-testid="bar-depth"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Documenti caricati</span>
                        <span className="font-medium">{preventionIndex?.breakdown.documentScore || 0}/20</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                          style={{ width: `${((preventionIndex?.breakdown.documentScore || 0) / 20) * 100}%` }}
                          data-testid="bar-documents"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Alert gestiti</span>
                        <span className="font-medium">{preventionIndex?.breakdown.alertScore || 0}/15</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                          style={{ width: `${((preventionIndex?.breakdown.alertScore || 0) / 15) * 100}%` }}
                          data-testid="bar-alerts"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Insights salute</span>
                        <span className="font-medium">{preventionIndex?.breakdown.insightScore || 0}/15</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                          style={{ width: `${((preventionIndex?.breakdown.insightScore || 0) / 15) * 100}%` }}
                          data-testid="bar-insights"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Token Usage & Upgrade */}
            <Card className="shadow-lg border-orange-100 dark:border-orange-900">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <Crown className="w-5 h-5" />
                  {tokenUsage?.tier === 'free' ? 'Limiti Token Mensili' : 'Il Tuo Piano'}
                </CardTitle>
                <CardDescription>
                  {tokenUsage?.tier === 'free' 
                    ? 'Piano Free - 30 token al mese'
                    : tokenUsage?.tier === 'premium' 
                    ? 'Piano Premium - 1000 token/mese'
                    : 'Piano Premium Plus - Token Illimitati'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Token Usage Display */}
                {!tokenUsage?.hasUnlimitedTokens && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Token usati</span>
                      <span className="font-medium">{tokenUsage?.tokensUsed || 0}/{tokenUsage?.tokenLimit || 30}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          (tokenUsage?.tokensUsed || 0) / (tokenUsage?.tokenLimit || 30) > 0.8
                            ? 'bg-red-500'
                            : (tokenUsage?.tokensUsed || 0) / (tokenUsage?.tokenLimit || 30) > 0.5
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, ((tokenUsage?.tokensUsed || 0) / (tokenUsage?.tokenLimit || 30)) * 100)}%` }}
                        data-testid="bar-token-usage"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tokenUsage?.tokensRemaining || 0} token rimanenti questo mese
                    </p>
                  </div>
                )}

                {tokenUsage?.hasUnlimitedTokens && (
                  <div className="text-center py-4">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">∞</div>
                    <p className="text-sm text-muted-foreground mt-1">Token Illimitati</p>
                  </div>
                )}

                {/* Upgrade Buttons */}
                {tokenUsage?.tier === 'free' && (
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                      onClick={() => setLocation('/subscribe')}
                      data-testid="button-upgrade-premium"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Passa a Premium
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Strumento AI disponibile • 1000 token/mese
                    </p>
                    
                    <Button
                      variant="outline"
                      className="w-full border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950"
                      onClick={() => setLocation('/subscribe')}
                      data-testid="button-upgrade-premium-plus"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Premium Plus
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Token illimitati • Assistenza medica Prohmed
                    </p>
                  </div>
                )}

                {tokenUsage?.tier === 'premium' && (
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                      onClick={() => setLocation('/subscribe')}
                      data-testid="button-upgrade-premium-plus"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Passa a Premium Plus
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Token illimitati • Assistenza medica Prohmed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reportistica */}
            <Card className="shadow-lg border-emerald-100 dark:border-emerald-900">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <BarChart3 className="w-5 h-5" />
                  Reportistica
                </CardTitle>
                <CardDescription>I tuoi report personalizzati</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Button
                  variant="outline"
                  className="w-full justify-start border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950"
                  onClick={() => setLocation('/dashboard')}
                  data-testid="button-view-reports"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Vai al Profilo
                </Button>
              </CardContent>
            </Card>

            {/* App Prohmed */}
            <Card className="shadow-lg border-blue-100 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <img src={prohmedLogo} alt="Prohmed" className="w-12 h-12 object-contain" />
                  <div>
                    <CardTitle className="text-blue-900 dark:text-blue-100 text-lg">Prohmed App</CardTitle>
                    <CardDescription className="text-blue-700 dark:text-blue-300">Telemedicina sempre con te</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <a 
                  href="https://play.google.com/store/apps/details?id=com.prohmed.prohmedApp&pcampaignid=web_share" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                  data-testid="link-android-app"
                >
                  <img 
                    src="https://play.google.com/intl/en_us/badges/static/images/badges/it_badge_web_generic.png"
                    alt="Disponibile su Google Play"
                    className="h-14 w-auto hover:opacity-80 transition-opacity"
                  />
                </a>
                <a 
                  href="https://apps.apple.com/it/app/prohmed/id6449252498" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                  data-testid="link-ios-app"
                >
                  <img 
                    src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/it-it?size=250x83&releaseDate=1280620800"
                    alt="Scarica su App Store"
                    className="h-14 w-auto hover:opacity-80 transition-opacity"
                  />
                </a>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-lg border-emerald-100 dark:border-emerald-900">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                      <Shield className="w-5 h-5" />
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
                      className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                      data-testid="button-close-session"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Esci dalla Chat
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

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Strumenti di Prevenzione:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950 h-auto py-3"
                          onClick={() => setShowUploadDialog(true)}
                          data-testid="button-upload-documents"
                        >
                          <div className="flex flex-col items-center gap-1 w-full">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium">Carica Documenti</span>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950 h-auto py-3"
                          onClick={() => setShowPreventionPathDialog(true)}
                          data-testid="button-generate-prevention-path"
                        >
                          <div className="flex flex-col items-center gap-1 w-full">
                            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-medium">Percorso Prevenzione</span>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950 h-auto py-3"
                          onClick={() => setShowAttentionPointsDialog(true)}
                          data-testid="button-attention-points"
                        >
                          <div className="flex flex-col items-center gap-1 w-full">
                            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            <span className="text-xs font-medium">Punti di Attenzione</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="Es: Vorrei imparare a prevenire l'ipertensione..."
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                          className="border-emerald-200 focus:border-emerald-500 dark:border-emerald-800 pr-12"
                          data-testid="input-triage-start"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={toggleVoiceInput}
                          className={`absolute right-1 top-1/2 -translate-y-1/2 ${isListening ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}
                          data-testid="button-voice-input-start"
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Button
                        onClick={handleStart}
                        disabled={startTriageMutation.isPending}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                        data-testid="button-start-triage"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {startTriageMutation.isPending ? "Avvio..." : "Inizia"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-[450px] border border-emerald-100 dark:border-emerald-800 rounded-lg p-4 bg-gradient-to-b from-white to-emerald-50/30 dark:from-gray-950 dark:to-emerald-950/30">
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
                        <div className="relative flex-1">
                          <Input
                            placeholder="Scrivi un messaggio..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            className="border-emerald-200 focus:border-emerald-500 dark:border-emerald-800 pr-12"
                            data-testid="input-triage-message"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={toggleVoiceInput}
                            className={`absolute right-1 top-1/2 -translate-y-1/2 ${isListening ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}
                            data-testid="button-voice-input-message"
                          >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </Button>
                        </div>
                        <Button
                          onClick={handleSend}
                          disabled={sendMessageMutation.isPending}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
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

      {/* Upgrade Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-2xl">
              <Crown className="w-6 h-6 text-amber-500" />
              Limite Messaggi Gratuiti Raggiunto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base space-y-3">
              <p>
                Hai raggiunto il limite di <strong>30 messaggi gratuiti</strong> per questa conversazione.
              </p>
              <p>
                Abbonati per continuare a usare l'AI Prohmed senza limiti e accedere a tutte le funzionalità premium:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Conversazioni illimitate con l'AI</li>
                <li>Caricamento documenti medici</li>
                <li>Report personalizzati</li>
                <li>Accesso completo alla piattaforma</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-upgrade">
              Chiudi
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowUpgradeDialog(false);
                setLocation('/subscribe');
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              data-testid="button-upgrade-now"
            >
              <Crown className="w-4 h-4 mr-2" />
              Abbonati Ora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Documents Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Carica Documenti Medici
            </DialogTitle>
            <DialogDescription>
              Carica i tuoi referti medici per arricchire il tuo profilo di prevenzione
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Privacy Notice */}
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              <AlertDescription className="ml-2">
                <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  🔒 Privacy e Anonimizzazione
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  I tuoi documenti medici vengono <strong>automaticamente anonimizzati</strong> prima dell'elaborazione. 
                  Tutti i dati personali sensibili (nome, cognome, codice fiscale, ecc.) vengono rimossi per garantire la massima privacy e sicurezza.
                </p>
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-muted-foreground mb-2">
                Trascina qui i tuoi file o clicca per selezionarli
              </p>
              <p className="text-xs text-muted-foreground">
                Formati supportati: PDF, JPG, PNG (max 10MB)
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  if (!user) {
                    toast({ title: "Accesso richiesto", description: "Effettua il login per caricare documenti", variant: "destructive" });
                    return;
                  }
                  // TODO: implement file upload
                  toast({ title: "Funzionalità in arrivo", description: "Upload documenti sarà disponibile a breve" });
                }}
                data-testid="button-select-files"
              >
                Seleziona File
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prevention Path Dialog */}
      <Dialog open={showPreventionPathDialog} onOpenChange={setShowPreventionPathDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Percorso di Prevenzione Personalizzato
            </DialogTitle>
            <DialogDescription>
              Un piano di prevenzione su misura basato sul tuo profilo e le tue conversazioni
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!user ? (
              <Alert>
                <AlertDescription>
                  Effettua il login per generare il tuo percorso di prevenzione personalizzato
                </AlertDescription>
              </Alert>
            ) : !preventionPathData ? (
              <div className="text-center py-8">
                <Button
                  size="lg"
                  disabled={generatePreventionPathMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  onClick={() => generatePreventionPathMutation.mutate()}
                  data-testid="button-generate-path"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {generatePreventionPathMutation.isPending ? "Generazione in corso..." : "Genera Percorso"}
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  L'AI analizzerà il tuo profilo per creare un percorso di prevenzione personalizzato
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap">{preventionPathData.preventionPath}</div>
                </div>
                
                {/* Prohmed App Invitation */}
                <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                  <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="ml-2">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      📱 Richiedi un Consulto Gratuito con Prohmed
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                      Scarica l'app Prohmed e prenota un consulto gratuito con un medico specialista per discutere insieme il tuo percorso di prevenzione personalizzato.
                    </p>
                    <div className="flex gap-3 mt-3">
                      <a 
                        href="https://play.google.com/store/apps/details?id=com.prohmed.prohmedApp&pcampaignid=web_share" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <img 
                          src="https://play.google.com/intl/en_us/badges/static/images/badges/it_badge_web_generic.png"
                          alt="Disponibile su Google Play"
                          className="h-12 w-auto hover:opacity-80 transition-opacity"
                        />
                      </a>
                      <a 
                        href="https://apps.apple.com/it/app/prohmed/id6449252498" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <img 
                          src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/it-it?size=250x83&releaseDate=1280620800"
                          alt="Scarica su App Store"
                          className="h-12 w-auto hover:opacity-80 transition-opacity"
                        />
                      </a>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreventionPathData(null);
                      setShowPreventionPathDialog(false);
                    }}
                    data-testid="button-close-path"
                  >
                    Chiudi
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Attention Points Dialog */}
      <Dialog open={showAttentionPointsDialog} onOpenChange={setShowAttentionPointsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Analisi Punti di Attenzione
            </DialogTitle>
            <DialogDescription>
              Scopri le aree di miglioramento e i punti su cui focalizzare la tua attenzione
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!user ? (
              <Alert>
                <AlertDescription>
                  Effettua il login per analizzare i tuoi punti di attenzione
                </AlertDescription>
              </Alert>
            ) : !attentionPointsData ? (
              <div className="text-center py-8">
                <Button
                  size="lg"
                  disabled={generateAttentionPointsMutation.isPending}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  onClick={() => generateAttentionPointsMutation.mutate()}
                  data-testid="button-analyze-attention"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {generateAttentionPointsMutation.isPending ? "Analisi in corso..." : "Analizza Punti di Attenzione"}
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  L'AI identificherà le aree che richiedono maggiore attenzione nella tua prevenzione
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap">{attentionPointsData.attentionPoints}</div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAttentionPointsData(null);
                      setShowAttentionPointsDialog(false);
                    }}
                    data-testid="button-close-attention"
                  >
                    Chiudi
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
