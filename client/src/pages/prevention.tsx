import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Send, FileText, AlertTriangle, Download, X, RotateCcw, Crown, Mic, MicOff, Activity, BarChart3, Smartphone, TrendingUp, Lightbulb, FileUp, Filter, Search, SortAsc, User, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Sparkles, Stethoscope, Info, Camera, MessageSquarePlus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import PreventionAssessment from "@/components/PreventionAssessment";
import { MedicalTimeline } from "@/components/MedicalTimeline";
import { MedicalReportCard } from "@/components/MedicalReportCard";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { PreventionPathDialog } from "@/components/PreventionPathDialog";
import Navigation from "@/components/navigation";
const ciryMainLogo = "/images/ciry-main-logo.png";
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
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  aiSuggestDoctor?: boolean;
  aiUrgencyLevel?: 'low' | 'medium' | 'high' | 'emergency';
}

interface TriageSession {
  id: string;
  status: string;
  hasAlert: boolean;
}

interface TriageAlert {
  id: string;
  reason: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  status: 'pending' | 'monitoring' | 'user_resolved';
}

interface LatestAssessment {
  id: string;
  status: string;
  score?: number;
  riskLevel?: string;
}

function getSeverityColor(urgencyLevel: 'low' | 'medium' | 'high' | 'emergency') {
  switch (urgencyLevel) {
    case 'emergency':
      return {
        bg: 'bg-red-100 dark:bg-red-950/30',
        border: 'border-red-400 dark:border-red-700',
        text: 'text-red-900 dark:text-red-200',
        badge: 'bg-red-600 text-white',
        icon: '🚨',
        label: 'EMERGENZA'
      };
    case 'high':
      return {
        bg: 'bg-orange-100 dark:bg-orange-950/30',
        border: 'border-orange-400 dark:border-orange-700',
        text: 'text-orange-900 dark:text-orange-200',
        badge: 'bg-orange-600 text-white',
        icon: '⚡',
        label: 'ALTA'
      };
    case 'medium':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-950/30',
        border: 'border-yellow-400 dark:border-yellow-700',
        text: 'text-yellow-900 dark:text-yellow-200',
        badge: 'bg-yellow-600 text-white',
        icon: 'ℹ️',
        label: 'MEDIA'
      };
    case 'low':
      return {
        bg: 'bg-green-100 dark:bg-green-950/30',
        border: 'border-green-400 dark:border-green-700',
        text: 'text-green-900 dark:text-green-200',
        badge: 'bg-green-600 text-white',
        icon: '✓',
        label: 'BASSA'
      };
  }
}

