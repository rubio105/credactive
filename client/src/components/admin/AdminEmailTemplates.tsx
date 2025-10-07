import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, Edit, Trash2, Send, RefreshCw, Code, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string | null;
  variables?: string[] | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function AdminEmailTemplates() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testVariables, setTestVariables] = useState("{}");
  const [previewMode, setPreviewMode] = useState<"html" | "code">("html");

  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
  });

  const initDefaults = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/admin/email-templates/init-defaults", "POST", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({
        title: "Template Inizializzati",
        description: "I template predefiniti sono stati creati con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inizializzare i template",
        variant: "destructive",
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<EmailTemplate> }) => {
      const res = await apiRequest(`/api/admin/email-templates/${data.id}`, "PATCH", data.updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      toast({
        title: "Template Aggiornato",
        description: "Il template è stato aggiornato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il template",
        variant: "destructive",
      });
    },
  });

  const testTemplate = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) return;
      const variables = JSON.parse(testVariables || "{}");
      const res = await apiRequest(`/api/admin/email-templates/${selectedTemplate.id}/test`, "POST", {
        testEmail,
        variables,
      });
      return await res.json();
    },
    onSuccess: () => {
      setIsTestDialogOpen(false);
      toast({
        title: "Email di Test Inviata",
        description: `Email inviata con successo a ${testEmail}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare l'email di test",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditDialogOpen(true);
  };

  const handleTest = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTestEmail("");
    setTestVariables(JSON.stringify({
      firstName: "Mario",
      email: "test@example.com",
      verificationCode: "123456",
      resetLink: "https://example.com/reset",
    }, null, 2));
    setIsTestDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedTemplate) return;
    updateTemplate.mutate({
      id: selectedTemplate.id,
      updates: selectedTemplate,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Caricamento template...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Template Email
              </CardTitle>
              <CardDescription>
                Gestisci i template email per la piattaforma. Usa variabili come {`{{firstName}}`}, {`{{email}}`}, ecc.
              </CardDescription>
            </div>
            <Button onClick={() => initDefaults.mutate()} disabled={initDefaults.isPending} data-testid="button-init-templates">
              <RefreshCw className="w-4 h-4 mr-2" />
              Inizializza Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!templates || templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nessun template disponibile</p>
              <Button onClick={() => initDefaults.mutate()} disabled={initDefaults.isPending}>
                Inizializza Template Predefiniti
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Codice</TableHead>
                  <TableHead>Oggetto</TableHead>
                  <TableHead>Variabili</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.code}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {template.variables?.map((v) => (
                          <Badge key={v} variant="secondary" className="text-xs">
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Badge className="bg-green-500">Attivo</Badge>
                      ) : (
                        <Badge variant="secondary">Inattivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(template)} data-testid={`button-edit-${template.code}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleTest(template)} data-testid={`button-test-${template.code}`}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Template: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Personalizza il template email. Usa variabili tipo {`{{firstName}}`} per contenuti dinamici.
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Stato Template</Label>
                <Switch
                  id="isActive"
                  checked={selectedTemplate.isActive}
                  onCheckedChange={(checked) => setSelectedTemplate({ ...selectedTemplate, isActive: checked })}
                />
              </div>

              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={selectedTemplate.name}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                  data-testid="input-template-name"
                />
              </div>

              <div>
                <Label htmlFor="subject">Oggetto Email</Label>
                <Input
                  id="subject"
                  value={selectedTemplate.subject}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                  data-testid="input-template-subject"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Input
                  id="description"
                  value={selectedTemplate.description || ""}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="htmlContent">Contenuto HTML</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={previewMode === "html" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("html")}
                    >
                      <Eye className="w-4 h-4 mr-1" /> Anteprima
                    </Button>
                    <Button
                      variant={previewMode === "code" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("code")}
                    >
                      <Code className="w-4 h-4 mr-1" /> Codice
                    </Button>
                  </div>
                </div>
                {previewMode === "code" ? (
                  <Textarea
                    id="htmlContent"
                    value={selectedTemplate.htmlContent}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, htmlContent: e.target.value })}
                    rows={15}
                    className="font-mono text-sm"
                    data-testid="textarea-html-content"
                  />
                ) : (
                  <div className="border rounded-md p-4 bg-gray-50 max-h-96 overflow-auto">
                    <div dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }} />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="textContent">Contenuto Testo (fallback)</Label>
                <Textarea
                  id="textContent"
                  value={selectedTemplate.textContent || ""}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, textContent: e.target.value })}
                  rows={5}
                  data-testid="textarea-text-content"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annulla
                </Button>
                <Button onClick={handleSave} disabled={updateTemplate.isPending} data-testid="button-save-template">
                  {updateTemplate.isPending ? "Salvataggio..." : "Salva"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Test Email: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Invia un'email di test per verificare il template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="testEmail">Email Destinatario</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                data-testid="input-test-email"
              />
            </div>

            <div>
              <Label htmlFor="testVariables">Variabili (JSON)</Label>
              <Textarea
                id="testVariables"
                value={testVariables}
                onChange={(e) => setTestVariables(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                data-testid="textarea-test-variables"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Variabili disponibili: {selectedTemplate?.variables?.join(", ")}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={() => testTemplate.mutate()} disabled={testTemplate.isPending || !testEmail} data-testid="button-send-test">
                {testTemplate.isPending ? "Invio..." : "Invia Test"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
