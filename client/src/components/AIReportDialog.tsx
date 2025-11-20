import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Edit3, Send, Sparkles, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AIReportDialogProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onReportSent?: () => void;
}

type ReportData = {
  recordingSid?: string;
  recordingUrl?: string;
  transcription?: string;
  aiGeneratedReport?: string;
  doctorEditedReport?: string;
  reportStatus?: string;
};

export function AIReportDialog({ appointmentId, isOpen, onClose, onReportSent }: AIReportDialogProps) {
  const { toast } = useToast();
  const [editedReport, setEditedReport] = useState("");
  const [activeTab, setActiveTab] = useState("ai");

  // Fetch existing report if available
  const { data: reportData, isLoading: isLoadingReport, refetch: refetchReport } = useQuery<ReportData>({
    queryKey: ['/api/appointments', appointmentId, 'report'],
    enabled: isOpen,
    retry: false,
  });

  // Initialize edited report when data loads
  useEffect(() => {
    if (reportData?.doctorEditedReport) {
      setEditedReport(reportData.doctorEditedReport);
    } else if (reportData?.aiGeneratedReport) {
      setEditedReport(reportData.aiGeneratedReport);
    }
  }, [reportData]);

  // Generate AI report mutation
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/appointments/${appointmentId}/generate-report`, 'POST');
    },
    onSuccess: (data: any) => {
      // Handle 202 response (recording still processing)
      if (data.status === 'processing') {
        toast({
          title: "⏳ Elaborazione in corso",
          description: data.message || "La registrazione è ancora in elaborazione. Riprova tra 1-2 minuti.",
          variant: "default",
        });
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/appointments', appointmentId, 'report'] });
      setEditedReport(data.aiGeneratedReport || "");
      toast({
        title: "✅ Referto generato",
        description: "Il referto AI è stato generato con successo dalla trascrizione della chiamata",
      });
      refetchReport();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile generare il referto AI. Verifica che la registrazione sia disponibile.",
        variant: "destructive",
      });
    },
  });

  // Save edited report mutation
  const saveReportMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/appointments/${appointmentId}/report`, 'PUT', {
        doctorEditedReport: editedReport,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments', appointmentId, 'report'] });
      toast({
        title: "✅ Modifiche salvate",
        description: "Il referto modificato è stato salvato con successo",
      });
      refetchReport();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile salvare le modifiche",
        variant: "destructive",
      });
    },
  });

  // Send report to patient mutation
  const sendReportMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/appointments/${appointmentId}/report/send`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "✅ Referto inviato",
        description: "Il referto è stato inviato al paziente via email e WhatsApp",
      });
      onReportSent?.();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare il referto al paziente",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    generateReportMutation.mutate();
  };

  const handleSave = () => {
    if (!editedReport.trim()) {
      toast({
        title: "Errore",
        description: "Il referto non può essere vuoto",
        variant: "destructive",
      });
      return;
    }
    saveReportMutation.mutate();
  };

  const handleSend = () => {
    if (reportData?.reportStatus !== 'reviewed') {
      toast({
        title: "Attenzione",
        description: "Salva prima le modifiche prima di inviare il referto",
        variant: "destructive",
      });
      return;
    }
    sendReportMutation.mutate();
  };

  const getReportStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">In revisione</Badge>;
      case 'reviewed':
        return <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">Revisionato</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">Inviato</Badge>;
      default:
        return <Badge variant="outline">Non generato</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-ai-report">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Referto Medico AI - Teleconsulto
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Genera, modifica e invia il referto medico automatico post-chiamata
            <span className="ml-2">{getReportStatusBadge(reportData?.reportStatus)}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoadingReport ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Caricamento...</span>
          </div>
        ) : !reportData?.aiGeneratedReport ? (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Nessun referto generato</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Genera automaticamente il referto medico dalla registrazione e trascrizione della videochiamata
              </p>
              <Button 
                onClick={handleGenerate} 
                disabled={generateReportMutation.isPending}
                className="gap-2"
                data-testid="button-generate-report"
              >
                {generateReportMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generazione in corso...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Genera Referto AI
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai" data-testid="tab-ai-report">Referto AI</TabsTrigger>
              <TabsTrigger value="edit" data-testid="tab-edit-report">Modifica</TabsTrigger>
              <TabsTrigger value="transcription" data-testid="tab-transcription">Trascrizione</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Referto Generato dall'AI
                </h4>
                <div className="whitespace-pre-wrap text-sm" data-testid="text-ai-report">
                  {reportData.aiGeneratedReport}
                </div>
              </div>
              {reportData.doctorEditedReport && (
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Versione Revisionata
                  </h4>
                  <div className="whitespace-pre-wrap text-sm">
                    {reportData.doctorEditedReport}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="edit" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Modifica il referto medico
                </label>
                <Textarea
                  value={editedReport}
                  onChange={(e) => setEditedReport(e.target.value)}
                  placeholder="Modifica il referto generato dall'AI..."
                  className="min-h-[400px] font-mono text-sm"
                  data-testid="textarea-edit-report"
                />
              </div>
            </TabsContent>

            <TabsContent value="transcription" className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Trascrizione Audio (Whisper)</h4>
                <div className="whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto" data-testid="text-transcription">
                  {reportData.transcription || "Nessuna trascrizione disponibile"}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {reportData?.aiGeneratedReport && (
          <DialogFooter className="flex gap-2 flex-row justify-end">
            {reportData.reportStatus !== 'sent' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={saveReportMutation.isPending || !editedReport.trim()}
                  className="gap-2"
                  data-testid="button-save-report"
                >
                  {saveReportMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4" />
                      Salva Modifiche
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sendReportMutation.isPending || reportData.reportStatus !== 'reviewed'}
                  className="gap-2"
                  data-testid="button-send-report"
                >
                  {sendReportMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Invio...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Invia al Paziente
                    </>
                  )}
                </Button>
              </>
            )}
            {reportData.reportStatus === 'sent' && (
              <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Referto già inviato al paziente
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
