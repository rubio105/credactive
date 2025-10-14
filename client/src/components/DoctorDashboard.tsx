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
import { Copy, Users, AlertCircle, FileText, UserPlus, Trash2, Check, X } from "lucide-react";
import type { User } from "@shared/schema";

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

export function DoctorDashboard() {
  const { toast } = useToast();
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isReport, setIsReport] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

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

  const handleCreateNote = () => {
    if (!selectedPatient || !noteText) return;

    createNoteMutation.mutate({
      patientId: selectedPatient.id,
      noteTitle: noteTitle || null,
      noteText,
      isReport,
      alertId: selectedAlert || null,
    });
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
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'moderate':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
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
              {doctorCode?.code || "Generazione..."}
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
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{alert.patientName}</p>
                        <Badge className={getSeverityColor(alert.urgencyLevel)}>
                          {alert.urgencyLevel}
                        </Badge>
                        <Badge variant="outline">{alert.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.reason}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.createdAt).toLocaleString('it-IT')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const patient = patients.find(p => p.id === alert.userId);
                      if (patient) {
                        openNoteDialog(patient, alert);
                      }
                    }}
                    data-testid={`button-respond-alert-${alert.id}`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Rispondi con Referto
                  </Button>
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
    </div>
  );
}
