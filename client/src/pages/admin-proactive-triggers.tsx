import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, Pencil, Trash2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface ProactiveTrigger {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  condition: any;
  action: any;
  targetAudience: string;
  isActive: boolean;
  frequency: string | null;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProactiveTriggersPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<ProactiveTrigger | null>(null);

  const [newTrigger, setNewTrigger] = useState({
    name: "",
    description: "",
    triggerType: "wearable_anomaly",
    condition: "",
    action: "",
    targetAudience: "all",
    frequency: "none",
    isActive: true,
  });

  const { data: triggers = [], isLoading: triggersLoading } = useQuery<ProactiveTrigger[]>({
    queryKey: ["/api/admin/proactive-triggers"],
    enabled: !!(user as any)?.isAdmin,
  });

  const createTriggerMutation = useMutation({
    mutationFn: async (data: typeof newTrigger) => {
      let conditionObj, actionObj;
      try {
        conditionObj = JSON.parse(data.condition || "{}");
      } catch {
        throw new Error("Condition must be valid JSON");
      }
      try {
        actionObj = JSON.parse(data.action || "{}");
      } catch {
        throw new Error("Action must be valid JSON");
      }

      return apiRequest("/api/admin/proactive-triggers", "POST", {
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        condition: conditionObj,
        action: actionObj,
        targetAudience: data.targetAudience,
        frequency: data.frequency === "none" ? null : data.frequency,
        isActive: data.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/proactive-triggers"] });
      setShowCreateDialog(false);
      setNewTrigger({
        name: "",
        description: "",
        triggerType: "wearable_anomaly",
        condition: "",
        action: "",
        targetAudience: "all",
        frequency: "none",
        isActive: true,
      });
      toast({
        title: "Trigger creato",
        description: "Il trigger proattivo è stato creato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare il trigger",
        variant: "destructive",
      });
    },
  });

  const updateTriggerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProactiveTrigger> }) => {
      return apiRequest(`/api/admin/proactive-triggers/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/proactive-triggers"] });
      setShowEditDialog(false);
      setEditingTrigger(null);
      toast({
        title: "Trigger aggiornato",
        description: "Il trigger proattivo è stato aggiornato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il trigger",
        variant: "destructive",
      });
    },
  });

  const deleteTriggerMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/proactive-triggers/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/proactive-triggers"] });
      toast({
        title: "Trigger eliminato",
        description: "Il trigger proattivo è stato eliminato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il trigger",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest(`/api/admin/proactive-triggers/${id}`, "PATCH", { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/proactive-triggers"] });
      toast({
        title: isActive ? "Trigger attivato" : "Trigger disattivato",
        description: "Lo stato del trigger è stato aggiornato",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il trigger",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (trigger: ProactiveTrigger) => {
    setEditingTrigger(trigger);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo trigger?")) {
      await deleteTriggerMutation.mutateAsync(id);
    }
  };

  const isActive = editingTrigger ? editingTrigger.isActive : false;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!(user as any)?.isAdmin) {
    return (
      <AdminLayout>
        <Card>
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>
              Non hai i permessi necessari per accedere a questa pagina.
            </CardDescription>
          </CardHeader>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trigger Proattivi</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Configura trigger automatici per monitoraggio proattivo della salute
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-trigger">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Trigger
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crea Nuovo Trigger</DialogTitle>
                <DialogDescription>
                  Configura un nuovo trigger proattivo per il monitoraggio della salute
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newTrigger.name}
                    onChange={(e) => setNewTrigger({ ...newTrigger, name: e.target.value })}
                    placeholder="es. Pressione Alta Alert"
                    data-testid="input-trigger-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    value={newTrigger.description}
                    onChange={(e) => setNewTrigger({ ...newTrigger, description: e.target.value })}
                    placeholder="Descrizione del trigger..."
                    data-testid="textarea-trigger-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="triggerType">Tipo Trigger</Label>
                    <Select
                      value={newTrigger.triggerType}
                      onValueChange={(value) => setNewTrigger({ ...newTrigger, triggerType: value })}
                    >
                      <SelectTrigger data-testid="select-trigger-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wearable_anomaly">Anomalia Wearable</SelectItem>
                        <SelectItem value="periodic_checkup">Checkup Periodico</SelectItem>
                        <SelectItem value="inactivity">Inattività</SelectItem>
                        <SelectItem value="missed_medication">Farmaco Mancato</SelectItem>
                        <SelectItem value="custom">Personalizzato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target</Label>
                    <Select
                      value={newTrigger.targetAudience}
                      onValueChange={(value) => setNewTrigger({ ...newTrigger, targetAudience: value })}
                    >
                      <SelectTrigger data-testid="select-target-audience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="specific_users">Utenti Specifici</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequenza (opzionale)</Label>
                  <Select
                    value={newTrigger.frequency}
                    onValueChange={(value) => setNewTrigger({ ...newTrigger, frequency: value })}
                  >
                    <SelectTrigger data-testid="select-frequency">
                      <SelectValue placeholder="Nessuna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuna</SelectItem>
                      <SelectItem value="daily">Giornaliera</SelectItem>
                      <SelectItem value="weekly">Settimanale</SelectItem>
                      <SelectItem value="monthly">Mensile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condizione (JSON)</Label>
                  <Textarea
                    id="condition"
                    value={newTrigger.condition}
                    onChange={(e) => setNewTrigger({ ...newTrigger, condition: e.target.value })}
                    placeholder='{"type": "blood_pressure_high", "threshold": 140}'
                    className="font-mono text-sm"
                    rows={4}
                    data-testid="textarea-condition"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action">Azione (JSON)</Label>
                  <Textarea
                    id="action"
                    value={newTrigger.action}
                    onChange={(e) => setNewTrigger({ ...newTrigger, action: e.target.value })}
                    placeholder='{"type": "notification", "channels": ["whatsapp", "push"]}'
                    className="font-mono text-sm"
                    rows={4}
                    data-testid="textarea-action"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={newTrigger.isActive}
                    onCheckedChange={(checked) => setNewTrigger({ ...newTrigger, isActive: checked })}
                    data-testid="switch-is-active"
                  />
                  <Label htmlFor="isActive">Attivo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel-create"
                >
                  Annulla
                </Button>
                <Button
                  onClick={() => createTriggerMutation.mutate(newTrigger)}
                  disabled={createTriggerMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createTriggerMutation.isPending ? "Creazione..." : "Crea Trigger"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Trigger Configurati
            </CardTitle>
            <CardDescription>
              Lista dei trigger proattivi per il monitoraggio automatico della salute
            </CardDescription>
          </CardHeader>
          <CardContent>
            {triggersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : triggers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nessun trigger configurato</p>
                <p className="text-sm mt-2">Crea il tuo primo trigger proattivo</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Frequenza</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Ultimo Trigger</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {triggers.map((trigger) => (
                    <TableRow key={trigger.id} data-testid={`trigger-row-${trigger.id}`}>
                      <TableCell className="font-medium">{trigger.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{trigger.triggerType}</Badge>
                      </TableCell>
                      <TableCell>{trigger.targetAudience}</TableCell>
                      <TableCell>{trigger.frequency || "-"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={trigger.isActive}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: trigger.id, isActive: checked })
                          }
                          data-testid={`switch-active-${trigger.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        {trigger.lastTriggeredAt
                          ? format(new Date(trigger.lastTriggeredAt), "dd/MM/yyyy HH:mm")
                          : "Mai"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(trigger)}
                            data-testid={`button-edit-${trigger.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(trigger.id)}
                            data-testid={`button-delete-${trigger.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifica Trigger</DialogTitle>
              <DialogDescription>
                Aggiorna la configurazione del trigger proattivo
              </DialogDescription>
            </DialogHeader>
            {editingTrigger && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editingTrigger.name}
                    onChange={(e) =>
                      setEditingTrigger({ ...editingTrigger, name: e.target.value })
                    }
                    data-testid="input-edit-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrizione</Label>
                  <Textarea
                    value={editingTrigger.description || ""}
                    onChange={(e) =>
                      setEditingTrigger({ ...editingTrigger, description: e.target.value })
                    }
                    data-testid="textarea-edit-description"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      setEditingTrigger({ ...editingTrigger, isActive: checked })
                    }
                    data-testid="switch-edit-active"
                  />
                  <Label>Attivo</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingTrigger(null);
                }}
                data-testid="button-cancel-edit"
              >
                Annulla
              </Button>
              <Button
                onClick={() => {
                  if (editingTrigger) {
                    updateTriggerMutation.mutate({
                      id: editingTrigger.id,
                      data: {
                        name: editingTrigger.name,
                        description: editingTrigger.description,
                        isActive: editingTrigger.isActive,
                      },
                    });
                  }
                }}
                disabled={updateTriggerMutation.isPending}
                data-testid="button-submit-edit"
              >
                {updateTriggerMutation.isPending ? "Aggiornamento..." : "Aggiorna Trigger"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