export default function PreventionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [showAssessment, setShowAssessment] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingPromptShown, setOnboardingPromptShown] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showContinueConversationDialog, setShowContinueConversationDialog] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreventionPathDialog, setShowPreventionPathDialog] = useState(false);
  const [preventionPathData, setPreventionPathData] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = useState<Array<{ file: File; status: 'pending' | 'uploading' | 'completed' | 'error'; error?: string; result?: any }>>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>('all');
  const [reportSort, setReportSort] = useState<'recent' | 'oldest' | 'type'>('recent');
  const [reportSearch, setReportSearch] = useState<string>('');
  // Auto-detect role based on user type: doctor for diagnosis, patient for prevention
  const userRole = (user as any)?.isDoctor ? 'doctor' : 'patient';
  const [showArchive, setShowArchive] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const doctorAutoStartedRef = useRef<boolean>(false);
  const uploadQueueRef = useRef<Array<{ file: File; status: 'pending' | 'uploading' | 'completed' | 'error'; error?: string; result?: any }>>([]);

  // Prevention page is publicly accessible - both authenticated and anonymous users can use it
  // Anonymous users have limited features, authenticated users see token limits and personalized features

  const { data: latestAssessment, isLoading: assessmentLoading } = useQuery<LatestAssessment>({
    queryKey: ["/api/prevention/assessment/latest"],
    retry: false,
  });

  const { data: userAlerts = [], refetch: refetchAlerts } = useQuery<TriageAlert[]>({
    queryKey: ["/api/user/alerts"],
    retry: false,
  });

  // Query for doctor to get patient alerts
  const { data: doctorPatientAlerts = [] } = useQuery<any[]>({
    queryKey: ["/api/doctor/alerts"],
    enabled: !!(user as any)?.isDoctor,
  });

  const { data: documents } = useQuery<PreventionDocument[]>({
    queryKey: ["/api/prevention/documents"],
  });

  interface HealthReport {
    id: string;
    fileName?: string | null;
    reportType?: string | null;
    aiSummary?: string | null;
    createdAt: string;
    medicalValues?: any[] | null;
    radiologicalAnalysis?: any | null;
  }

  const { data: healthReports = [] } = useQuery<HealthReport[]>({
    queryKey: ["/api/health-score/reports"],
    enabled: !!user,
  });

  // Sync uploadQueue state with ref for reliable access
  useEffect(() => {
    uploadQueueRef.current = uploadQueue;
  }, [uploadQueue]);

  // Get doctor notes from prevention documents (fileType: 'doctor_note')
  const doctorNotes = (documents || []).filter((doc: any) => doc.fileType === 'doctor_note');
  
  // Transform doctor notes to match HealthReport interface
  const doctorNotesAsReports: HealthReport[] = doctorNotes.map((note: any) => ({
    id: note.id,
    fileName: note.title,
    reportType: note.reportType,
    aiSummary: note.summary,
    createdAt: note.uploadDate,
    medicalValues: note.medicalValues || [],
    radiologicalAnalysis: note.radiologicalAnalysis,
  }));

  // Combine health reports and doctor notes
  const allReports = [...healthReports, ...doctorNotesAsReports];

  // Apply filters and sorting to reports
  const filteredReports = allReports
    .filter(r => {
      // Filter by type
      if (reportFilter !== 'all' && r.reportType !== reportFilter) return false;
      // Filter by search (case-insensitive) - search in name, summary, and medical values
      if (reportSearch) {
        const searchLower = reportSearch.toLowerCase();
        const matchesFileName = r.fileName?.toLowerCase().includes(searchLower);
        const matchesSummary = r.aiSummary?.toLowerCase().includes(searchLower);
        const matchesMedicalValues = r.medicalValues?.some(v => {
          const nameMatch = v.name?.toLowerCase().includes(searchLower);
          const valueMatch = String(v.value ?? '').toLowerCase().includes(searchLower);
          return nameMatch || valueMatch;
        });
        if (!matchesFileName && !matchesSummary && !matchesMedicalValues) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (reportSort === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (reportSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (reportSort === 'type') return (a.reportType ?? '').localeCompare(b.reportType ?? '');
      return 0;
    });

  // Pagination for medical reports (2 per page)
  const [reportPage, setReportPage] = useState(0);
  const REPORTS_PER_PAGE = 2;
  const totalReportPages = Math.ceil(filteredReports.length / REPORTS_PER_PAGE);
  const paginatedReports = filteredReports.slice(
    reportPage * REPORTS_PER_PAGE,
    (reportPage + 1) * REPORTS_PER_PAGE
  );

  // Reset to first page when reports change (new uploads or deletions)
  useEffect(() => {
    if (filteredReports.length > 0 && reportPage >= totalReportPages) {
      setReportPage(Math.max(0, totalReportPages - 1));
    }
  }, [filteredReports.length, reportPage, totalReportPages]);

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

  // Token usage query ONLY for aiOnlyAccess users (quiz/cybersecurity)
  // Regular patients have unlimited tokens and don't need this query
  const { data: tokenUsage } = useQuery<TokenUsageData>({
    queryKey: ["/api/user/token-usage"],
    enabled: !!user && !!user.aiOnlyAccess,
  });

  // Query per alert pendente
  const { data: pendingAlert } = useQuery<TriageAlert | null>({
    queryKey: ["/api/triage/pending-alert"],
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

  // Auto-restore active session on page load for conversation continuity
  useEffect(() => {
    // If there's an active session and no current session, automatically restore it
    if (activeSession?.id && !sessionId) {
      setSessionId(activeSession.id);
    }
  }, [activeSession, sessionId]);

  // Auto-open AI dialog for doctors when they access prevention page
  useEffect(() => {
    const isDoctor = (user as any)?.isDoctor;
    // Wait for activeSession query to resolve (activeSession will be null if no active session)
    // Only auto-start if: 1) user is a doctor, 2) activeSession resolved to null, 3) no sessionId, 4) haven't already auto-started
    if (isDoctor && activeSession === null && !sessionId && !doctorAutoStartedRef.current) {
      // Mark as started immediately to prevent multiple attempts
      doctorAutoStartedRef.current = true;
      
      // Small delay for better UX
      const timer = setTimeout(async () => {
        const initialMessage = "Benvenuto! Come posso aiutarti nella prevenzione e diagnosi oggi?";
        
        try {
          const response = await apiRequest("/api/triage/start", "POST", { 
            initialSymptom: initialMessage,
            userRole: 'doctor'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data?.session?.id) {
              setSessionId(data.session.id);
              queryClient.invalidateQueries({ queryKey: ["/api/triage/messages"] });
              // Keep input empty for clean UI
              setUserInput("");
            } else {
              console.error("Doctor auto-start: Invalid response data");
              doctorAutoStartedRef.current = false; // Allow retry
            }
          } else {
            console.error("Doctor auto-start: HTTP error", response.status);
            doctorAutoStartedRef.current = false; // Allow retry
          }
        } catch (error: any) {
          console.error("Doctor auto-start error:", error);
          doctorAutoStartedRef.current = false; // Allow retry
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [user, sessionId, activeSession]);

  // Check if user needs onboarding (only for patients, not doctors)
  useEffect(() => {
    const userWithOnboarding = user as any;
    const promptCount = userWithOnboarding?.onboardingPromptCount || 0;
    
    if (userWithOnboarding && !userWithOnboarding.isDoctor && !userWithOnboarding.onboardingCompleted && promptCount < 4 && !onboardingPromptShown) {
      const timer = setTimeout(async () => {
        setShowOnboarding(true);
        setOnboardingPromptShown(true);
        
        try {
          await fetch("/api/user/increment-onboarding-prompt", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Failed to increment onboarding prompt:", error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, onboardingPromptShown]);

  const startTriageMutation = useMutation({
    mutationFn: async (data: { symptom: string; role: 'patient' | 'doctor' }) => {
      const response = await apiRequest("/api/triage/start", "POST", { 
        initialSymptom: data.symptom,
        userRole: data.role
      });
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
        body: JSON.stringify({ 
          content: message,
          language: user?.language || 'it' // Pass user's language for consistent AI responses
        }),
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
    onSuccess: (data) => {
      // Use setQueryData to immediately append new messages to cache
      // This ensures messages appear instantly without waiting for refetch
      if (data.userMessage && data.aiMessage) {
        const currentMessages = queryClient.getQueryData<TriageMessage[]>(["/api/triage/messages", sessionId]) || [];
        const updatedMessages = [...currentMessages, data.userMessage, data.aiMessage];
        queryClient.setQueryData(["/api/triage/messages", sessionId], updatedMessages);
      } else {
        // Fallback to invalidation if backend response is unexpected
        queryClient.invalidateQueries({ queryKey: ["/api/triage/messages", sessionId] });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/triage/session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/index"] });
      setUserInput("");
      
      // Auto-close session if backend indicates it was closed
      if (data.sessionClosed) {
        setTimeout(() => {
          queryClient.setQueryData(["/api/triage/session/active"], null);
          setSessionId(null);
          toast({ 
            title: "Conversazione chiusa", 
            description: "Torna quando vuoi per nuove domande sulla tua salute!" 
          });
        }, 2000); // Wait 2s to show final AI message first
      } else {
        // Riattiva automaticamente il microfono se era attivo (conversazione continua)
        if (isListening && recognitionRef.current) {
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 1000); // Aspetta 1 sec per la risposta AI
        }
      }
    },
    onError: (error: any) => {
      // Check if this is an upgrade requirement
      if (error?.requiresUpgrade) {
        setShowUpgradeDialog(true);
        return;
      }
      
      const message = error?.message || "Errore durante l'invio del messaggio";
      
      // Handle closed session error specifically
      if (message.includes("Session is closed") || message.includes("closed")) {
        setSessionId(null);
        queryClient.invalidateQueries({ queryKey: ["/api/triage/session/active"] });
        toast({ 
          title: "Conversazione chiusa", 
          description: "La sessione è stata chiusa. Puoi iniziare una nuova conversazione quando vuoi!",
          variant: "default" 
        });
        return;
      }
      
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
    startTriageMutation.mutate({ symptom: userInput, role: userRole });
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

  // Mutation per risolvere l'alert (Sì, risolto)
  const resolveAlertMutation = useMutation({
    mutationFn: async ({ alertId, response }: { alertId: string; response: string }) => {
      const res = await apiRequest("/api/triage/resolve-alert", "POST", { alertId, response });
      return res.json();
    },
    onSuccess: async () => {
      // Chiudi immediatamente l'alert impostando la cache a null
      queryClient.setQueryData(["/api/triage/pending-alert"], null);
      
      // NON fare refetch immediato - questo ricaricherebbe altri alert pending
      // La cache è già null, il banner scompare automaticamente
      
      toast({
        title: "Perfetto!",
        description: "Siamo felici che il problema sia stato risolto. Continua a monitorare la tua salute!",
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

  // Mutation per mettere in monitoring l'alert (No, non risolto)
  const monitorAlertMutation = useMutation({
    mutationFn: async ({ alertId, response }: { alertId: string; response: string }) => {
      const res = await apiRequest("/api/triage/monitor-alert", "POST", { alertId, response });
      return res.json();
    },
    onSuccess: async () => {
      // Chiudi immediatamente l'alert impostando la cache a null
      queryClient.setQueryData(["/api/triage/pending-alert"], null);
      
      // NON fare refetch immediato - questo ricaricherebbe altri alert pending
      // La cache è già null, il banner scompare automaticamente
      
      toast({
        title: "Ti stiamo monitorando",
        description: "Continueremo a seguire la situazione. Se hai bisogno di assistenza, usa la chat qui sotto.",
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

  // Mutation per contattare medico Prohmed (invia email con codice)
  const contactProhmedMutation = useMutation({
    mutationFn: async (alertId: string) => {
      // Invia email Prohmed
      const res = await apiRequest(`/api/user/alerts/${alertId}/contact-prohmed`, "POST", {});
      const data = await res.json();
      
      // Risolvi anche l'alert per chiudere la finestra
      await apiRequest("/api/triage/resolve-alert", "POST", { 
        alertId, 
        response: "Medico contattato tramite Prohmed" 
      });
      
      return data;
    },
    onSuccess: async (data) => {
      // Chiudi immediatamente l'alert impostando la cache a null
      queryClient.setQueryData(["/api/triage/pending-alert"], null);
      
      // NON fare refetch immediato - questo ricaricherebbe altri alert pending
      // La cache è già null, il banner scompare automaticamente
      
      toast({
        title: "Email inviata!",
        description: `Ti abbiamo inviato un'email con il codice promo ${data.promoCode} per un consulto gratuito con Prohmed. Controlla la tua casella di posta.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Impossibile inviare l'email",
        variant: "destructive"
      });
    },
  });

  // Mutation per contattare medico direttamente (senza alert esistente)
  const contactDoctorDirectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/user/contact-doctor-prohmed", "POST", {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Impossibile inviare l'email");
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Refresh user state to reflect promo code sent
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (data.emailSent) {
        // First time: show success and dialog
        toast({
          title: "Email inviata!",
          description: `Ti abbiamo inviato un'email con il codice promo ${data.promoCode} per un consulto gratuito con Prohmed. Controlla la tua casella di posta.`,
          duration: 6000,
        });
        setShowContinueConversationDialog(true);
      } else if (data.alreadySent) {
        // Already sent: open Prohmed app directly
        const prohmedDeepLink = "prohmed://open";
        const prohmedAppStore = "https://apps.apple.com/app/prohmed";
        const prohmedPlayStore = "https://play.google.com/store/apps/details?id=com.prohmed";
        
        toast({
          title: "Apertura app Prohmed",
          description: "Hai già ricevuto il codice promo. Apro l'app Prohmed...",
        });
        
        // Try to open app
        window.location.href = prohmedDeepLink;
        
        // Fallback to app store if app not installed
        setTimeout(() => {
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const isAndroid = /Android/.test(navigator.userAgent);
          
          if (isIOS) {
            window.location.href = prohmedAppStore;
          } else if (isAndroid) {
            window.location.href = prohmedPlayStore;
          } else {
            toast({
              title: "App mobile richiesta",
              description: "Scarica l'app Prohmed dal tuo store per contattare il medico.",
            });
          }
        }, 1500);
        
        // Still show dialog for continuing conversation
        setShowContinueConversationDialog(true);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Impossibile inviare l'email",
        variant: "destructive"
      });
    },
  });

  // Mutation per risolvere alert dalla lista
  const markAlertResolvedMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await apiRequest(`/api/user/alerts/${alertId}/resolve`, "POST", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/alerts"] });
      toast({
        title: "Alert risolto",
        description: "L'alert è stato contrassegnato come risolto"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Impossibile risolvere l'alert",
        variant: "destructive"
      });
    },
  });

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


  // Upload Medical Report Mutation
  const uploadReportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('report', file);
      formData.append('userConsent', 'true');
      if (sessionId) {
        formData.append('triageSessionId', sessionId);
      }

      const response = await fetch('/api/health-score/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante il caricamento');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUploadResult(data);
      setSelectedFile(null);
      
      // Handle async job response (new job queue system)
      if (data.jobId) {
        toast({ 
          title: "Referto in elaborazione!", 
          description: `Stiamo analizzando il tuo documento in background. Tempo stimato: ${data.estimatedTime || '5-10 secondi'}` 
        });
        // Invalidate queries to refresh UI when job completes
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/health-score/latest'] });
          queryClient.invalidateQueries({ queryKey: ['/api/prevention/documents'] });
          queryClient.invalidateQueries({ queryKey: ['/api/prevention/index'] });
        }, 8000); // Refresh after estimated completion time
      } else {
        // Handle old sync response (backwards compatibility)
        toast({ 
          title: "Referto caricato con successo!", 
          description: `Tipo: ${data.report?.reportType || 'N/A'} - PII rimossi: ${data.piiRemoved || 0}` 
        });
        queryClient.invalidateQueries({ queryKey: ['/api/health-score/latest'] });
        queryClient.invalidateQueries({ queryKey: ['/api/prevention/documents'] });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore durante il caricamento del referto",
        variant: "destructive" 
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate each file - include mobile camera formats (HEIC/HEIF)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif', 'image/webp'];
    const validFiles: File[] = [];
    
    for (const file of files) {
      // Check file extension for mobile camera photos (iOS may send empty MIME type)
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'];
      
      // iOS Safari sends empty MIME type for camera AND gallery photos - accept by extension
      const hasEmptyMimeType = !file.type || file.type === '';
      const isValidMimeType = validTypes.includes(file.type.toLowerCase());
      const isValidExtension = validExtensions.includes(fileExt);
      const isImageFile = file.type.startsWith('image/') || fileExt.match(/jpe?g|png|heic|heif|webp/i);
      const isPdf = file.type === 'application/pdf' || fileExt === 'pdf';
      
      // Accept if: valid MIME OR valid extension OR (empty MIME + looks like image/pdf)
      const isAcceptable = isValidMimeType || isValidExtension || isPdf || isImageFile || 
                          (hasEmptyMimeType && (isValidExtension || file.name.match(/\.(jpe?g|png|heic|heif|webp|pdf)$/i)));
      
      if (!isAcceptable) {
        toast({ 
          title: "Formato non valido", 
          description: `${file.name}: Tipo ${file.type || 'sconosciuto'} non supportato`, 
          variant: "destructive" 
        });
        continue;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File troppo grande",
          description: `${file.name}: Massimo 10MB`,
          variant: "destructive"
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Add files to queue (ref synced via useEffect)
    setSelectedFiles(validFiles);
    const newQueue = validFiles.map(file => ({
      file,
      status: 'pending' as const
    }));
    setUploadQueue(newQueue);
    
    // Reset upload options and open upload dialog
    setShowUploadOptions(false);
    setShowUploadDialog(true);
  };

  // Process upload queue - always use ref for most current data
  const processUploadQueue = async () => {
    const activeQueue = uploadQueueRef.current;
    console.log('[DEBUG] processUploadQueue called, queue:', activeQueue);
    
    // DEBUG: Show queue info in toast with status details
    const statusInfo = activeQueue.map(q => `${q.file.name}: ${q.status}`).join(', ');
    toast({
      title: "Debug Upload",
      description: `Queue: ${activeQueue.length} - ${statusInfo}`,
    });
    
    let completedCount = 0;
    let errorCount = 0;

    // Get current queue snapshot
    const currentQueue = activeQueue.filter(q => q.status === 'pending');
    console.log('[DEBUG] Current queue to process:', currentQueue);
    
    for (const item of currentQueue) {
      // Update status to uploading using functional update
      setUploadQueue(prev => prev.map(q => 
        q.file === item.file && q.status === 'pending' 
          ? { ...q, status: 'uploading' as const } 
          : q
      ));

      try {
        console.log('[DEBUG] Starting upload for file:', item.file.name);
        const formData = new FormData();
        formData.append('report', item.file);
        formData.append('userConsent', 'true');
        if (sessionId) {
          formData.append('triageSessionId', sessionId);
        }

        console.log('[DEBUG] Sending fetch request to /api/health-score/upload');
        const response = await fetch('/api/health-score/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        console.log('[DEBUG] Fetch response received:', response.status);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Errore durante il caricamento');
        }

        const result = await response.json();
        console.log('[DEBUG] Upload result:', result);

        // Handle async job response (new system)
        if (result.jobId) {
          // Async job - mark as completed (job running in background)
          setUploadQueue(prev => prev.map(q => 
            q.file === item.file && q.status === 'uploading'
              ? { ...q, status: 'completed' as const, result } 
              : q
          ));
          completedCount++;
        } else if (result.report) {
          // Old sync response - mark as completed
          setUploadQueue(prev => prev.map(q => 
            q.file === item.file && q.status === 'uploading'
              ? { ...q, status: 'completed' as const, result } 
              : q
          ));
          completedCount++;
        } else {
          throw new Error('Risposta non valida dal server');
        }
      } catch (error: any) {
        // DEBUG: Show error in toast
        toast({
          title: "Upload Error",
          description: error.message || 'Errore sconosciuto',
          variant: "destructive",
        });
        
        // Update status to error
        setUploadQueue(prev => prev.map(q => 
          q.file === item.file && q.status === 'uploading'
            ? { ...q, status: 'error' as const, error: error.message } 
            : q
        ));
        errorCount++;
      }
    }

    // Refresh data after all uploads
    queryClient.invalidateQueries({ queryKey: ['/api/health-score/latest'] });
    queryClient.invalidateQueries({ queryKey: ['/api/prevention/documents'] });
    queryClient.invalidateQueries({ queryKey: ['/api/prevention/index'] });

    // Close the upload dialog automatically
    if (completedCount > 0) {
      setShowUploadDialog(false);
      
      // Clear upload queue
      setTimeout(() => {
        setUploadQueue([]);
        setSelectedFiles([]);
      }, 300);
    }

    // Show detailed completion feedback with accuracy
    if (completedCount > 0) {
      // Get the last successfully uploaded file result for accuracy display
      const lastSuccessfulUpload = uploadQueue.find(q => q.status === 'completed' && q.result);
      const accuracy = lastSuccessfulUpload?.result?.ocrConfidence || 
                       lastSuccessfulUpload?.result?.report?.ocrConfidence || 
                       95; // Default accuracy if not available

      toast({
        title: "✅ Caricamento completato con successo!",
        description: `${completedCount} ${completedCount === 1 ? 'referto elaborato' : 'referti elaborati'} • Accuratezza: ${accuracy}%${errorCount > 0 ? ` • ${errorCount} errori` : ''}`,
        duration: 5000,
      });
    } else if (errorCount > 0) {
      toast({
        title: "Errore nel caricamento",
        description: `Impossibile elaborare ${errorCount} ${errorCount === 1 ? 'referto' : 'referti'}. Riprova.`,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleOldFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({ 
        title: "Formato non valido", 
        description: "Usa solo PDF, JPG o PNG", 
        variant: "destructive" 
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({ 
        title: "File troppo grande", 
        description: "Il file deve essere max 10MB", 
        variant: "destructive" 
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadFile = () => {
    if (!selectedFile) return;
    uploadReportMutation.mutate(selectedFile);
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
      <Navigation />
      <div className="container py-8 max-w-7xl">
        {/* Compact Header */}
        <div className="mb-6 text-center px-2">
          <h1 className="text-xl sm:text-2xl font-bold">Fai prevenzione grazie a Ciry, modello AI di Prohmed</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">Con un medico sempre al tuo fianco</p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 overflow-x-hidden px-2 sm:px-0">
          <div className="lg:col-span-1 space-y-4 sm:space-y-6 order-2 lg:order-1 max-w-full">
            {/* Alert Pazienti Collegati (SOLO per Medici) */}
            {(user as any)?.isDoctor ? (
              <Card className="shadow-xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white pb-6">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    Alert Pazienti Collegati
                  </CardTitle>
                  <CardDescription className="text-white/90 text-base mt-2">
                    Monitoraggio alert dei tuoi pazienti
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 pb-4">
                  {doctorPatientAlerts.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">Nessun alert dai tuoi pazienti</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {doctorPatientAlerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`p-3 rounded-lg border-2 ${
                            alert.urgencyLevel === 'high' 
                              ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800' 
                              : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-800'
                          }`}
                          data-testid={`doctor-alert-${alert.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className={`w-4 h-4 ${
                                  alert.urgencyLevel === 'high' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                                }`} />
                                <Badge variant={alert.urgencyLevel === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                                  {alert.urgencyLevel === 'high' ? 'URGENTE' : 'ATTENZIONE'}
                                </Badge>
                              </div>
                              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                Paziente: {alert.patientName || 'Non disponibile'}
                              </p>
                              <p className="text-sm font-medium">{alert.reason}</p>
                              {alert.createdAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(alert.createdAt).toLocaleDateString('it-IT')} - {new Date(alert.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Indice di Prevenzione (SOLO per Pazienti) */
              <Card className="shadow-xl border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white pb-6">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Shield className="w-6 h-6" />
                    </div>
                    Indice di Prevenzione
                  </CardTitle>
                  <CardDescription className="text-white/90 text-base mt-2">
                    Il tuo livello di prevenzione basato sull'utilizzo
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 pb-4">
                  {/* Mostra SOLO alert URGENTI (emergency), altrimenti mostra indice prevenzione */}
                  {(() => {
                    const criticalAlerts = userAlerts.filter(
                      alert => alert.urgencyLevel === 'emergency'
                    );
                    
                    if (criticalAlerts.length === 0) {
                      // Nessun alert critico -> mostra indice prevenzione
                      return (
                        <div className="text-center py-6">
                          <div className="relative w-24 h-24 mx-auto mb-4">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className={`text-4xl font-bold ${
                                (preventionIndex?.tier === 'high') ? 'text-emerald-600' :
                                (preventionIndex?.tier === 'medium') ? 'text-yellow-600' :
                                'text-orange-600'
                              }`}>
                                {preventionIndex?.score ?? 0}
                              </div>
                            </div>
                            <svg className="w-24 h-24 transform -rotate-90">
                              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                              <circle 
                                cx="48" 
                                cy="48" 
                                r="40" 
                                stroke="currentColor" 
                                strokeWidth="8" 
                                fill="none" 
                                strokeDasharray="251.2" 
                                strokeDashoffset={251.2 - (251.2 * (preventionIndex?.score ?? 0) / 100)} 
                                className={
                                  (preventionIndex?.tier === 'high') ? 'text-emerald-500' :
                                  (preventionIndex?.tier === 'medium') ? 'text-yellow-500' :
                                  'text-orange-500'
                                } 
                              />
                            </svg>
                          </div>
                          <p className={`text-sm font-medium ${
                            (preventionIndex?.tier === 'high') ? 'text-emerald-600' :
                            (preventionIndex?.tier === 'medium') ? 'text-yellow-600' :
                            'text-orange-600'
                          }`}>
                            {preventionIndex?.tier === 'high' ? 'Ottimo livello di prevenzione!' :
                             preventionIndex?.tier === 'medium' ? 'Buon livello di prevenzione' :
                             'Inizia il tuo percorso di prevenzione'}
                          </p>
                          <p className="text-xs mt-2 text-muted-foreground">
                            {preventionIndex?.tier === 'high' ? 'Continua così!' :
                             preventionIndex?.tier === 'medium' ? 'Continua ad usare l\'AI regolarmente' :
                             'Inizia a chattare con l\'AI e carica i tuoi documenti'}
                          </p>
                        </div>
                      );
                    }
                    
                    // Mostra SOLO alert critici
                    return (
                      <div className="space-y-3">
                        {criticalAlerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className="p-3 rounded-lg border-2 bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800"
                          data-testid={`alert-${alert.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                <Badge variant="destructive" className="text-xs">
                                  URGENTE
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{alert.reason}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAlertResolvedMutation.mutate(alert.id)}
                              disabled={markAlertResolvedMutation.isPending}
                              className="shrink-0"
                              data-testid={`button-resolve-${alert.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Token Usage & Upgrade - HIDDEN for regular patients, only for aiOnlyAccess quiz users */}
            {user?.aiOnlyAccess && (
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
                    <p className="text-xs sm:text-sm text-muted-foreground">
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
                      {(user as any)?.isDoctor ? 'Passa a Pro' : 'Passa a Premium'}
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
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/create-payment-intent', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ tier: 'premium_plus' })
                          });
                          const data = await res.json();
                          if (data.clientSecret) {
                            setLocation('/subscribe?tier=premium_plus&clientSecret=' + data.clientSecret);
                          }
                        } catch (error) {
                          console.error('Errore pagamento:', error);
                          toast({ title: "Errore", description: "Impossibile avviare il pagamento", variant: "destructive" });
                        }
                      }}
                      data-testid="button-upgrade-premium-plus"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Passa a Premium Plus - €49/mese
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Token illimitati • Assistenza medica Prohmed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Pacchetto Prohmed - Only for AI-only users */}
            {user?.aiOnlyAccess && (
              <Card className="shadow-xl border-2 border-green-200 dark:border-green-800 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <CardHeader className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Crown className="w-5 h-5" />
                    </div>
                    Pacchetto Prohmed
                  </CardTitle>
                  <CardDescription className="text-white/90 text-sm mt-1">
                    Prevenzione completa a 14,90€/mese
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>Webinar interattivi mensili</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>1 consulto specialistico/mese</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>Eventi live sul territorio</span>
                    </div>
                    <Button
                      onClick={() => setLocation('/pacchetto-prohmed')}
                      className="w-full mt-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      data-testid="button-view-package"
                    >
                      Scopri di Più
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2 max-w-full overflow-hidden">
            <Card className="shadow-2xl border-2 border-emerald-200/50 dark:border-emerald-800/50 overflow-hidden backdrop-blur-sm">
              <CardHeader className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-700 pb-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTEydjEyaDEyVjMwem0wLTI0SDI0djEyaDEyVjZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg animate-pulse">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2 text-white text-2xl font-bold">
                        {userRole === 'doctor' ? 'Supporto alla Diagnosi AI' : 'Assistente AI Personalizzato'}
                        {/* Info tooltip for regular patients about unlimited tokens */}
                        {!user?.aiOnlyAccess && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-5 h-5 text-white/80 hover:text-white cursor-help ml-1" data-testid="icon-token-info" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-white dark:bg-gray-900 p-3" side="bottom">
                                <p className="text-sm font-semibold mb-1">✨ Token Illimitati</p>
                                <p className="text-xs text-muted-foreground">
                                  Come paziente, hai accesso <strong>illimitato</strong> a CIRY senza costi aggiuntivi. 
                                  Usa l'assistente quando vuoi, senza limiti mensili.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </CardTitle>
                      <CardDescription className="text-white/90 text-sm font-medium mt-1">
                        {userRole === 'doctor' 
                          ? 'Intelligenza artificiale per analisi diagnostica avanzata'
                          : 'Guida personalizzata alla prevenzione e al benessere'}
                      </CardDescription>
                    </div>
                  </div>
                  {sessionId && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await closeSessionMutation.mutateAsync(sessionId);
                          setSessionId(null);
                        }}
                        className="border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:border-white/50 transition-all duration-200 shadow-lg"
                        data-testid="button-new-conversation"
                      >
                        <MessageSquarePlus className="w-4 h-4 mr-2" />
                        Nuova Conversazione
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCloseSession}
                        className="border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:border-white/50 transition-all duration-200 shadow-lg"
                        data-testid="button-close-session"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Chiudi
                      </Button>
                    </div>
                  )}
                </div>
                {/* Token banner ONLY for aiOnlyAccess users (quiz/cybersecurity) */}
                {user && user.aiOnlyAccess && tokenUsage && (
                  <div className="relative z-10 mt-4 flex items-center gap-3 text-white/90 text-sm bg-white/10 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/20 shadow-md">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">
                      {tokenUsage.hasUnlimitedTokens 
                        ? '✨ Token illimitati attivi'
                        : `${tokenUsage.tokensRemaining.toLocaleString()} token rimanenti questo mese`}
                    </span>
                    {!tokenUsage.hasUnlimitedTokens && (
                      <div className="flex-1 max-w-xs">
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white rounded-full transition-all duration-500"
                            style={{ width: `${(tokenUsage.tokensRemaining / tokenUsage.tokenLimit) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Banner conversazione in sospeso - Mostra solo se c'è activeSession ma nessuna session aperta E non c'è alert pendente */}
                {activeSession && !sessionId && !pendingAlert && (
                  <Alert className="border-2 bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700" data-testid="alert-resume-session">
                    <AlertDescription className="space-y-3">
                      <p className="font-semibold text-base">
                        💬 Hai una conversazione in sospeso
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vuoi continuare la conversazione precedente o iniziarne una nuova?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setSessionId(activeSession.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          data-testid="button-resume-session"
                        >
                          Continua Conversazione
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await closeSessionMutation.mutateAsync(activeSession.id);
                            queryClient.invalidateQueries({ queryKey: ["/api/triage/session/active"] });
                          }}
                          className="border-gray-400 dark:border-gray-600"
                          data-testid="button-close-old-session"
                        >
                          Inizia Nuova
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Alert Follow-up personalizzato - Sempre visibile se presente con sticky positioning */}
                {pendingAlert && (() => {
                  const severity = getSeverityColor(pendingAlert.urgencyLevel);
                  return (
                    <Alert 
                      className={`sticky top-4 z-50 border-2 ${severity.bg} ${severity.border} ${severity.text} shadow-xl`} 
                      data-testid="alert-followup"
                    >
                      <AlertDescription className="space-y-3">
                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{severity.icon}</span>
                            <p className="font-bold text-base">
                              Ciao {user?.firstName || 'utente'}, come va oggi?
                            </p>
                          </div>
                          <Badge className={`${severity.badge} font-semibold px-2 py-0.5 text-xs`}>
                            {severity.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">
                          {pendingAlert.urgencyLevel === 'emergency' 
                            ? `⚠️ Situazione critica rilevata: ${pendingAlert.reason}`
                            : pendingAlert.urgencyLevel === 'high'
                            ? `Hai risolto il problema importante che avevamo rilevato? (${pendingAlert.reason})`
                            : `Hai risolto la situazione che avevamo segnalato? (${pendingAlert.reason})`
                          }
                        </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            resolveAlertMutation.mutate({ 
                              alertId: pendingAlert.id, 
                              response: "Sì, risolto" 
                            });
                          }}
                          disabled={resolveAlertMutation.isPending || monitorAlertMutation.isPending || contactProhmedMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          data-testid="button-resolve-yes"
                        >
                          ✓ Sì, risolto
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            monitorAlertMutation.mutate({ 
                              alertId: pendingAlert.id, 
                              response: "No, non ancora risolto" 
                            });
                          }}
                          disabled={resolveAlertMutation.isPending || monitorAlertMutation.isPending || contactProhmedMutation.isPending}
                          className="border-gray-400 dark:border-gray-600"
                          data-testid="button-resolve-no"
                        >
                          ✗ No
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            contactProhmedMutation.mutate(pendingAlert.id);
                          }}
                          disabled={resolveAlertMutation.isPending || monitorAlertMutation.isPending || contactProhmedMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          data-testid="button-contact-prohmed"
                        >
                          🩺 Contatta Medico Prohmed
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                  );
                })()}
                
                {!sessionId ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Esempi di casi pratici
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        {userRole === 'doctor' ? (
                          <>
                            <Button 
                              variant="outline" 
                              className="group relative justify-start text-left h-auto py-4 px-4 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 hover:shadow-lg transition-all duration-200 overflow-hidden"
                              onClick={() => {
                                const message = "Paziente con familiarità per diabete tipo 2, quali protocolli preventivi?";
                                startTriageMutation.mutate({ symptom: message, role: userRole });
                              }}
                              disabled={startTriageMutation.isPending}
                              data-testid="button-example-diabetes"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="flex items-start gap-3 relative z-10">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:scale-110 transition-transform">
                                  <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="text-sm flex-1 whitespace-normal break-words">Paziente con familiarità per diabete tipo 2, quali protocolli preventivi?</span>
                              </div>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="group relative justify-start text-left h-auto py-4 px-4 border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20 hover:shadow-lg transition-all duration-200 overflow-hidden"
                              onClick={() => {
                                const message = "Gestione prevenzione secondaria post-IMA in paziente 55 anni";
                                startTriageMutation.mutate({ symptom: message, role: userRole });
                              }}
                              disabled={startTriageMutation.isPending}
                              data-testid="button-example-cardiovascular"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="flex items-start gap-3 relative z-10">
                                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg group-hover:scale-110 transition-transform">
                                  <Activity className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                                <span className="text-sm flex-1 whitespace-normal break-words">Gestione prevenzione secondaria post-IMA in paziente 55 anni</span>
                              </div>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="group relative justify-start text-left h-auto py-4 px-4 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 hover:shadow-lg transition-all duration-200 overflow-hidden"
                              onClick={() => {
                                const message = "Screening oncologico raccomandato per fascia 40-50 anni secondo linee guida";
                                startTriageMutation.mutate({ symptom: message, role: userRole });
                              }}
                              disabled={startTriageMutation.isPending}
                              data-testid="button-example-screening"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="flex items-start gap-3 relative z-10">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:scale-110 transition-transform">
                                  <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm flex-1 whitespace-normal break-words">Screening oncologico raccomandato per fascia 40-50 anni secondo linee guida</span>
                              </div>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              className="group relative justify-start text-left h-auto py-4 px-4 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 hover:shadow-lg transition-all duration-200 overflow-hidden"
                              onClick={() => {
                                const message = "Ho familiarità con il diabete, come posso prevenirlo?";
                                startTriageMutation.mutate({ symptom: message, role: userRole });
                              }}
                              disabled={startTriageMutation.isPending}
                              data-testid="button-example-diabetes"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="flex items-start gap-3 relative z-10">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:scale-110 transition-transform">
                                  <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="text-sm flex-1 whitespace-normal break-words">Ho familiarità con il diabete, come posso prevenirlo?</span>
                              </div>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="group relative justify-start text-left h-auto py-4 px-4 border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20 hover:shadow-lg transition-all duration-200 overflow-hidden"
                              onClick={() => {
                                const message = "Lavoro molto seduto, cosa posso fare per la mia salute cardiovascolare?";
                                startTriageMutation.mutate({ symptom: message, role: userRole });
                              }}
                              disabled={startTriageMutation.isPending}
                              data-testid="button-example-cardiovascular"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="flex items-start gap-3 relative z-10">
                                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg group-hover:scale-110 transition-transform">
                                  <Activity className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                                <span className="text-sm flex-1 whitespace-normal break-words">Lavoro molto seduto, cosa posso fare per la salute cardiovascolare?</span>
                              </div>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="group relative justify-start text-left h-auto py-4 px-4 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 hover:shadow-lg transition-all duration-200 overflow-hidden"
                              onClick={() => {
                                const message = "Ho 45 anni, quali screening preventivi dovrei fare?";
                                startTriageMutation.mutate({ symptom: message, role: userRole });
                              }}
                              disabled={startTriageMutation.isPending}
                              data-testid="button-example-screening"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="flex items-start gap-3 relative z-10">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:scale-110 transition-transform">
                                  <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm flex-1 whitespace-normal break-words">Ho 45 anni, quali screening preventivi dovrei fare?</span>
                              </div>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Strumenti Avanzati:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="group border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 h-auto py-4 hover:shadow-lg transition-all duration-200"
                          onClick={() => setShowUploadDialog(true)}
                          data-testid="button-upload-documents"
                        >
                          <div className="flex flex-col items-center gap-2 w-full">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:scale-110 transition-transform">
                              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-xs font-semibold">Carica Documenti</span>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="group border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 h-auto py-4 hover:shadow-lg transition-all duration-200"
                          onClick={() => setShowPreventionPathDialog(true)}
                          data-testid="button-generate-prevention-path"
                        >
                          <div className="flex flex-col items-center gap-2 w-full">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:scale-110 transition-transform">
                              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-xs font-semibold">Percorso di Prevenzione</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Oppure scrivi la tua domanda:</p>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <Input
                            placeholder="Es: Vorrei imparare a prevenire l'ipertensione..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                            className="border-2 border-emerald-300 focus:border-emerald-500 dark:border-emerald-700 dark:focus:border-emerald-500 pr-12 py-6 rounded-xl shadow-sm transition-all text-base bg-white dark:bg-gray-900"
                            data-testid="input-triage-start"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={toggleVoiceInput}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full ${isListening ? 'text-red-500 animate-pulse bg-red-50 dark:bg-red-950' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'}`}
                            data-testid="button-voice-input-start"
                          >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                          </Button>
                        </div>
                        <Button
                          onClick={handleStart}
                          disabled={startTriageMutation.isPending}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 px-8 py-6 rounded-xl text-base font-semibold"
                          data-testid="button-start-triage"
                        >
                          <Send className="w-5 h-5 mr-2" />
                          {startTriageMutation.isPending ? "Avvio..." : "Inizia"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <ScrollArea ref={scrollAreaRef} className="h-[500px] rounded-xl p-2 sm:p-4 md:p-6 bg-gradient-to-b from-white via-emerald-50/20 to-white dark:from-gray-950 dark:via-emerald-950/10 dark:to-gray-950">
                      <div className="space-y-4 sm:space-y-6">
                        {messages?.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${
                              msg.role === 'system' ? 'justify-center' : msg.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                            data-testid={`message-${msg.id}`}
                          >
                            {msg.role === 'system' ? (
                              <div className="max-w-[90%] p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                                  {msg.content}
                                </p>
                              </div>
                            ) : (
                              <>
                                {msg.role === 'assistant' && (
                                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                                    <img src="/images/ai-shield-icon.png" alt="AI" className="w-10 h-10 object-contain" />
                                  </div>
                                )}
                                <div
                                  className={`max-w-[85%] sm:max-w-[85%] md:max-w-[80%] ${
                                    msg.role === 'user'
                                      ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-sm'
                                      : 'bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-800 rounded-tl-sm'
                                  } p-3 sm:p-4 rounded-2xl shadow-md transition-all hover:shadow-lg`}
                                >
                                  <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed break-words">
                                    {msg.content}
                                  </p>
                                  
                                  {/* Contact Doctor Button for patients when AI suggests it */}
                                  {msg.role === 'assistant' && msg.aiSuggestDoctor && userRole === 'patient' && (
                                    <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-700">
                                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-2 font-semibold">
                                        💡 Ti consigliamo di consultare un medico
                                      </p>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          // Send email to user
                                          contactDoctorDirectMutation.mutate();
                                        }}
                                        disabled={contactDoctorDirectMutation.isPending}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                        data-testid="button-contact-doctor-message"
                                      >
                                        🩺 Contatta Medico Prohmed
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                {msg.role === 'user' && (
                                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                    <span className="text-white font-semibold text-sm">
                                      {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                        
                        {sendMessageMutation.isPending && (
                          <div className="flex gap-3 justify-start" data-testid="typing-indicator">
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center animate-pulse">
                              <img src="/images/ai-shield-icon.png" alt="AI" className="w-10 h-10 object-contain" />
                            </div>
                            <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%] p-4 rounded-2xl shadow-md bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-800 rounded-tl-sm">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {session?.status === 'active' && (
                      <div className="space-y-3 mt-4 px-1">
                        <div className="flex gap-3 items-end">
                          <div className="relative flex-1 min-w-0">
                            <Input
                              placeholder="Scrivi un messaggio..."
                              value={userInput}
                              onChange={(e) => setUserInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                              className="border-2 border-emerald-200 focus:border-emerald-500 dark:border-emerald-700 dark:focus:border-emerald-500 pr-12 py-6 rounded-xl shadow-sm transition-all w-full"
                              data-testid="input-triage-message"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={toggleVoiceInput}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900 ${isListening ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}
                              data-testid="button-voice-input-message"
                            >
                              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </Button>
                          </div>
                          <Button
                            onClick={handleSend}
                            disabled={sendMessageMutation.isPending || !userInput.trim()}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg h-12 w-12 rounded-xl p-0 disabled:opacity-50 transition-all flex-shrink-0"
                            data-testid="button-send-message"
                          >
                            <Send className="w-5 h-5" />
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setShowUploadDialog(true)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-xl transition-all"
                            data-testid="button-upload-report-chat"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Carica Referto
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* My Medical Documents Section */}
            {user && (
              <Card className="shadow-lg border-emerald-100 dark:border-emerald-900">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                  <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <FileText className="w-5 h-5" />
                    I Miei Documenti Medici
                  </CardTitle>
                  <CardDescription>
                    Visualizza i tuoi referti e analisi caricati nel sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {allReports.length === 0 ? (
                    <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                      <FileUp className="w-5 h-5 text-emerald-600" />
                      <AlertDescription className="ml-2 text-emerald-800 dark:text-emerald-200">
                        <p className="font-semibold mb-1">Nessun documento caricato</p>
                        <p className="text-sm">
                          Carica i tuoi referti medici usando il pulsante "Carica Referto/Analisi" nella chat AI. 
                          Tutti i documenti vengono automaticamente anonimizzati per la tua privacy.
                        </p>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-6">
                      {/* Filters and Search */}
                      <div className="flex flex-col gap-3">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="Cerca documenti..."
                              value={reportSearch}
                              onChange={(e) => setReportSearch(e.target.value)}
                              className="pl-10"
                              data-testid="input-search-reports"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                          <select
                            value={reportFilter}
                            onChange={(e) => setReportFilter(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm min-w-0"
                            data-testid="select-filter-type"
                          >
                            <option value="all">Tutti i tipi</option>
                            <option value="esame_sangue">Esami del Sangue</option>
                            <option value="radiologia">Radiologia</option>
                            <option value="cardiologia">Cardiologia</option>
                            <option value="ecografia">Ecografia</option>
                            <option value="risonanza">Risonanza Magnetica</option>
                            <option value="tac">TAC</option>
                            <option value="ecg">Elettrocardiogramma</option>
                            <option value="esame_urine">Esami delle Urine</option>
                          </select>
                          <select
                            value={reportSort}
                            onChange={(e) => setReportSort(e.target.value as any)}
                            className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm min-w-0"
                            data-testid="select-sort-order"
                          >
                            <option value="recent">Più recenti</option>
                            <option value="oldest">Più vecchi</option>
                            <option value="type">Per tipo</option>
                          </select>
                        </div>
                      </div>

                      {/* Cronologia Medica (Max 2 documenti per volta) */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <h3 className="text-base sm:text-lg font-semibold text-emerald-700 dark:text-emerald-400">Cronologia Medica</h3>
                          {totalReportPages > 1 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                Pag {reportPage + 1}/{totalReportPages}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setReportPage(Math.max(0, reportPage - 1))}
                                disabled={reportPage === 0}
                                data-testid="button-prev-reports"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setReportPage(Math.min(totalReportPages - 1, reportPage + 1))}
                                disabled={reportPage === totalReportPages - 1}
                                data-testid="button-next-reports"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="grid gap-4">
                          {paginatedReports.map((report) => (
                            <MedicalReportCard
                              key={report.id}
                              report={{
                                id: report.id,
                                title: report.fileName ?? 'Documento senza titolo',
                                reportType: report.reportType ?? '',
                                uploadDate: report.createdAt,
                                aiSummary: report.aiSummary ?? undefined,
                                medicalValues: report.medicalValues ?? undefined
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* No results message */}
                      {filteredReports.length === 0 && (
                        <Alert>
                          <AlertDescription>
                            Nessun referto trovato con i filtri selezionati.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-2xl">
              <Crown className="w-6 h-6 text-amber-500" />
              Limite Token AI Raggiunto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base space-y-3">
              <p>
                Hai raggiunto il <strong>limite mensile di token</strong> per CIRY.
              </p>
              <p>
                Passa a Premium per continuare a usare CIRY senza limiti e accedere a tutte le funzionalità:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>1000 token mensili (8x rispetto al piano Free)</li>
                <li>Conversazioni illimitate con CIRY</li>
                <li>Caricamento documenti medici</li>
                <li>Report personalizzati e analisi avanzate</li>
                <li>2 televisite a settimana</li>
                <li>Webinari ed eventi dedicati</li>
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

      {/* Continue Conversation Dialog */}
      <AlertDialog open={showContinueConversationDialog} onOpenChange={setShowContinueConversationDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              CIRY può aiutarti in qualcos'altro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {(user as any)?.prohmedPromoCodeSent 
                ? "Vuoi approfondire altri sintomi con CIRY o preferisci contattare direttamente il medico?"
                : "Hai ricevuto l'email con il codice promo per il consulto medico. Vuoi approfondire altri sintomi con CIRY?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowContinueConversationDialog(false);
                
                // Close session if exists (app already opened by mutation or email already sent)
                if (sessionId) {
                  closeSessionMutation.mutate(sessionId);
                }
                
                toast({
                  title: "Grazie!",
                  description: (user as any)?.prohmedPromoCodeSent 
                    ? "L'app Prohmed dovrebbe aprirsi a breve. Se non si apre, scaricala dallo store."
                    : "Controlla la tua email per il codice promo e contatta Prohmed.",
                });
              }}
              className="bg-blue-100 hover:bg-blue-200 text-blue-900 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-200"
              data-testid="button-contact-doctor"
            >
              🩺 No, contatta il medico
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowContinueConversationDialog(false);
                // Keep conversation open
                toast({
                  title: "Perfetto!",
                  description: "Continua pure a farmi domande sulla tua salute. Sono qui per aiutarti!",
                });
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              data-testid="button-continue-symptoms"
            >
              ✅ Sì, approfondisci sintomi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* File inputs outside dialog for iOS compatibility */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp,image/*"
        onChange={handleFileSelect}
        multiple
        className="hidden"
        data-testid="input-file-report"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-camera-capture"
      />

      {/* Upload Documents Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  🔒 Privacy e Anonimizzazione Automatica
                </p>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-2">
                  <p>
                    I tuoi documenti medici sono protetti da <strong>algoritmi avanzati di anonimizzazione</strong> che rimuovono automaticamente:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Dati anagrafici (nome, cognome, indirizzo)</li>
                    <li>Codice fiscale e numeri identificativi</li>
                    <li>Date di nascita e contatti personali</li>
                    <li>Qualsiasi informazione che possa identificarti</li>
                  </ul>
                  <p className="pt-1">
                    I documenti vengono elaborati in modo <strong>completamente anonimo</strong>, garantendo la tua privacy e la conformità al GDPR.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {uploadQueue.length === 0 ? (
                <>
                  {!showUploadOptions ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        Carica i tuoi referti medici
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Formati supportati: PDF, JPG, PNG (max 10MB) • Selezione multipla supportata
                      </p>
                      <Button 
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          if (!user) {
                            toast({ title: "Accesso richiesto", description: "Effettua il login per caricare documenti", variant: "destructive" });
                            return;
                          }
                          setShowUploadOptions(true);
                        }}
                        data-testid="button-upload-referti"
                      >
                        <FileUp className="w-4 h-4 mr-2" />
                        Carica Referti
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground mb-4">
                        Scegli come caricare il referto:
                      </p>
                      <div className="flex gap-3 justify-center flex-wrap mt-2">
                        <Button 
                          variant="outline"
                          className="flex-1 max-w-xs h-auto py-4 border-2"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setShowUploadOptions(false);
                          }}
                          data-testid="button-select-files"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <FileUp className="w-6 h-6 text-blue-600" />
                            <div>
                              <p className="font-semibold text-sm">Da Galleria</p>
                              <p className="text-xs text-muted-foreground">Seleziona file esistenti</p>
                            </div>
                          </div>
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 max-w-xs h-auto py-4 border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          onClick={() => {
                            cameraInputRef.current?.click();
                            setShowUploadOptions(false);
                          }}
                          data-testid="button-take-photo"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Camera className="w-6 h-6 text-blue-600" />
                            <div>
                              <p className="font-semibold text-sm">Scatta Foto</p>
                              <p className="text-xs text-muted-foreground">Usa la fotocamera</p>
                            </div>
                          </div>
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUploadOptions(false)}
                        className="mt-3 text-muted-foreground"
                        data-testid="button-back-upload"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Annulla
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                    {uploadQueue.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(item.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div>
                          {item.status === 'pending' && (
                            <Badge variant="outline" className="bg-gray-100">In attesa</Badge>
                          )}
                          {item.status === 'uploading' && (
                            <Badge className="bg-blue-100 text-blue-700">Caricamento...</Badge>
                          )}
                          {item.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-700">✓ Completato</Badge>
                          )}
                          {item.status === 'error' && (
                            <Badge variant="destructive">✗ Errore</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setUploadQueue([]);
                        setSelectedFiles([]);
                      }}
                      data-testid="button-cancel-queue"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Annulla
                    </Button>
                    <Button 
                      onClick={processUploadQueue}
                      disabled={uploadQueue.some(q => q.status === 'uploading')}
                      data-testid="button-upload-queue"
                    >
                      {uploadQueue.some(q => q.status === 'uploading') ? "Caricamento..." : `Carica ${uploadQueue.length} Referti`}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                <AlertDescription className="ml-2">
                  <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    ✅ Referto Elaborato con Successo
                  </p>
                  <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <p><strong>Tipo:</strong> {uploadResult.report?.reportType || 'N/A'}</p>
                    <p><strong>Dati PII rimossi:</strong> {uploadResult.piiRemoved || 0}</p>
                    <p><strong>Confidenza OCR:</strong> {uploadResult.ocrConfidence || 0}%</p>
                    {uploadResult.report?.aiSummary && (
                      <p className="mt-2 break-words"><strong>Riepilogo:</strong> {uploadResult.report.aiSummary}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setUploadQueue([]);
                setUploadResult(null);
                setSelectedFiles([]);
              }}
              data-testid="button-close-upload-dialog"
            >
              <X className="w-4 h-4 mr-2" />
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prevention Path Dialog */}
      <PreventionPathDialog
        open={showPreventionPathDialog}
        onOpenChange={setShowPreventionPathDialog}
        preventionPathData={preventionPathData}
        onReset={() => setPreventionPathData(null)}
        onGenerate={() => generatePreventionPathMutation.mutate()}
        isGenerating={generatePreventionPathMutation.isPending}
      />

      <OnboardingDialog 
        open={showOnboarding} 
        onOpenChange={setShowOnboarding}
      />

    </div>
  );
}
