import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Mail, Plus, Send, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface EmailTemplate {
  id: string;
  name: string;
  code: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  isActive: boolean;
}

export default function AdminMailPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState("");
  
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    code: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    isActive: true
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
    enabled: !!(user as any)?.isAdmin,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof newTemplate) => {
      return apiRequest("/api/admin/email-templates", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setShowCreateDialog(false);
      setNewTemplate({
        name: "",
        code: "",
        subject: "",
        htmlContent: "",
        textContent: "",
        isActive: true
      });
      toast({
        title: "Template creato",
        description: "Il template email è stato creato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile creare il template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmailTemplate> }) => {
      return apiRequest(`/api/admin/email-templates/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setShowEditDialog(false);
      setEditingTemplate(null);
      toast({
        title: "Template aggiornato",
        description: "Il template è stato aggiornato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/email-templates/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({
        title: "Template eliminato",
        description: "Il template è stato eliminato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il template",
        variant: "destructive",
      });
    },
  });

  const sendTestMutation = useMutation({
    mutationFn: async ({ templateId, email }: { templateId: string; email: string }) => {
      return apiRequest(`/api/admin/email-templates/${templateId}/test`, "POST", {
        testEmail: email,
        variables: {
          firstName: "Test",
          lastName: "User",
          email: email
        }
      });
    },
    onSuccess: () => {
      setShowTestDialog(false);
      setTestEmail("");
      toast({
        title: "Email di test inviata",
        description: "Controlla la casella di posta",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile inviare l'email di test",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
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

  const activeTemplates = templates.filter(t => t.isActive).length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestione Template Email</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Template email transazionali via Brevo</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-template">
                <Plus className="w-4 h-4 mr-2" />
                Crea Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crea Nuovo Template Email</DialogTitle>
                <DialogDescription>
                  Crea un template personalizzato per email transazionali
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Template *</Label>
                    <Input
                      id="name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="es: Benvenuto Utente"
                      data-testid="input-template-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Codice Template *</Label>
                    <Input
                      id="code"
                      value={newTemplate.code}
                      onChange={(e) => setNewTemplate({ ...newTemplate, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      placeholder="es: welcome_user"
                      data-testid="input-template-code"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Oggetto Email *</Label>
                  <Input
                    id="subject"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    placeholder="es: Benvenuto in CIRY, {{firstName}}!"
                    data-testid="input-subject"
                  />
                  <p className="text-xs text-muted-foreground">
                    Usa {"{{"} variabili {"}}"} come: firstName, lastName, email
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="htmlContent">Contenuto HTML *</Label>
                  <Textarea
                    id="htmlContent"
                    value={newTemplate.htmlContent}
                    onChange={(e) => setNewTemplate({ ...newTemplate, htmlContent: e.target.value })}
                    placeholder="<h1>Ciao {{firstName}}</h1>..."
                    rows={10}
                    data-testid="input-html-content"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textContent">Contenuto Testo (opzionale)</Label>
                  <Textarea
                    id="textContent"
                    value={newTemplate.textContent}
                    onChange={(e) => setNewTemplate({ ...newTemplate, textContent: e.target.value })}
                    placeholder="Ciao {{firstName}}..."
                    rows={6}
                    data-testid="input-text-content"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={newTemplate.isActive}
                    onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, isActive: checked })}
                    data-testid="switch-is-active"
                  />
                  <Label htmlFor="isActive">Template Attivo</Label>
                </div>
                <Button
                  className="w-full"
                  onClick={() => createTemplateMutation.mutate(newTemplate)}
                  disabled={!newTemplate.name || !newTemplate.code || !newTemplate.subject || !newTemplate.htmlContent || createTemplateMutation.isPending}
                  data-testid="button-submit-template"
                >
                  {createTemplateMutation.isPending ? "Creazione..." : "Crea Template"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Template Totali</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
                <Mail className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Template Attivi</p>
                  <p className="text-2xl font-bold">{activeTemplates}</p>
                </div>
                <Mail className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Template Email</CardTitle>
            <CardDescription>Gestisci template per email transazionali</CardDescription>
          </CardHeader>
          <CardContent>
            {templatesLoading ? (
              <p className="text-center text-muted-foreground py-8">Caricamento...</p>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nessun template creato</p>
                <p className="text-sm text-muted-foreground mt-1">Crea il primo template per iniziare</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Codice</TableHead>
                      <TableHead>Oggetto</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id} data-testid={`template-row-${template.id}`}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{template.code}</code>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                        <TableCell>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Attivo" : "Inattivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTemplate(template);
                                setShowTestDialog(true);
                              }}
                              data-testid={`button-test-${template.id}`}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTemplate(template);
                                setShowEditDialog(true);
                              }}
                              data-testid={`button-edit-${template.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Sei sicuro di voler eliminare il template "${template.name}"?`)) {
                                  deleteTemplateMutation.mutate(template.id);
                                }
                              }}
                              data-testid={`button-delete-${template.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Template Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Template</DialogTitle>
              <DialogDescription>
                Modifica il template email
              </DialogDescription>
            </DialogHeader>
            {editingTemplate && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Oggetto</Label>
                  <Input
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contenuto HTML</Label>
                  <Textarea
                    value={editingTemplate.htmlContent}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, htmlContent: e.target.value })}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingTemplate.isActive}
                    onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, isActive: checked })}
                  />
                  <Label>Template Attivo</Label>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    updateTemplateMutation.mutate({
                      id: editingTemplate.id,
                      updates: {
                        name: editingTemplate.name,
                        subject: editingTemplate.subject,
                        htmlContent: editingTemplate.htmlContent,
                        isActive: editingTemplate.isActive
                      }
                    });
                  }}
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Test Email Dialog */}
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invia Email di Test</DialogTitle>
              <DialogDescription>
                Invia una email di prova a un indirizzo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail">Indirizzo Email</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  data-testid="input-test-email"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (editingTemplate) {
                    sendTestMutation.mutate({
                      templateId: editingTemplate.id,
                      email: testEmail
                    });
                  }
                }}
                disabled={!testEmail || sendTestMutation.isPending}
                data-testid="button-send-test"
              >
                {sendTestMutation.isPending ? "Invio..." : "Invia Email di Test"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
