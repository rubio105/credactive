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
import { FileText, Link as LinkIcon, AlertTriangle, User, Clock, CheckCircle2, XCircle, Download, Activity } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { HealthReport, formatReportDate, getReportUrgencyLevel } from "@/types/healthReport";

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
  category?: string | null;
  attachmentPath?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
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

  // Fetch health reports (referti AI)
  const { data: healthReports = [], isLoading: loadingReports } = useQuery<HealthReport[]>({
    queryKey: ["/api/health-score/reports"],
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
            {/* Health Reports Section (Referti AI) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Referti AI
                    </CardTitle>
                    <CardDescription>
                      I tuoi referti medici analizzati dall'intelligenza artificiale
                    </CardDescription>
                  </div>
                  {healthReports.length > 0 && (
                    <Badge variant="secondary" className="text-sm">
                      {healthReports.length} {healthReports.length === 1 ? 'referto' : 'referti'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingReports ? (
                  <p className="text-muted-foreground text-center py-4">Caricamento referti...</p>
                ) : healthReports.length === 0 ? (
                  <Alert>
                    <FileText className="w-4 h-4" />
                    <AlertDescription>
                      Non hai ancora caricato referti. Vai alla sezione AI per caricare e analizzare i tuoi documenti medici.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {healthReports.map((report) => {
                      const urgency = getReportUrgencyLevel(report);
                      // Defensive check: only process if findings is an array of objects (not legacy strings)
                      const findings = report.radiologicalAnalysis?.findings || [];
                      const urgentFindings = Array.isArray(findings) && findings.length > 0 && typeof findings[0] === 'object'
                        ? findings.filter(f => f.category === 'urgent' || f.category === 'attention')
                        : [];
                      
                      return (
                        <div
                          key={report.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          data-testid={`health-report-${report.id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold" data-testid={`text-report-filename-${report.id}`}>
                                  {report.fileName}
                                </h4>
                                {urgency !== 'none' && (
                                  <Badge
                                    variant={urgency === 'urgent' ? 'destructive' : 'default'}
                                    className="text-xs"
                                    data-testid={`badge-urgency-${report.id}`}
                                  >
                                    {urgency === 'urgent' ? '⚠️ Attenzione' : 'Richiede controllo'}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                <Badge variant="outline" className="text-xs" data-testid={`badge-report-type-${report.id}`}>
                                  {report.reportType}
                                </Badge>
                                {report.reportDate && (
                                  <span className="text-xs text-muted-foreground" data-testid={`text-report-date-${report.id}`}>
                                    📅 {formatReportDate(report.reportDate)}
                                  </span>
                                )}
                              </div>
                              
                              {/* AI Summary Preview */}
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2" data-testid={`text-ai-summary-${report.id}`}>
                                {report.aiSummary}
                              </p>
                              
                              {/* Radiological Urgent Findings */}
                              {urgentFindings.length > 0 && (
                                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded">
                                  <p className="text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">
                                    Risultati da valutare:
                                  </p>
                                  <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                                    {urgentFindings.slice(0, 3).map((finding, idx) => (
                                      <li key={idx}>
                                        • {finding.description} {finding.location && `(${finding.location})`}
                                      </li>
                                    ))}
                                    {urgentFindings.length > 3 && (
                                      <li className="text-orange-600 dark:text-orange-400">
                                        ...e altri {urgentFindings.length - 3}
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              data-testid={`button-download-report-${report.id}`}
                            >
                              <a
                                href={`/api/health-score/reports/${report.id}/pdf`}
                                download={report.fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Scarica PDF
                              </a>
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span data-testid={`text-upload-date-${report.id}`}>
                                Caricato {format(new Date(report.createdAt), 'dd MMM yyyy, HH:mm', { locale: it })}
                              </span>
                            </div>
                            {report.radiologicalAnalysis && (
                              <div className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                <span data-testid={`text-report-findings-${report.id}`}>
                                  {report.radiologicalAnalysis.findings.length} risultati analizzati
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

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
                            <div className="flex flex-wrap gap-2 mb-2">
                              {note.category && (
                                <Badge variant="outline" className="text-xs">
                                  {note.category}
                                </Badge>
                              )}
                              {note.isReport && (
                                <Badge variant="secondary" className="text-xs">Referto Medico</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                              {note.noteText}
                            </p>
                            {note.attachmentPath && (
                              <div className="mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  data-testid={`button-download-attachment-${note.id}`}
                                >
                                  <a href={note.attachmentPath} download={note.attachmentName} target="_blank" rel="noopener noreferrer">
                                    <FileText className="w-4 h-4 mr-2" />
                                    {note.attachmentName || 'Scarica Allegato'}
                                  </a>
                                </Button>
                              </div>
                            )}
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
