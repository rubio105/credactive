import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { FileUp, FileText, AlertTriangle, Shield, Trash2, Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PreventionDocument {
  id: string;
  title: string;
  fileUrl: string;
  analysisStatus: string;
  extractedTopics: string[];
  extractedKeywords: string[];
  summary?: string;
  language?: string;
  isActive: boolean;
  createdAt: string;
}

interface PreventionTopic {
  id: string;
  name: string;
  isSensitive: boolean;
  createdAt: string;
}

interface TriageAlert {
  id: string;
  sessionId: string;
  urgencyLevel: string;
  suggestedAction: string;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export function AdminPrevention() {
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfContent, setPdfContent] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");

  const { data: documents, isLoading: docsLoading } = useQuery<PreventionDocument[]>({
    queryKey: ["/api/prevention/documents"],
  });

  const { data: topics } = useQuery<PreventionTopic[]>({
    queryKey: ["/api/prevention/topics"],
  });

  const { data: alerts } = useQuery<TriageAlert[]>({
    queryKey: ["/api/triage/alerts"],
  });

  const uploadDocMutation = useMutation({
    mutationFn: async (data: { title: string; fileUrl: string; pdfContent: string }) => 
      apiRequest("/api/prevention/documents/upload", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/topics"] });
      toast({ title: "Documento caricato e analizzato con successo!" });
      setUploadDialogOpen(false);
      setUploadTitle("");
      setPdfFile(null);
      setPdfContent("");
      setUploadedFileUrl("");
    },
    onError: (error: any) => {
      toast({ title: "Errore upload: " + error.message, variant: "destructive" });
    },
  });

  const toggleTopicSensitiveMutation = useMutation({
    mutationFn: (data: { id: string; isSensitive: boolean }) =>
      apiRequest(`/api/prevention/topics/${data.id}`, "PATCH", { isSensitive: data.isSensitive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prevention/topics"] });
      toast({ title: "Topic aggiornato" });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) =>
      apiRequest(`/api/triage/alerts/${alertId}/resolve`, "POST", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/triage/alerts"] });
      toast({ title: "Alert risolto" });
    },
  });

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/admin/upload-pdf', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      const data = await response.json();
      setPdfContent(data.text || "");
      setUploadedFileUrl(data.url || "");
      
      toast({ title: `PDF caricato (${data.pages} pagine), pronto per l'analisi AI` });
    } catch (error: any) {
      toast({ title: "Errore caricamento PDF: " + error.message, variant: "destructive" });
    }
  };

  const handleUploadSubmit = () => {
    if (!uploadTitle || !pdfContent || !uploadedFileUrl) {
      toast({ title: "Inserisci titolo e carica PDF", variant: "destructive" });
      return;
    }
    
    uploadDocMutation.mutate({
      title: uploadTitle,
      fileUrl: uploadedFileUrl,
      pdfContent,
    });
  };

  return (
    <Tabs defaultValue="documents" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="documents" data-testid="tab-documents">
          <FileText className="w-4 h-4 mr-2" />
          Documenti
        </TabsTrigger>
        <TabsTrigger value="topics" data-testid="tab-topics">
          <Shield className="w-4 h-4 mr-2" />
          Topics Sensibili
        </TabsTrigger>
        <TabsTrigger value="alerts" data-testid="tab-alerts">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Alert Triage
        </TabsTrigger>
      </TabsList>

      <TabsContent value="documents">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documenti Prevenzione</CardTitle>
                <CardDescription>Upload e analisi AI di documenti medici</CardDescription>
              </div>
              <Button onClick={() => setUploadDialogOpen(true)} data-testid="button-upload-doc">
                <FileUp className="w-4 h-4 mr-2" />
                Upload PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {docsLoading ? (
              <div>Caricamento...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Topics Estratti</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents?.map((doc) => (
                    <TableRow key={doc.id} data-testid={`row-doc-${doc.id}`}>
                      <TableCell>{doc.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {doc.extractedTopics?.slice(0, 3).map((topic, i) => (
                            <Badge key={i} variant="outline">{topic}</Badge>
                          ))}
                          {doc.extractedTopics?.length > 3 && (
                            <Badge variant="secondary">+{doc.extractedTopics.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={doc.analysisStatus === 'completed' ? 'default' : 'secondary'}>
                          {doc.analysisStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" data-testid={`button-download-${doc.id}`}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="topics">
        <Card>
          <CardHeader>
            <CardTitle>Gestione Topics Sensibili</CardTitle>
            <CardDescription>Marca topics che richiedono referral medico</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Topic</TableHead>
                  <TableHead>Sensibile</TableHead>
                  <TableHead>Data Creazione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics?.map((topic) => (
                  <TableRow key={topic.id} data-testid={`row-topic-${topic.id}`}>
                    <TableCell className="font-medium">{topic.name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={topic.isSensitive}
                        onCheckedChange={(checked) => 
                          toggleTopicSensitiveMutation.mutate({ id: topic.id, isSensitive: checked })
                        }
                        data-testid={`switch-sensitive-${topic.id}`}
                      />
                    </TableCell>
                    <TableCell>{new Date(topic.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="alerts">
        <Card>
          <CardHeader>
            <CardTitle>Alert Triage Medici</CardTitle>
            <CardDescription>Review situazioni che richiedono attenzione medica</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Urgenza</TableHead>
                  <TableHead>Azione Suggerita</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts?.map((alert) => (
                  <TableRow key={alert.id} data-testid={`row-alert-${alert.id}`}>
                    <TableCell>
                      <Badge variant={alert.urgencyLevel === 'high' ? 'destructive' : 'default'}>
                        {alert.urgencyLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>{alert.suggestedAction}</TableCell>
                    <TableCell>
                      <Badge variant={alert.isResolved ? 'secondary' : 'default'}>
                        {alert.isResolved ? 'Risolto' : 'Aperto'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(alert.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {!alert.isResolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlertMutation.mutate(alert.id)}
                          data-testid={`button-resolve-${alert.id}`}
                        >
                          Risolvi
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent data-testid="dialog-upload-doc">
          <DialogHeader>
            <DialogTitle>Upload Documento Prevenzione</DialogTitle>
            <DialogDescription>
              Carica un PDF medico per analisi AI automatica
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titolo Documento</Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="es. Guida Prevenzione Cardiovascolare"
                data-testid="input-doc-title"
              />
            </div>
            <div>
              <Label htmlFor="pdf">File PDF</Label>
              <Input
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                data-testid="input-doc-pdf"
              />
              {pdfFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  ✓ {pdfFile.name} ({Math.round(pdfFile.size / 1024)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleUploadSubmit}
              disabled={uploadDocMutation.isPending || !pdfContent}
              data-testid="button-submit-upload"
            >
              {uploadDocMutation.isPending ? "Analisi in corso..." : "Upload e Analizza"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
