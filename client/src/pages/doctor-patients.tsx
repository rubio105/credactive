import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Copy, FileText, Trash2, Check, X } from "lucide-react";
import Navigation from "@/components/navigation";
import { BackButton } from "@/components/BackButton";
import { SEO } from "@/components/SEO";
import type { User } from "@shared/schema";

interface Patient extends User {
  linkedAt: Date;
}

export default function DoctorPatientsPage() {
  const { toast } = useToast();
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isReport, setIsReport] = useState(false);

  // Get doctor code automatically
  const { data: doctorCode } = useQuery<{ code: string }>({
    queryKey: ["/api/doctor/linking-code"],
  });

  // Get linked patients
  const { data: patients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/doctor/patients"],
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/doctor/notes", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
      toast({
        title: "Nota creata",
        description: "La nota è stata inviata al paziente",
      });
      setShowNoteDialog(false);
      setNoteTitle("");
      setNoteText("");
      setIsReport(false);
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
    });
  };

  const openNoteDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowNoteDialog(true);
  };

  return (
    <>
      <SEO 
        title="I Miei Pazienti | CIRY - Portale Medico"
        description="Gestisci i tuoi pazienti, monitora gli alert medici e crea note cliniche sulla piattaforma CIRY."
      />
      <Navigation />
      
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton className="mb-4" />
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="page-title">I Miei Pazienti</h1>
            <p className="text-muted-foreground">
              Gestisci i tuoi pazienti collegati e monitora la loro salute
            </p>
          </div>

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
                  Lista Pazienti
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Caricamento pazienti...</p>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">Nessun paziente collegato</p>
                    <p className="text-sm text-muted-foreground">
                      Condividi il tuo codice medico con i pazienti per iniziare
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        data-testid={`patient-card-${patient.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {patient.firstName?.[0]}{patient.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`patient-name-${patient.id}`}>
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
                              if (confirm("Rimuovere questo paziente dalla tua lista?")) {
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
          </div>

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
      </div>
    </>
  );
}
