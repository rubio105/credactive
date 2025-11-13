import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, FileText, UserPlus, Mail, Phone } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DoctorNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
}

export default function MediciPage() {
  const { toast } = useToast();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [doctorCode, setDoctorCode] = useState("");

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/patient/doctors"],
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery<DoctorNote[]>({
    queryKey: ["/api/patient/notes"],
  });

  const linkDoctorMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("/api/patient/link-doctor", "POST", { doctorCode: code });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Medico collegato!",
        description: "Il medico è stato aggiunto al tuo profilo con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/doctors"] });
      setLinkDialogOpen(false);
      setDoctorCode("");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Codice medico non valido. Verifica il codice e riprova.",
        variant: "destructive",
      });
    },
  });

  const handleLinkDoctor = () => {
    const trimmedCode = doctorCode.trim().toUpperCase();
    if (!trimmedCode) {
      toast({
        title: "Codice mancante",
        description: "Inserisci il codice del medico per continuare.",
        variant: "destructive",
      });
      return;
    }
    linkDoctorMutation.mutate(trimmedCode);
  };

  return (
    <div className="p-4 pb-20 md:pb-4 space-y-6" data-testid="medici-page">
      {/* Medici Collegati Section */}
      <Card className="shadow-sm border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            <CardTitle>I Miei Medici</CardTitle>
          </div>
          <CardDescription>Medici collegati al tuo profilo</CardDescription>
        </CardHeader>
        <CardContent>
          {doctorsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : doctors.length > 0 ? (
            <div className="space-y-3">
              {doctors.map((doctor) => (
                <Card key={doctor.id} className="border-l-4 border-l-primary" data-testid={`card-doctor-${doctor.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-base" data-testid={`doctor-name-${doctor.id}`}>
                          Dott. {doctor.firstName} {doctor.lastName}
                        </h3>
                        {doctor.specialization && (
                          <p className="text-sm text-muted-foreground" data-testid={`doctor-spec-${doctor.id}`}>
                            {doctor.specialization}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span data-testid={`doctor-email-${doctor.id}`}>{doctor.email}</span>
                          </div>
                        </div>
                      </div>
                      <Stethoscope className="w-8 h-8 text-primary opacity-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">
                Nessun medico collegato
              </p>
              <Button 
                onClick={() => setLinkDialogOpen(true)}
                data-testid="btn-collega-medico"
              >
                Collega Medico
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documenti Section */}
      <Card className="shadow-sm border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle>Documenti Medici</CardTitle>
          </div>
          <CardDescription>Note e documenti dai tuoi medici</CardDescription>
        </CardHeader>
        <CardContent>
          {notesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id} data-testid={`note-${note.id}`}>
                  <CardHeader>
                    <CardTitle className="text-base">{note.title}</CardTitle>
                    <CardDescription>
                      {new Date(note.createdAt).toLocaleDateString("it-IT")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Nessun documento disponibile</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Doctor Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent data-testid="dialog-link-doctor">
          <DialogHeader>
            <DialogTitle>Collega Medico</DialogTitle>
            <DialogDescription>
              Inserisci il codice fornito dal tuo medico per collegare il suo profilo al tuo account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doctorCode">Codice Medico</Label>
              <Input
                id="doctorCode"
                value={doctorCode}
                onChange={(e) => setDoctorCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="text-center font-mono text-lg"
                data-testid="input-doctor-code"
              />
              <p className="text-xs text-muted-foreground">
                Il codice viene generato dal medico nelle sue impostazioni
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLinkDialogOpen(false);
                setDoctorCode("");
              }}
              data-testid="button-cancel-link"
            >
              Annulla
            </Button>
            <Button
              onClick={handleLinkDoctor}
              disabled={linkDoctorMutation.isPending}
              data-testid="button-confirm-link"
            >
              {linkDoctorMutation.isPending ? "Collegamento..." : "Collega"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
