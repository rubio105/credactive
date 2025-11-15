import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Filter, MessageSquare, Info, Zap, Clock, AlertCircle, FileText, ChevronLeft, ChevronRight, User, Activity, Sparkles, Edit } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, isToday, startOfToday, endOfToday } from "date-fns";
import { it } from "date-fns/locale";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Alert {
  id: string;
  userId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  sessionId: string;
  alertType: string;
  reason: string;
  urgencyLevel: string;
  urgency: string;
  isReviewed: boolean;
  status: string;
  title: string;
  description: string;
  createdAt: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TriageMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface PatientContext {
  age?: number;
  gender?: string;
  preventionIndex?: number;
  lastAlerts?: Array<{id: string; reason: string; createdAt: string; status: string}>;
  wearableData?: {
    bloodPressure?: string;
    heartRate?: number;
    lastSync?: string;
  };
}

const ALERTS_PER_PAGE = 10;

function getUrgencyBadgeVariant(urgency: string): "default" | "destructive" | "secondary" {
  const level = urgency.toUpperCase();
  if (level === 'EMERGENCY' || level === 'HIGH' || level === 'URGENT') return 'destructive';
  if (level === 'MEDIUM' || level === 'MODERATE') return 'default';
  return 'secondary';
}

function getSeverityColor(severity: string) {
  const level = severity.toLowerCase();
  if (level.includes('urgent') || level.includes('high') || level.includes('emergency')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
  if (level.includes('moderate') || level.includes('medium')) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
  if (level.includes('low')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
}

function getUrgencyIcon(urgencyLevel: string) {
  const level = urgencyLevel.toLowerCase();
  if (level.includes('urgent') || level.includes('high') || level.includes('emergency')) {
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  }
  if (level.includes('moderate') || level.includes('medium')) {
    return <Zap className="w-4 h-4 text-yellow-600" />;
  }
  if (level.includes('low')) {
    return <Info className="w-4 h-4 text-green-600" />;
  }
  return <AlertCircle className="w-4 h-4 text-blue-600" />;
}

function getAlertTypeLabel(alertType: string) {
  const types: Record<string, string> = {
    sensitive_topic: 'Argomento Sensibile',
    doctor_referral: 'Richiesta Medico',
    doctor_suggested: 'Richiesta Medico',
    high_urgency: 'Alta Urgenza',
    emergency: 'Emergenza',
  };
  return types[alertType] || alertType;
}

export default function DoctorAlertsPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("pending");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<"today" | "all">("today");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showConversationDialog, setShowConversationDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<TriageMessage[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [patientContext, setPatientContext] = useState<PatientContext | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast} = useToast();

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/doctor/alerts"],
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/doctor/patients"],
  });

  // Apply filters
  const filteredAlerts = alerts.filter(alert => {
    // Status filter
    if (statusFilter !== "all" && alert.status !== statusFilter) return false;
    
    // Urgency filter
    if (urgencyFilter !== "all") {
      const alertUrgency = (alert.urgencyLevel || alert.urgency || '').toLowerCase();
      if (urgencyFilter === 'high' && !['emergency', 'urgent', 'high'].some(u => alertUrgency.includes(u))) return false;
      if (urgencyFilter === 'medium' && !['medium', 'moderate'].some(u => alertUrgency.includes(u))) return false;
      if (urgencyFilter === 'low' && !alertUrgency.includes('low')) return false;
    }
    
    // Time filter
    if (timeFilter === 'today') {
      const alertDate = new Date(alert.createdAt);
      return isToday(alertDate);
    }
    
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / ALERTS_PER_PAGE);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * ALERTS_PER_PAGE,
    currentPage * ALERTS_PER_PAGE
  );

  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/doctor/notes", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/alerts"] });
      toast({
        title: "Nota creata",
        description: "La nota è stata inviata al paziente",
      });
      setShowNoteDialog(false);
      setNoteTitle("");
      setNoteText("");
      setSelectedAlert(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loadConversation = async (alertId: string) => {
    setLoadingConversation(true);
    try {
      const response = await fetch(`/api/doctor/alerts/${alertId}/conversation`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Impossibile caricare la conversazione');
      }
      
      const data = await response.json();
      setConversationMessages(data.messages || []);
      setPatientContext(data.patientContext || null);
      setShowConversationDialog(true);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile caricare la conversazione",
        variant: "destructive",
      });
    } finally {
      setLoadingConversation(false);
    }
  };

  const generateAIResponseMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiRequest(`/api/doctor/alerts/${alertId}/generate-response`, "POST", {});
      return response.json();
    },
    onSuccess: (data) => {
      setNoteText(data.generatedResponse || "");
      setNoteTitle("Risposta generata da CIRY AI");
      setShowNoteDialog(true);
      setShowConversationDialog(false);
      toast({
        title: "Report generato",
        description: "Puoi modificare la risposta prima di inviarla al paziente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile generare il report",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAIResponse = () => {
    if (!selectedAlert) return;
    generateAIResponseMutation.mutate(selectedAlert.id);
  };

  const handleRespond = (alert: Alert) => {
    setSelectedAlert(alert);
    setNoteTitle(`Risposta ad alert: ${alert.reason}`);
    setShowNoteDialog(true);
  };

  const handleSaveNote = async () => {
    if (!selectedAlert || !noteText) return;

    // Use patientId if available, fallback to userId for legacy alerts
    const patientLookupId = selectedAlert.patientId || selectedAlert.userId;
    const patient = patients.find(p => p.id === patientLookupId);
    
    if (!patient) {
      toast({
        title: "Errore",
        description: "Paziente non trovato",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('patientId', patient.id);
    formData.append('noteTitle', noteTitle || '');
    formData.append('noteText', noteText);
    formData.append('isReport', 'false');
    formData.append('alertId', selectedAlert.id);
    if (selectedFile) {
      formData.append('attachment', selectedFile);
    }

    try {
      const response = await fetch('/api/doctor/notes', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Errore durante la creazione della nota');
      }

      queryClient.invalidateQueries({ queryKey: ["/api/doctor/alerts"] });
      toast({
        title: "Nota creata",
        description: "La nota è stata inviata al paziente",
      });
      setShowNoteDialog(false);
      setNoteTitle("");
      setNoteText("");
      setSelectedFile(null);
      setSelectedAlert(null);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 pb-20 md:pb-4" data-testid="doctor-alerts-page">
      <Card className="shadow-sm border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <CardTitle>Alert Pazienti</CardTitle>
          </div>
          <CardDescription>Gestisci gli alert medici generati dall'AI per i tuoi pazienti</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-3 mb-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Stato:</span>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatusFilter("pending"); setCurrentPage(1); }}
                  data-testid="filter-pending"
                >
                  In Attesa ({alerts.filter(a => a.status === 'pending').length})
                </Button>
                <Button
                  variant={statusFilter === "resolved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatusFilter("resolved"); setCurrentPage(1); }}
                  data-testid="filter-resolved"
                >
                  Risolti
                </Button>
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
                  data-testid="filter-all"
                >
                  Tutti
                </Button>
              </div>
            </div>

            {/* Urgency Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Urgenza:</span>
              <div className="flex gap-2">
                <Button
                  variant={urgencyFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setUrgencyFilter("all"); setCurrentPage(1); }}
                  data-testid="filter-urgency-all"
                >
                  Tutte
                </Button>
                <Button
                  variant={urgencyFilter === "high" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => { setUrgencyFilter("high"); setCurrentPage(1); }}
                  data-testid="filter-urgency-high"
                >
                  Alta
                </Button>
                <Button
                  variant={urgencyFilter === "medium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setUrgencyFilter("medium"); setCurrentPage(1); }}
                  data-testid="filter-urgency-medium"
                >
                  Media
                </Button>
                <Button
                  variant={urgencyFilter === "low" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => { setUrgencyFilter("low"); setCurrentPage(1); }}
                  data-testid="filter-urgency-low"
                >
                  Bassa
                </Button>
              </div>
            </div>

            {/* Time Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Periodo:</span>
              <div className="flex gap-2">
                <Button
                  variant={timeFilter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setTimeFilter("today"); setCurrentPage(1); }}
                  data-testid="filter-time-today"
                >
                  Oggi ({alerts.filter(a => isToday(new Date(a.createdAt))).length})
                </Button>
                <Button
                  variant={timeFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setTimeFilter("all"); setCurrentPage(1); }}
                  data-testid="filter-time-all"
                >
                  Tutti
                </Button>
              </div>
            </div>
          </div>

          {/* Alert List */}
          <div className="space-y-3">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </>
            ) : paginatedAlerts.length > 0 ? (
              <>
                {paginatedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 border-l-4 rounded-lg space-y-3 shadow-sm hover:shadow-md transition-shadow bg-card"
                    style={{
                      borderLeftColor: 
                        (alert.urgencyLevel || alert.urgency || '').toLowerCase().includes('high') || 
                        (alert.urgencyLevel || alert.urgency || '').toLowerCase().includes('urgent') || 
                        (alert.urgencyLevel || alert.urgency || '').toLowerCase().includes('emergency') ? '#dc2626' : 
                        (alert.urgencyLevel || alert.urgency || '').toLowerCase().includes('medium') || 
                        (alert.urgencyLevel || alert.urgency || '').toLowerCase().includes('moderate') ? '#f59e0b' : '#22c55e'
                    }}
                    data-testid={`alert-card-${alert.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {getUrgencyIcon(alert.urgencyLevel || alert.urgency || '')}
                          <p className="font-medium">{alert.patientName}</p>
                          <Badge className={getSeverityColor(alert.urgencyLevel || alert.urgency || '')}>
                            {(alert.urgencyLevel || alert.urgency || 'UNKNOWN').toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                            {getAlertTypeLabel(alert.alertType)}
                          </Badge>
                          {alert.isReviewed && (
                            <Badge variant="secondary">Revisionato</Badge>
                          )}
                          {alert.status === 'resolved' && (
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-950">Risolto</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">{alert.title || alert.reason}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.description || alert.reason}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(alert.createdAt), "dd MMM yyyy 'alle' HH:mm", { locale: it })}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadConversation(alert.id)}
                        disabled={loadingConversation}
                        data-testid={`button-view-conversation-${alert.id}`}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {loadingConversation ? "Caricamento..." : "Vedi Conversazione"}
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Pagina {currentPage} di {totalPages} • {filteredAlerts.length} alert totali
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {timeFilter === 'today' ? 'Nessun alert oggi' : 'Nessun alert trovato'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversation Dialog */}
      <Dialog open={showConversationDialog} onOpenChange={setShowConversationDialog}>
        <DialogContent className="max-w-[95vw] md:max-w-[1200px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversazione di Triage
            </DialogTitle>
            <DialogDescription>
              Conversazione AI che ha generato l'alert • {selectedAlert?.patientName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-[1fr_320px] gap-4 p-6 overflow-hidden flex-1">
            {/* Conversazione */}
            <div className="flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3">
                  {conversationMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-blue-50 dark:bg-blue-950/20 ml-8' 
                          : 'bg-muted mr-8'
                      }`}
                      data-testid={`message-${msg.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase">
                          {msg.role === 'user' ? 'Paziente' : 'AI'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.createdAt), "HH:mm", { locale: it })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Sidebar Contesto Paziente */}
            <div className="border-l pl-4 flex flex-col space-y-4 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <User className="w-4 h-4" />
                  Contesto Paziente
                </div>

                {patientContext && (
                  <>
                    {/* Dati Demografici */}
                    <Card className="p-3 bg-muted/50">
                      <div className="space-y-2 text-sm">
                        {patientContext.age && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Età:</span>
                            <span className="font-medium">{patientContext.age} anni</span>
                          </div>
                        )}
                        {patientContext.gender && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sesso:</span>
                            <span className="font-medium capitalize">{patientContext.gender}</span>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Prevention Index */}
                    {patientContext.preventionIndex !== undefined && (
                      <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">Prevention Index</span>
                          </div>
                          <Badge variant="secondary" className="text-base font-bold">
                            {patientContext.preventionIndex.toFixed(1)}/10
                          </Badge>
                        </div>
                      </Card>
                    )}

                    {/* Dati Wearable */}
                    {patientContext.wearableData && (
                      <Card className="p-3 bg-green-50 dark:bg-green-950/20">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 font-medium mb-2">
                            <Activity className="w-4 h-4 text-green-600" />
                            Dati Dispositivo
                          </div>
                          {patientContext.wearableData.bloodPressure && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Pressione:</span>
                              <span className="font-medium">{patientContext.wearableData.bloodPressure}</span>
                            </div>
                          )}
                          {patientContext.wearableData.heartRate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Frequenza:</span>
                              <span className="font-medium">{patientContext.wearableData.heartRate} bpm</span>
                            </div>
                          )}
                          {patientContext.wearableData.lastSync && (
                            <div className="text-xs text-muted-foreground mt-2">
                              Ultimo sync: {format(new Date(patientContext.wearableData.lastSync), "dd/MM HH:mm")}
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* Alert Recenti */}
                    {patientContext.lastAlerts && patientContext.lastAlerts.length > 0 && (
                      <Card className="p-3">
                        <div className="text-sm font-medium mb-2">Alert Recenti</div>
                        <div className="space-y-2">
                          {patientContext.lastAlerts.slice(0, 3).map((alert) => (
                            <div key={alert.id} className="text-xs border-l-2 border-muted pl-2 py-1">
                              <div className="font-medium">{alert.reason}</div>
                              <div className="text-muted-foreground flex justify-between">
                                <span>{format(new Date(alert.createdAt), "dd MMM", { locale: it })}</span>
                                <Badge variant={alert.status === 'resolved' ? 'outline' : 'secondary'} className="text-xs">
                                  {alert.status === 'resolved' ? 'Risolto' : 'Attivo'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 pb-6 pt-4 border-t gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConversationDialog(false)} 
              data-testid="button-close-conversation"
            >
              Chiudi
            </Button>
            <Button
              onClick={handleGenerateAIResponse}
              disabled={generateAIResponseMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              data-testid="button-generate-ai-response"
            >
              {generateAIResponseMutation.isPending ? (
                <>Generazione...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Genera Report AI
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Nuova Nota Medica
              {noteTitle.includes("generata da CIRY AI") && (
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedAlert && `Risposta all'alert per: ${selectedAlert.patientName}`}
            </DialogDescription>
          </DialogHeader>

          {noteTitle.includes("generata da CIRY AI") && (
            <div className="px-6 py-3 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-600 rounded">
              <p className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Questa risposta è stata generata da CIRY AI. Puoi modificarla prima di inviarla al paziente.
              </p>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Titolo (opzionale)</Label>
              <Input
                id="note-title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Es: Risposta ad alert"
                data-testid="input-note-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-text">Contenuto Nota *</Label>
              <Textarea
                id="note-text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Inserisci la tua risposta..."
                className="min-h-[200px]"
                data-testid="textarea-note-text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">Allegato (opzionale)</Label>
              <Input
                id="attachment"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                data-testid="input-note-attachment"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  File selezionato: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNoteDialog(false);
                setNoteTitle("");
                setNoteText("");
                setSelectedAlert(null);
              }}
              data-testid="button-cancel-note"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={!noteText || createNoteMutation.isPending}
              data-testid="button-save-note"
            >
              {createNoteMutation.isPending ? "Invio..." : "Invia Nota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
