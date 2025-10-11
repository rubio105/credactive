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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUp, FileText, Trash2, Database, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface MedicalKnowledgeDocument {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  language: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

export function AdminKnowledgeBase() {
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadLanguage, setUploadLanguage] = useState("it");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents, isLoading: docsLoading } = useQuery<MedicalKnowledgeDocument[]>({
    queryKey: ["/api/admin/knowledge-base"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/admin/knowledge-base/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-base"] });
      toast({ title: "Documento eliminato con successo" });
    },
    onError: (error: any) => {
      toast({ title: "Errore eliminazione: " + error.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle.trim()) {
      toast({ title: "Titolo e file sono obbligatori", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('title', uploadTitle);
    formData.append('description', uploadDescription);
    formData.append('category', uploadCategory);
    formData.append('language', uploadLanguage);

    try {
      const response = await fetch('/api/admin/knowledge-base/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-base"] });
      toast({ 
        title: "Documento caricato con successo!", 
        description: `${result.chunksCreated} chunks creati e indicizzati`
      });
      
      setUploadDialogOpen(false);
      setUploadTitle("");
      setUploadDescription("");
      setUploadCategory("");
      setUploadLanguage("it");
      setSelectedFile(null);
    } catch (error: any) {
      toast({ 
        title: "Errore upload", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Medical Knowledge Base (RAG System)
              </CardTitle>
              <CardDescription className="mt-2">
                Upload documenti scientifici per arricchire l'AI con conoscenza medica evidence-based.
                I documenti vengono automaticamente processati, chunked e vettorizzati per semantic search.
              </CardDescription>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)} data-testid="button-upload-document">
              <FileUp className="mr-2 h-4 w-4" />
              Carica Documento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {docsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : documents && documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dimensione</TableHead>
                  <TableHead>Lingua</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <tr key={doc.id} data-testid={`row-document-${doc.id}`}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{doc.title}</div>
                        {doc.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {doc.description.length > 60 
                              ? doc.description.substring(0, 60) + '...' 
                              : doc.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.category ? (
                        <Badge variant="outline">{doc.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{doc.fileType.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(doc.fileSize)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.language}</Badge>
                    </TableCell>
                    <TableCell>
                      {doc.status === 'processed' ? (
                        <Badge variant="default" className="bg-green-500">Processed</Badge>
                      ) : (
                        <Badge variant="secondary">Processing</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true, locale: it })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${doc.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </tr>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nessun documento</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Inizia caricando il primo documento scientifico
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Carica Documento Scientifico</DialogTitle>
            <DialogDescription>
              Formati supportati: PDF, TXT, MD. Il documento sarà automaticamente processato e vettorizzato per RAG.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="upload-title">Titolo *</Label>
              <Input
                id="upload-title"
                placeholder="es. Linee guida diabete mellito"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                data-testid="input-document-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-description">Descrizione</Label>
              <Textarea
                id="upload-description"
                placeholder="Breve descrizione del contenuto scientifico..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={3}
                data-testid="textarea-document-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upload-category">Categoria</Label>
                <Input
                  id="upload-category"
                  placeholder="es. Cardiologia"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  data-testid="input-document-category"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-language">Lingua</Label>
                <Select value={uploadLanguage} onValueChange={setUploadLanguage}>
                  <SelectTrigger data-testid="select-document-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-file">File Documento *</Label>
              <Input
                id="upload-file"
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileChange}
                data-testid="input-document-file"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Annulla
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !uploadTitle.trim()}
              data-testid="button-submit-upload"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Carica e Processa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
