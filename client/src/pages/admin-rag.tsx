import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Database, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type MedicalDocument = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  language: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  status: string;
  chunksCount?: number;
  createdAt: string;
};

export default function AdminRAGPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    category: "medical",
    language: "it"
  });

  const { data: documents, isLoading } = useQuery<MedicalDocument[]>({
    queryKey: ["/api/admin/knowledge-base"],
    enabled: !!(user as any)?.isAdmin,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/knowledge-base/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Upload failed");
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-base"] });
      setShowUploadDialog(false);
      setSelectedFile(null);
      setUploadData({
        title: "",
        description: "",
        category: "medical",
        language: "it"
      });
      toast({
        title: "Documento caricato",
        description: "Il documento è stato elaborato e aggiunto al knowledge base",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore upload",
        description: error.message || "Impossibile caricare il documento",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/knowledge-base/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-base"] });
      toast({
        title: "Documento eliminato",
        description: "Il documento è stato rimosso dal knowledge base",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore eliminazione",
        description: error.message || "Impossibile eliminare il documento",
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "File mancante",
        description: "Seleziona un file da caricare",
        variant: "destructive",
      });
      return;
    }

    if (!uploadData.title.trim()) {
      toast({
        title: "Titolo mancante",
        description: "Inserisci un titolo per il documento",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("title", uploadData.title);
    formData.append("description", uploadData.description);
    formData.append("category", uploadData.category);
    formData.append("language", uploadData.language);

    uploadMutation.mutate(formData);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!(user as any)?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>
              Non hai i permessi necessari per accedere a questa sezione.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalDocuments = documents?.length || 0;
  const totalChunks = documents?.reduce((sum, doc) => sum + (doc.chunksCount || 0), 0) || 0;
  const processedDocs = documents?.filter(d => d.status === 'processed').length || 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sistemi RAG</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gestisci knowledge base per AI Prevention</p>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-document">
                <Upload className="w-4 h-4 mr-2" />
                Carica Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Carica Documento Scientifico</DialogTitle>
                <DialogDescription>
                  Aggiungi un documento al knowledge base per arricchire le risposte AI
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>File (PDF, TXT, MD)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    data-testid="input-file"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
                <div>
                  <Label>Titolo *</Label>
                  <Input
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    placeholder="Es: Linee guida prevenzione cardiovascolare"
                    data-testid="input-title"
                  />
                </div>
                <div>
                  <Label>Descrizione</Label>
                  <Textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    placeholder="Breve descrizione del contenuto..."
                    rows={3}
                    data-testid="input-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={uploadData.category}
                      onValueChange={(value) => setUploadData({ ...uploadData, category: value })}
                    >
                      <SelectTrigger data-testid="select-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medical">Medicina</SelectItem>
                        <SelectItem value="cardiology">Cardiologia</SelectItem>
                        <SelectItem value="oncology">Oncologia</SelectItem>
                        <SelectItem value="prevention">Prevenzione</SelectItem>
                        <SelectItem value="nutrition">Nutrizione</SelectItem>
                        <SelectItem value="other">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lingua</Label>
                    <Select
                      value={uploadData.language}
                      onValueChange={(value) => setUploadData({ ...uploadData, language: value })}
                    >
                      <SelectTrigger data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="en">Inglese</SelectItem>
                        <SelectItem value="es">Spagnolo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadDialog(false)}
                    data-testid="button-cancel"
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    data-testid="button-submit"
                  >
                    {uploadMutation.isPending ? "Elaborazione..." : "Carica"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                Documenti Totali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDocuments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-green-500" />
                Documenti Elaborati
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{processedDocs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                Chunks Totali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalChunks}</div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Documenti Knowledge Base</CardTitle>
            <CardDescription>
              Documenti scientifici utilizzati per arricchire le risposte AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`document-${doc.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{doc.title}</h3>
                        <Badge variant={doc.status === 'processed' ? 'default' : 'secondary'}>
                          {doc.status === 'processed' ? 'Elaborato' : 'In elaborazione'}
                        </Badge>
                        {doc.category && (
                          <Badge variant="outline">{doc.category}</Badge>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {doc.fileType.toUpperCase()}
                        </span>
                        <span>{(doc.fileSize / 1024).toFixed(2)} KB</span>
                        <span>{doc.chunksCount || 0} chunks</span>
                        <span>{doc.language.toUpperCase()}</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString('it-IT')}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${doc.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nessun documento nel knowledge base</p>
                <p className="text-sm mt-1">Carica il primo documento per iniziare</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
