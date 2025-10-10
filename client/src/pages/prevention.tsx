import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Send, FileText, AlertTriangle, Download, X, RotateCcw, Crown, Mic, MicOff, Activity, BarChart3, Smartphone } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import PreventionAssessment from "@/components/PreventionAssessment";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Richiedi registrazione per accedere alla prevenzione AI
  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

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
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-4 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            AI Prohmed - Impara la Prevenzione
          </h1>
          <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
            Condividi il tuo caso personale e scopri strategie pratiche per la prevenzione con l'intelligenza artificiale
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
                  <Button variant="outline" className="w-full justify-start border-blue-200 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Scarica per Android
                  </Button>
                </a>
                <a 
                  href="https://apps.apple.com/it/app/prohmed/id6449252498" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                  data-testid="link-ios-app"
                >
                  <Button variant="outline" className="w-full justify-start border-blue-200 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Scarica per iOS
                  </Button>
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
    </div>
  );
}
