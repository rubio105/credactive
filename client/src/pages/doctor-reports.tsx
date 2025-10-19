import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Trash2, Check, X, FileCheck, Calendar } from "lucide-react";
import Navigation from "@/components/navigation";
import { SEO } from "@/components/SEO";
import type { User } from "@shared/schema";

interface DoctorNote {
  id: string;
  doctorId: string;
  patientId: string;
  noteTitle: string | null;
  noteText: string;
  isReport: boolean;
  alertId: string | null;
  createdAt: string;
  patientName?: string;
  patientEmail?: string;
}

interface Patient extends User {
  linkedAt: Date;
}

export default function DoctorReportsPage() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isReport, setIsReport] = useState(false);
  const [noteCategory, setNoteCategory] = useState<string>("Generico");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Get all doctor's reports/notes
  const { data: notes = [], isLoading } = useQuery<DoctorNote[]>({
    queryKey: ["/api/doctor/all-notes"],
  });

  // Get linked patients for the dropdown
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/doctor/patients"],
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/doctor/notes", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/all-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
      toast({
        title: "Referto creato",
        description: "Il referto è stato salvato con successo",
      });
      setShowCreateDialog(false);
      setSelectedPatientId("");
      setNoteTitle("");
      setNoteText("");
      setIsReport(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return apiRequest(`/api/doctor/notes/${noteId}`, "DELETE", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/all-notes"] });
      toast({
        title: "Nota eliminata",
        description: "La nota è stata eliminata con successo",
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

  const handleCreateNote = async () => {
    if (!selectedPatientId || !noteText) return;

    const formData = new FormData();
    formData.append('patientId', selectedPatientId);
    formData.append('noteTitle', noteTitle || '');
    formData.append('noteText', noteText);
    formData.append('isReport', String(isReport));
    formData.append('category', noteCategory);
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

      queryClient.invalidateQueries({ queryKey: ["/api/doctor/all-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
      toast({
        title: "Referto creato",
        description: "Il referto è stato salvato con successo",
      });
      setShowCreateDialog(false);
      setSelectedPatientId("");
      setNoteTitle("");
      setNoteText("");
      setIsReport(false);
      setNoteCategory("Generico");
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore sconosciuto",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setShowCreateDialog(true);
  };

  // Group notes by patient
  const notesByPatient = notes.reduce((acc, note) => {
    const patientKey = note.patientId;
    if (!acc[patientKey]) {
      acc[patientKey] = [];
    }
    acc[patientKey].push(note);
    return acc;
  }, {} as Record<string, DoctorNote[]>);

  return (
    <>
      <SEO 
        title="Refertazione | CIRY - Portale Medico"
        description="Gestisci i referti medici e le note cliniche per i tuoi pazienti sulla piattaforma CIRY."
      />
      <Navigation />
      
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Refertazione e Documenti</h1>
              <p className="text-muted-foreground">
                Gestisci i referti medici e le note cliniche per i tuoi pazienti
              </p>
            </div>
            <Button onClick={openCreateDialog} data-testid="button-create-report">
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Referto
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Totale Documenti</p>
                    <p className="text-3xl font-bold mt-1">{notes.length}</p>
                  </div>
                  <FileText className="w-10 h-10 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Referti Ufficiali</p>
                    <p className="text-3xl font-bold mt-1">{notes.filter(n => n.isReport).length}</p>
                  </div>
                  <FileCheck className="w-10 h-10 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Note Cliniche</p>
                    <p className="text-3xl font-bold mt-1">{notes.filter(n => !n.isReport).length}</p>
                  </div>
                  <FileText className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documenti per Paziente
              </CardTitle>
              <CardDescription>
                I tuoi referti e note cliniche organizzati per paziente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Caricamento documenti...</p>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">Nessun documento creato</p>
                  <p className="text-sm text-muted-foreground">
                    Inizia creando il tuo primo referto o nota clinica
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(notesByPatient).map(([patientId, patientNotes]) => {
                    const firstNote = patientNotes[0];
                    const patient = patients.find(p => p.id === patientId);
                    const patientName = patient 
                      ? `${patient.firstName} ${patient.lastName}`
                      : firstNote.patientName || 'Paziente Sconosciuto';

                    return (
                      <div key={patientId} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {patientName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{patientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {patientNotes.length} {patientNotes.length === 1 ? 'documento' : 'documenti'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 ml-13">
                          {patientNotes.map((note) => (
                            <div
                              key={note.id}
                              className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                              data-testid={`note-card-${note.id}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{note.noteTitle || 'Senza titolo'}</p>
                                  {note.isReport && (
                                    <Badge variant="default" className="bg-green-600">
                                      Referto Ufficiale
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {note.noteText}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(note.createdAt).toLocaleString('it-IT')}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Eliminare questo documento?")) {
                                    deleteNoteMutation.mutate(note.id);
                                  }
                                }}
                                data-testid={`button-delete-note-${note.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Note Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nuovo Referto / Nota Clinica</DialogTitle>
                <DialogDescription>
                  Crea un nuovo documento medico per un paziente
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-select">Paziente *</Label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger id="patient-select" data-testid="select-patient">
                      <SelectValue placeholder="Seleziona un paziente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.length === 0 ? (
                        <SelectItem value="none" disabled>Nessun paziente disponibile</SelectItem>
                      ) : (
                        patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName} ({patient.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

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
                    setShowCreateDialog(false);
                    setSelectedPatientId("");
                    setNoteTitle("");
                    setNoteText("");
                    setIsReport(false);
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
                  disabled={!selectedPatientId || !noteText || createNoteMutation.isPending}
                  data-testid="button-save-note"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {createNoteMutation.isPending ? "Salvataggio..." : "Salva Referto"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
