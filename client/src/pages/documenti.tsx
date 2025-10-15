import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Link as LinkIcon, AlertTriangle, User, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface LinkedDoctor {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  linkedAt: string;
}

interface DoctorNote {
  id: string;
  noteTitle: string | null;
  noteText: string;
  isReport: boolean;
  createdAt: string;
  doctor: {
    firstName: string | null;
    lastName: string | null;
  };
}

interface TriageAlert {
  id: string;
  reason: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  status: 'pending' | 'monitoring' | 'user_resolved';
  createdAt: string;
}

const urgencyColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  emergency: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const urgencyLabels = {
  low: 'Basso',
  medium: 'Medio',
  high: 'Alto',
  emergency: 'Emergenza',
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  monitoring: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  user_resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const statusLabels = {
  pending: 'In attesa',
  monitoring: 'Monitoraggio',
  user_resolved: 'Risolto',
};

export default function DocumentiPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [doctorCode, setDoctorCode] = useState("");

  // Fetch linked doctors
  const { data: linkedDoctors = [], isLoading: loadingDoctors } = useQuery<LinkedDoctor[]>({
    queryKey: ["/api/patient/doctors"],
    enabled: !!user,
  });

  // Fetch doctor notes
  const { data: doctorNotes = [], isLoading: loadingNotes } = useQuery<DoctorNote[]>({
    queryKey: ["/api/patient/notes"],
    enabled: !!user,
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: loadingAlerts } = useQuery<TriageAlert[]>({
    queryKey: ["/api/user/alerts"],
    enabled: !!user,
  });

  // Link to doctor mutation
  const linkDoctorMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest("/api/patient/link-doctor", "POST", { doctorCode: code });
    },
    onSuccess: () => {
      toast({
        title: "Collegamento effettuato!",
        description: "Sei ora collegato al medico",
      });
      setDoctorCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/patient/doctors"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLinkDoctor = () => {
    if (!doctorCode.trim()) {
      toast({
        title: "Codice richiesto",
        description: "Inserisci il codice del medico",
        variant: "destructive",
      });
      return;
    }
    linkDoctorMutation.mutate(doctorCode.trim().toUpperCase());
  };

  const isLinked = linkedDoctors.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              I Miei Documenti
            </h1>
            <p className="text-muted-foreground">
              Gestisci il collegamento con il tuo medico, visualizza note e alert medici
            </p>
          </div>

          <div className="grid gap-6">
            {/* Doctor Linking Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Collegamento Medico
                </CardTitle>
                <CardDescription>
                  Inserisci il codice fornito dal tuo medico per collegarti e ricevere note mediche
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLinked ? (
                  <div className="space-y-4">
                    <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        Sei collegato a {linkedDoctors.length} medico{linkedDoctors.length > 1 ? 'i' : ''}
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      {linkedDoctors.map((doctor) => (
                        <div key={doctor.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium">
                                Dr. {doctor.firstName} {doctor.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{doctor.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Collegato {format(new Date(doctor.linkedAt), 'dd MMM yyyy', { locale: it })}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        Non sei ancora collegato a nessun medico. Chiedi al tuo medico il codice di collegamento.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Inserisci codice medico (es. DOC123ABC)"
                        value={doctorCode}
                        onChange={(e) => setDoctorCode(e.target.value.toUpperCase())}
                        className="uppercase"
                        data-testid="input-doctor-code"
                      />
                      <Button
                        onClick={handleLinkDoctor}
                        disabled={linkDoctorMutation.isPending || !doctorCode.trim()}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        data-testid="button-link-doctor"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Collega
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Doctor Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Note Mediche
                </CardTitle>
                <CardDescription>
                  Note e referti medici condivisi dal tuo medico
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingNotes ? (
                  <p className="text-muted-foreground text-center py-4">Caricamento...</p>
                ) : doctorNotes.length === 0 ? (
                  <Alert>
                    <FileText className="w-4 h-4" />
                    <AlertDescription>
                      Non hai ancora note mediche. Il tuo medico potrà condividere note e referti con te.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {doctorNotes.map((note) => (
                      <div key={note.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            {note.noteTitle && (
                              <h4 className="font-semibold mb-1">{note.noteTitle}</h4>
                            )}
                            {note.isReport && (
                              <Badge variant="secondary" className="mb-2">Referto Medico</Badge>
                            )}
                            <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                              {note.noteText}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>Dr. {note.doctor.firstName} {note.doctor.lastName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm', { locale: it })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical Alerts Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alert Medici
                </CardTitle>
                <CardDescription>
                  Notifiche e alert medici dal sistema AI di prevenzione
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAlerts ? (
                  <p className="text-muted-foreground text-center py-4">Caricamento...</p>
                ) : alerts.length === 0 ? (
                  <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Nessun alert medico al momento. Tutto ok!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                              alert.urgencyLevel === 'emergency' ? 'text-red-500' :
                              alert.urgencyLevel === 'high' ? 'text-orange-500' :
                              alert.urgencyLevel === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm mb-2">{alert.reason}</p>
                              <div className="flex flex-wrap gap-2">
                                <Badge className={urgencyColors[alert.urgencyLevel]}>
                                  {urgencyLabels[alert.urgencyLevel]}
                                </Badge>
                                <Badge className={statusColors[alert.status]}>
                                  {statusLabels[alert.status]}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(alert.createdAt), 'dd MMM yyyy, HH:mm', { locale: it })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
