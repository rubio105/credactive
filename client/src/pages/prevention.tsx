import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Send, FileText, AlertTriangle, Download, X, RotateCcw, Crown, Mic, MicOff, Activity, BarChart3, Smartphone, ArrowLeft, TrendingUp, Lightbulb, FileUp, Filter, Search, SortAsc, User, ChevronUp, ChevronDown, Sparkles, Stethoscope } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import PreventionAssessment from "@/components/PreventionAssessment";
import { MedicalTimeline } from "@/components/MedicalTimeline";
import { MedicalReportCard } from "@/components/MedicalReportCard";
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
  role: 'user' | 'assistant';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = useState<Array<{ file: File; status: 'pending' | 'uploading' | 'completed' | 'error'; error?: string; result?: any }>>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);
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

  // Prevention page is publicly accessible - both authenticated and anonymous users can use it
  // Anonymous users have limited features, authenticated users see token limits and personalized features

  const { data: latestAssessment, isLoading: assessmentLoading } = useQuery<LatestAssessment>({
    queryKey: ["/api/prevention/assessment/latest"],
    retry: false,
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

  // Always get the latest 3 reports (by date) for "Documenti Recenti", regardless of user sort
  const recentReports = [...filteredReports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  
  // Archived reports are the rest (also by date descending)
  const archivedReports = [...filteredReports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(3);

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

  useEffect(() => {
    if (activeSession?.id && !sessionId) {
      setSessionId(activeSession.id);
    }
  }, [activeSession, sessionId]);

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
    onSuccess: () => {
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

  // Mutation per mettere in monitoring l'alert (No, non risolto)
  const monitorAlertMutation = useMutation({
    mutationFn: async ({ alertId, response }: { alertId: string; response: string }) => {
      const res = await apiRequest("/api/triage/monitor-alert", "POST", { alertId, response });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/triage/pending-alert"] });
      toast({
        title: "Registrato",
        description: "Capisco, ti aiutiamo a gestire la situazione"
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

    // Validate each file
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const validFiles: File[] = [];
    
    for (const file of files) {
      // Validate file type
      if (!validTypes.includes(file.type)) {
        toast({ 
          title: "Formato non valido", 
          description: `${file.name}: Usa solo PDF, JPG o PNG`, 
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

    // Add files to queue
    setSelectedFiles(validFiles);
    setUploadQueue(validFiles.map(file => ({
      file,
      status: 'pending' as const
    })));
  };

  // Process upload queue
  const processUploadQueue = async () => {
    let completedCount = 0;
    let errorCount = 0;

    // Get current queue snapshot
    const currentQueue = uploadQueue.filter(q => q.status === 'pending');
    
    for (const item of currentQueue) {
      // Update status to uploading using functional update
      setUploadQueue(prev => prev.map(q => 
        q.file === item.file && q.status === 'pending' 
          ? { ...q, status: 'uploading' as const } 
          : q
      ));

      try {
        const formData = new FormData();
        formData.append('report', item.file);
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

        const result = await response.json();

        // Update status to completed
        setUploadQueue(prev => prev.map(q => 
          q.file === item.file && q.status === 'uploading'
            ? { ...q, status: 'completed' as const, result } 
            : q
        ));
        completedCount++;
      } catch (error: any) {
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
        {/* Back Button - Only for non-AI-only users */}
        {!user?.aiOnlyAccess && (
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
        )}

        {/* Compact Header */}
        <div className="mb-6 text-center px-2">
          <h1 className="text-xl sm:text-2xl font-bold">Fai prevenzione grazie a Ciry, modello AI di Prohmed</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">Con un medico sempre al tuo fianco</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 overflow-x-hidden">
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1 max-w-full">
            {/* Indicatore Prevenzione */}
            <Card className="shadow-xl border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white pb-8">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Activity className="w-6 h-6" />
                  </div>
                  Indice di Prevenzione
                </CardTitle>
                <CardDescription className="text-white/90 text-base mt-2">
                  Il tuo percorso verso la salute preventiva
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-8">
                <div className="space-y-6">
                  {/* Score e Tier - Design circolare */}
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 flex items-center justify-center border-4 border-emerald-200 dark:border-emerald-700 shadow-lg">
                        <div className="text-center">
                          <div className="text-5xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent" data-testid="text-prevention-score">
                            {preventionIndex?.score || 0}
                          </div>
                          <div className="text-xs font-semibold text-muted-foreground -mt-1">/ 100</div>
                        </div>
                      </div>
                      {/* Decorative ring */}
                      <div className="absolute inset-0 -z-10">
                        <div className={`w-36 h-36 rounded-full border-4 ${
                          preventionIndex?.tier === 'high' 
                            ? 'border-green-500 animate-pulse' 
                            : preventionIndex?.tier === 'medium'
                            ? 'border-yellow-500' 
                            : 'border-gray-400'
                        } -translate-x-2 -translate-y-2 opacity-30`}></div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`mt-4 px-6 py-1.5 text-base font-bold ${
                        preventionIndex?.tier === 'high' 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md' 
                          : preventionIndex?.tier === 'medium'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-md'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 shadow-md'
                      }`}
                      data-testid="badge-prevention-tier"
                    >
                      {preventionIndex?.tier === 'high' ? '🏆 Livello Alto' : preventionIndex?.tier === 'medium' ? '⭐ Livello Medio' : '🌱 Livello Base'}
                    </Badge>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Token Usage & Upgrade - Hidden for AI-only users */}
            {!user?.aiOnlyAccess && (
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

          <div className="lg:col-span-2 order-1 lg:order-2 max-w-full">
            <Card className="shadow-lg border-emerald-100 dark:border-emerald-900">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                      <Shield className="w-5 h-5" />
                      {userRole === 'doctor' ? 'Supporto alla Diagnosi' : 'Parla del Tuo Caso'}
                    </CardTitle>
                    <CardDescription>
                      {userRole === 'doctor' 
                        ? 'Assistenza AI per analisi diagnostica e decision-making clinico'
                        : 'Conversazione educativa personalizzata sulla prevenzione'}
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
                    {/* Alert Follow-up personalizzato */}
                    {pendingAlert && (
                      <Alert className={`border-2 ${
                        pendingAlert.urgencyLevel === 'high' || pendingAlert.urgencyLevel === 'emergency' 
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700' 
                          : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700'
                      }`} data-testid="alert-followup">
                        <AlertDescription className="space-y-3">
                          <p className="font-semibold text-base">
                            👋 Ciao {user?.firstName || 'utente'}, come va oggi?
                          </p>
                          <p className="text-sm">
                            {pendingAlert.urgencyLevel === 'high' || pendingAlert.urgencyLevel === 'emergency' 
                              ? `Hai risolto il problema che avevamo rilevato? (${pendingAlert.reason})`
                              : `Hai risolto la situazione che avevamo segnalato? (${pendingAlert.reason})`
                            }
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => resolveAlertMutation.mutate({ 
                                alertId: pendingAlert.id, 
                                response: "Sì, risolto" 
                              })}
                              disabled={resolveAlertMutation.isPending || monitorAlertMutation.isPending}
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
                                // Start a conversation about the unresolved issue
                                setTimeout(() => {
                                  const followupMessage = pendingAlert.urgencyLevel === 'high' || pendingAlert.urgencyLevel === 'emergency'
                                    ? `Il problema di ${pendingAlert.reason} non è ancora risolto. Hai consultato un medico?`
                                    : `La situazione di ${pendingAlert.reason} non è ancora risolta. Come posso aiutarti?`;
                                  setUserInput(followupMessage);
                                }, 500);
                              }}
                              disabled={resolveAlertMutation.isPending || monitorAlertMutation.isPending}
                              className="border-gray-400 dark:border-gray-600"
                              data-testid="button-resolve-no"
                            >
                              ✗ No
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Esempi di casi pratici:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {userRole === 'doctor' ? (
                          <>
                            <Button 
                              variant="outline" 
                              className="justify-start text-left h-auto py-2"
                              onClick={() => setUserInput("Paziente con familiarità per diabete tipo 2, quali protocolli preventivi?")}
                              data-testid="button-example-diabetes"
                            >
                              <span className="text-xs">Paziente con familiarità per diabete tipo 2, quali protocolli preventivi?</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-start text-left h-auto py-2"
                              onClick={() => setUserInput("Gestione prevenzione secondaria post-IMA in paziente 55 anni")}
                              data-testid="button-example-cardiovascular"
                            >
                              <span className="text-xs">Gestione prevenzione secondaria post-IMA in paziente 55 anni</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-start text-left h-auto py-2"
                              onClick={() => setUserInput("Screening oncologico raccomandato per fascia 40-50 anni secondo linee guida")}
                              data-testid="button-example-screening"
                            >
                              <span className="text-xs">Screening oncologico raccomandato per fascia 40-50 anni secondo linee guida</span>
                            </Button>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
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
                    <ScrollArea ref={scrollAreaRef} className="h-[500px] rounded-xl p-6 bg-gradient-to-b from-white via-emerald-50/20 to-white dark:from-gray-950 dark:via-emerald-950/10 dark:to-gray-950">
                      <div className="space-y-6">
                        {messages?.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            data-testid={`message-${msg.id}`}
                          >
                            {msg.role === 'assistant' && (
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <div
                              className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] p-4 rounded-2xl shadow-md transition-all hover:shadow-lg ${
                                msg.role === 'user'
                                  ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-sm'
                                  : 'bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-800 rounded-tl-sm'
                              }`}
                            >
                              <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed break-words">
                                {msg.content}
                              </p>
                            </div>
                            {msg.role === 'user' && (
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                <span className="text-white font-semibold text-sm">
                                  {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {sendMessageMutation.isPending && (
                          <div className="flex gap-3 justify-start" data-testid="typing-indicator">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                              <Sparkles className="w-5 h-5 text-white animate-pulse" />
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
                      <div className="space-y-3 mt-4">
                        <div className="flex gap-2 items-end">
                          <div className="relative flex-1">
                            <Input
                              placeholder="Scrivi un messaggio..."
                              value={userInput}
                              onChange={(e) => setUserInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                              className="border-2 border-emerald-200 focus:border-emerald-500 dark:border-emerald-700 dark:focus:border-emerald-500 pr-12 py-6 rounded-xl shadow-sm transition-all"
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
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg h-12 w-12 rounded-xl p-0 disabled:opacity-50 transition-all"
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
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="Cerca per nome, contenuto o valori medici..."
                              value={reportSearch}
                              onChange={(e) => setReportSearch(e.target.value)}
                              className="pl-10"
                              data-testid="input-search-reports"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={reportFilter}
                            onChange={(e) => setReportFilter(e.target.value)}
                            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm"
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
                            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm"
                            data-testid="select-sort-order"
                          >
                            <option value="recent">Più recenti</option>
                            <option value="oldest">Più vecchi</option>
                            <option value="type">Per tipo</option>
                          </select>
                        </div>
                      </div>

                      {/* Cronologia Medica (Tutti i Documenti) */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Cronologia Medica</h3>
                        <div className="grid gap-4">
                          {filteredReports.map((report) => (
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
                Hai raggiunto il <strong>limite mensile di token</strong> per l'AI di Prevenzione.
              </p>
              <p>
                Passa a Premium per continuare a usare l'AI Prohmed senza limiti e accedere a tutte le funzionalità:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>1000 token mensili (8x rispetto al piano Free)</li>
                <li>Conversazioni illimitate con l'AI</li>
                <li>Caricamento documenti medici</li>
                <li>Report personalizzati e analisi avanzate</li>
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
                  <p className="text-sm text-muted-foreground mb-2">
                    Clicca per selezionare i tuoi referti medici
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Formati supportati: PDF, JPG, PNG (max 10MB) • Selezione multipla supportata
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    data-testid="input-file-report"
                  />
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => {
                      if (!user) {
                        toast({ title: "Accesso richiesto", description: "Effettua il login per caricare documenti", variant: "destructive" });
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    data-testid="button-select-files"
                  >
                    <FileUp className="w-4 h-4 mr-2" />
                    Seleziona Referti
                  </Button>
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
                {/* Parse and display prevention path graphically */}
                {(() => {
                  const text = preventionPathData.preventionPath;
                  // Extract sections using regex - match all numbered sections
                  const sections = text.split(/\n(?=\d+\.\s\*\*)/).filter((s: string) => /^\d+\.\s\*\*/.test(s.trim()));
                  
                  return (
                    <div className="grid gap-4">
                      {sections.map((section: string, index: number) => {
                        const titleMatch = section.match(/\d+\.\s\*\*(.+?)\*\*/);
                        const title = titleMatch ? titleMatch[1] : `Sezione ${index + 1}`;
                        const content = section.replace(/\d+\.\s\*\*.+?\*\*/, '').trim();
                        
                        // Extract emoji and clean title
                        const emojiMatch = title.match(/([\u1F300-\u1F9FF])/);
                        const emoji = emojiMatch ? emojiMatch[1] : ['🎯', '📋', '🏥', '🍎', '📅'][index] || '📌';
                        const cleanTitle = title.replace(/([\u1F300-\u1F9FF])/g, '').trim();
                        
                        const colors = [
                          'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
                          'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
                          'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
                          'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
                          'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800',
                        ];
                        
                        return (
                          <Card key={index} className={`${colors[index]} border-2`}>
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <span className="text-2xl">{emoji}</span>
                                {cleanTitle}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="prose prose-sm max-w-none dark:prose-invert text-sm">
                                {content.split('\n').map((line: string, i: number) => {
                                  if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                                    return (
                                      <div key={i} className="flex items-start gap-2 my-1">
                                        <span className="text-primary mt-1">▪</span>
                                        <span>{line.replace(/^[-•]\s*/, '')}</span>
                                      </div>
                                    );
                                  }
                                  return line && <p key={i} className="mb-2">{line}</p>;
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()}

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
                {/* Parse and display attention points graphically */}
                {(() => {
                  const text = attentionPointsData.attentionPoints;
                  // Extract sections using regex - match all numbered sections
                  const sections = text.split(/\n(?=\d+\.\s)/).filter((s: string) => /^\d+\.\s/.test(s.trim()));
                  
                  return (
                    <div className="grid gap-4">
                      {sections.map((section: string, index: number) => {
                        const titleMatch = section.match(/\d+\.\s\*?\*?(.+?)\*?\*?(?:\n|$)/);
                        const title = titleMatch ? titleMatch[1] : `Sezione ${index + 1}`;
                        const content = section.replace(/\d+\.\s\*?\*?.+?\*?\*?(?:\n|$)/, '').trim();
                        
                        // Extract emoji and clean title
                        const emojiMatch = title.match(/([\u1F300-\u1F9FF⚠️📊🎯✅⏰])/);
                        const emoji = emojiMatch ? emojiMatch[1] : ['⚠️', '📊', '🎯', '✅', '⏰'][index] || '📌';
                        const cleanTitle = title.replace(/([\u1F300-\u1F9FF⚠️📊🎯✅⏰])/g, '').trim();
                        
                        // Determine urgency badge and color
                        const urgencyColors = [
                          { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300', label: 'Urgente' },
                          { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800', badge: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300', label: 'Attenzione' },
                          { bg: 'bg-yellow-50 dark:bg-yellow-950/20', border: 'border-yellow-200 dark:border-yellow-800', badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300', label: 'Monitorare' },
                          { bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-800', badge: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300', label: 'Azioni' },
                          { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300', label: 'Pianifica' },
                        ];
                        const colorScheme = urgencyColors[index] || urgencyColors[0];
                        
                        return (
                          <Card key={index} className={`${colorScheme.bg} border-2 ${colorScheme.border}`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <span className="text-2xl">{emoji}</span>
                                  {cleanTitle}
                                </CardTitle>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorScheme.badge}`}>
                                  {colorScheme.label}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="prose prose-sm max-w-none dark:prose-invert text-sm">
                                {content.split('\n').map((line: string, i: number) => {
                                  if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                                    return (
                                      <div key={i} className="flex items-start gap-2 my-1">
                                        <span className="text-primary mt-1">▪</span>
                                        <span>{line.replace(/^[-•]\s*/, '')}</span>
                                      </div>
                                    );
                                  }
                                  return line && <p key={i} className="mb-2">{line}</p>;
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()}

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
