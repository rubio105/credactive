import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Copy, Users, AlertCircle, FileText, UserPlus, Trash2, Check, X, AlertTriangle, Info, Zap, MessageSquare, Clock } from "lucide-react";
import type { User } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Patient extends User {
  linkedAt: Date;
}

interface Alert {
  id: string;
  userId: string;
  sessionId: string;
  alertType: string;
  reason: string;
  urgencyLevel: string;
  isReviewed: boolean;
  status: string;
  createdAt: string;
  patientName: string;
  patientEmail: string;
}

interface TriageMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export function DoctorDashboard() {
  const { toast } = useToast();
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showConversationDialog, setShowConversationDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isReport, setIsReport] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [noteCategory, setNoteCategory] = useState<string>("Generico");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversationMessages, setConversationMessages] = useState<TriageMessage[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);

  // Get doctor code - using mutation to generate on demand
  const generateCodeMutation = useMutation<{ code: string }>({
    mutationFn: async () => {
      return apiRequest("/api/doctor/generate-code", "POST", {}) as unknown as Promise<{ code: string }>;
    },
  });

  // Auto-generate code on mount
  useEffect(() => {
    generateCodeMutation.mutate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doctorCode = generateCodeMutation.data;

  // Get linked patients
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/doctor/patients"],
  });

  // Get patient alerts
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/doctor/alerts"],
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/doctor/notes", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/alerts"] });
      toast({
        title: "Nota creata",
        description: "La nota è stata inviata al paziente",
      });
      setShowNoteDialog(false);
      setNoteTitle("");
      setNoteText("");
      setIsReport(false);
      setSelectedAlert(null);
      setSelectedPatient(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unlink patient mutation
  const unlinkPatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      return apiRequest(`/api/doctor/patients/${patientId}`, "DELETE", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/alerts"] });
      toast({
        title: "Paziente rimosso",
        description: "Il paziente è stato rimosso dalla tua lista",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyDoctorCode = () => {
    if (doctorCode?.code) {
      navigator.clipboard.writeText(doctorCode.code);
      toast({
        title: "Codice copiato",
        description: "Il tuo codice medico è stato copiato negli appunti",
      });
    }
  };

  const handleCreateNote = async () => {
    if (!selectedPatient || !noteText) return;

    const formData = new FormData();
    formData.append('patientId', selectedPatient.id);
    formData.append('noteTitle', noteTitle || '');
    formData.append('noteText', noteText);
    formData.append('isReport', String(isReport));
    formData.append('category', noteCategory);
    if (selectedAlert) {
      formData.append('alertId', selectedAlert);
    }
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

      queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/alerts"] });
      toast({
        title: "Nota creata",
        description: "La nota è stata inviata al paziente",
      });
      setShowNoteDialog(false);
      setNoteTitle("");
      setNoteText("");
      setIsReport(false);
      setSelectedAlert(null);
      setSelectedPatient(null);
      setNoteCategory("Generico");
      setSelectedFile(null);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openNoteDialog = (patient: Patient, alert?: Alert) => {
    setSelectedPatient(patient);
    if (alert) {
      setSelectedAlert(alert.id);
      setNoteTitle(`Risposta ad alert: ${alert.reason}`);
    }
    setShowNoteDialog(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'urgent':
      case 'high':
      case 'emergency':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'moderate':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getUrgencyIcon = (urgencyLevel: string) => {
    switch (urgencyLevel.toLowerCase()) {
      case 'urgent':
      case 'high':
      case 'emergency':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'moderate':
      case 'medium':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <Info className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    switch (alertType) {
      case 'sensitive_topic':
        return 'Argomento Sensibile';
      case 'doctor_referral':
      case 'doctor_suggested':
        return 'Richiesta Medico';
      case 'high_urgency':
        return 'Alta Urgenza';
      case 'emergency':
        return 'Emergenza';
      default:
        return alertType;
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Doctor Code Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Il Tuo Codice Medico
          </CardTitle>
          <CardDescription>
            Condividi questo codice con i tuoi pazienti per collegarli al tuo account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted p-4 rounded-lg font-mono text-2xl text-center font-bold">
              {doctorCode?.code || "Caricamento..."}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyDoctorCode}
              disabled={!doctorCode?.code}
              data-testid="button-copy-doctor-code"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Pazienti collegati: {patients.length}
          </p>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            I Tuoi Pazienti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nessun paziente collegato. Condividi il tuo codice medico con i pazienti.
            </p>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {patient.firstName?.[0]}{patient.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openNoteDialog(patient)}
                      data-testid={`button-create-note-${patient.id}`}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Nuova Nota
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (confirm("Rimuovere questo paziente?")) {
                          unlinkPatientMutation.mutate(patient.id);
                        }
                      }}
                      data-testid={`button-unlink-patient-${patient.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Alert Pazienti
          </CardTitle>
          <CardDescription>
            Alert medici generati dall'AI per i tuoi pazienti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nessun alert al momento
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 border-l-4 rounded-lg space-y-3 shadow-sm hover:shadow-md transition-shadow"
                  style={{
                    borderLeftColor: alert.urgencyLevel.toLowerCase().includes('high') || alert.urgencyLevel.toLowerCase().includes('urgent') || alert.urgencyLevel.toLowerCase().includes('emergency') ? '#dc2626' : 
                                    alert.urgencyLevel.toLowerCase().includes('medium') || alert.urgencyLevel.toLowerCase().includes('moderate') ? '#f59e0b' : '#22c55e'
                  }}
                  data-testid={`alert-card-${alert.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getUrgencyIcon(alert.urgencyLevel)}
                        <p className="font-medium">{alert.patientName}</p>
                        <Badge className={getSeverityColor(alert.urgencyLevel)}>
                          {alert.urgencyLevel.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50">
                          {getAlertTypeLabel(alert.alertType)}
                        </Badge>
                        {alert.isReviewed && (
                          <Badge variant="secondary">Revisionato</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.reason}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Clock className="w-3 h-3" />
                        {format(new Date(alert.createdAt), "dd MMM yyyy 'alle' HH:mm", { locale: it })}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const patient = patients.find(p => p.id === alert.userId);
                        if (patient) {
                          openNoteDialog(patient, alert);
                        }
                      }}
                      data-testid={`button-respond-alert-${alert.id}`}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Rispondi
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuova Nota Medica</DialogTitle>
            <DialogDescription>
              {selectedPatient && `Per: ${selectedPatient.firstName} ${selectedPatient.lastName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Titolo (opzionale)</Label>
              <Input
                id="note-title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Es: Referto visita cardiologica"
                data-testid="input-note-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-text">Contenuto Nota / Referto *</Label>
              <Textarea
                id="note-text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Inserisci il contenuto della nota medica o del referto..."
                className="min-h-[200px]"
                data-testid="textarea-note-text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-category">Categoria</Label>
              <Select value={noteCategory} onValueChange={setNoteCategory}>
                <SelectTrigger id="note-category" data-testid="select-note-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ricetta Medica">Ricetta Medica</SelectItem>
                  <SelectItem value="Refertazione">Refertazione</SelectItem>
                  <SelectItem value="Consiglio">Consiglio</SelectItem>
                  <SelectItem value="Generico">Generico</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-report"
                checked={isReport}
                onChange={(e) => setIsReport(e.target.checked)}
                className="w-4 h-4"
                data-testid="checkbox-is-report"
              />
              <Label htmlFor="is-report" className="font-normal cursor-pointer">
                Questa è una refertazione ufficiale
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNoteDialog(false);
                setNoteTitle("");
                setNoteText("");
                setIsReport(false);
                setSelectedAlert(null);
                setSelectedPatient(null);
                setNoteCategory("Generico");
                setSelectedFile(null);
              }}
              data-testid="button-cancel-note"
            >
              <X className="w-4 h-4 mr-2" />
              Annulla
            </Button>
            <Button
              onClick={handleCreateNote}
              disabled={!noteText || createNoteMutation.isPending}
              data-testid="button-save-note"
            >
              <Check className="w-4 h-4 mr-2" />
              {createNoteMutation.isPending ? "Invio..." : "Invia Nota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conversation Dialog */}
      <Dialog open={showConversationDialog} onOpenChange={setShowConversationDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversazione di Triage
            </DialogTitle>
            <DialogDescription>
              Questa è la conversazione AI che ha generato l'alert medico
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {conversationMessages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nessun messaggio nella conversazione
              </p>
            ) : (
              conversationMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${msg.id}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold">
                        {msg.role === 'user' ? 'Paziente' : 'AI Medico'}
                      </span>
                      <span className="text-xs opacity-70">
                        {format(new Date(msg.createdAt), "HH:mm", { locale: it })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConversationDialog(false);
                setConversationMessages([]);
              }}
              data-testid="button-close-conversation"
            >
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
