import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  FileText,
  CheckCircle,
  Clock,
  LogOut,
  Loader2,
  Edit,
  Send,
  Phone,
  MessageSquare,
  Mail,
  Eye,
  AlertCircle,
} from "lucide-react";
const prohmedLogo = "/images/ciry-logo.png";

interface ReportDocument {
  id: string;
  patientName: string;
  patientFiscalCode?: string;
  originalFileName: string;
  status: string;
  aiDraftReport?: string;
  finalReport?: string;
  createdAt: string;
  signedAt?: string;
}

export default function RefertatorerReferti() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportDocument | null>(null);
  const [editedReport, setEditedReport] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [otpChannel, setOtpChannel] = useState<"whatsapp" | "email" | "sms">("email");
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  const { data: pendingReports, isLoading: pendingLoading } = useQuery<ReportDocument[]>({
    queryKey: ["/api/report-documents/doctor/pending"],
  });

  const { data: signedReports, isLoading: signedLoading } = useQuery<ReportDocument[]>({
    queryKey: ["/api/report-documents/doctor/signed"],
  });

  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", "POST");
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const openEditor = (report: ReportDocument) => {
    setSelectedReport(report);
    setEditedReport(report.aiDraftReport || "");
    setIsEditorOpen(true);
  };

  const handleSaveReport = async () => {
    if (!selectedReport || !editedReport.trim()) return;

    setIsSaving(true);
    try {
      await apiRequest(`/api/report-documents/${selectedReport.id}/edit`, "PATCH", {
        finalReport: editedReport.trim(),
      });

      toast({
        title: "Referto salvato",
        description: "Le modifiche sono state salvate",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/report-documents/doctor/pending"] });
      setSelectedReport({ ...selectedReport, finalReport: editedReport.trim() });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!selectedReport) return;

    setIsSendingOtp(true);
    try {
      await apiRequest(`/api/report-documents/${selectedReport.id}/request-otp`, "POST", {
        channel: otpChannel,
      });

      toast({
        title: "OTP inviato",
        description: `Codice di verifica inviato via ${otpChannel === "whatsapp" ? "WhatsApp" : otpChannel === "sms" ? "SMS" : "Email"}`,
      });

      setIsEditorOpen(false);
      setIsOtpDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'invio OTP",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!selectedReport || !otpCode.trim()) return;

    setIsVerifyingOtp(true);
    try {
      await apiRequest(`/api/report-documents/${selectedReport.id}/verify-otp`, "POST", {
        otp: otpCode.trim(),
      });

      toast({
        title: "Referto firmato",
        description: "Il referto è stato firmato e il PDF generato",
      });

      setIsOtpDialogOpen(false);
      setOtpCode("");
      setSelectedReport(null);
      queryClient.invalidateQueries({ queryKey: ["/api/report-documents/doctor/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/report-documents/doctor/signed"] });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Codice OTP non valido",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            Da revisionare
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            <Edit className="h-3 w-3" />
            In revisione
          </span>
        );
      case "pending_signature":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
            <AlertCircle className="h-3 w-3" />
            Da firmare
          </span>
        );
      case "signed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Firmato
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (!user?.isReportDoctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Accesso non autorizzato</p>
            <Button onClick={() => setLocation("/login")} className="mt-4">
              Torna al login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={prohmedLogo} alt="Prohmed" className="h-10" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Portale Refertatore</h1>
              <p className="text-sm text-gray-500">
                Dr. {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Esci
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Da Revisionare ({pendingReports?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="signed" data-testid="tab-signed">
              Firmati ({signedReports?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Referti da Revisionare
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : !pendingReports?.length ? (
                  <p className="text-gray-500 text-center py-8">Nessun referto da revisionare</p>
                ) : (
                  <div className="space-y-3">
                    {pendingReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                        data-testid={`pending-report-${report.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{report.patientName}</p>
                          {report.patientFiscalCode && (
                            <p className="text-xs text-gray-500 font-mono">{report.patientFiscalCode}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            Caricato il{" "}
                            {new Date(report.createdAt).toLocaleDateString("it-IT", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(report.status)}
                          <Button
                            onClick={() => openEditor(report)}
                            size="sm"
                            data-testid={`button-edit-${report.id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Revisiona
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Referti Firmati
                </CardTitle>
              </CardHeader>
              <CardContent>
                {signedLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : !signedReports?.length ? (
                  <p className="text-gray-500 text-center py-8">Nessun referto firmato</p>
                ) : (
                  <div className="space-y-3">
                    {signedReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                        data-testid={`signed-report-${report.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{report.patientName}</p>
                          <p className="text-sm text-gray-500">
                            Firmato il{" "}
                            {report.signedAt &&
                              new Date(report.signedAt).toLocaleDateString("it-IT", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(report.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/report-documents/${report.id}/pdf`, "_blank")}
                            data-testid={`button-view-pdf-${report.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizza PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisione Referto - {selectedReport?.patientName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Bozza AI</h4>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                {selectedReport?.aiDraftReport || "Nessuna bozza AI disponibile"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalReport">Referto Finale</Label>
              <Textarea
                id="finalReport"
                value={editedReport}
                onChange={(e) => setEditedReport(e.target.value)}
                rows={12}
                placeholder="Modifica il referto..."
                className="font-mono text-sm"
                data-testid="textarea-final-report"
              />
            </div>

            <div className="space-y-2">
              <Label>Metodo Firma OTP</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={otpChannel === "email" ? "default" : "outline"}
                  onClick={() => setOtpChannel("email")}
                  className="flex-1"
                  data-testid="button-otp-email"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={otpChannel === "whatsapp" ? "default" : "outline"}
                  onClick={() => setOtpChannel("whatsapp")}
                  className="flex-1"
                  disabled={!user?.phone}
                  data-testid="button-otp-whatsapp"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  variant={otpChannel === "sms" ? "default" : "outline"}
                  onClick={() => setOtpChannel("sms")}
                  className="flex-1"
                  disabled={!user?.phone}
                  data-testid="button-otp-sms"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  SMS
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Email:</span> {user?.email || "Non configurata"} | 
                <span className="font-medium ml-2">Telefono:</span> {user?.phone || "Non configurato"}
                {!user?.phone && (
                  <span className="text-amber-600 ml-2">(Contatta admin per configurare WhatsApp/SMS)</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveReport}
              disabled={isSaving || !editedReport.trim()}
              data-testid="button-save-draft"
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salva Bozza
            </Button>
            <Button
              onClick={handleRequestOtp}
              disabled={isSendingOtp || !editedReport.trim()}
              data-testid="button-request-otp"
            >
              {isSendingOtp ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Firma con OTP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Inserisci Codice OTP</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Inserisci il codice di verifica ricevuto via{" "}
              {otpChannel === "whatsapp" ? "WhatsApp" : otpChannel === "sms" ? "SMS" : "Email"} per firmare il referto.
            </p>

            <div className="space-y-2">
              <Label htmlFor="otpCode">Codice OTP</Label>
              <Input
                id="otpCode"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
                data-testid="input-otp"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp || otpCode.length !== 6}
              className="w-full"
              data-testid="button-verify-otp"
            >
              {isVerifyingOtp ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Verifica e Firma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}