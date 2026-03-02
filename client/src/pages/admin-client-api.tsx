import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, ToggleLeft, ToggleRight, Key, Globe, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminClientApiPage() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientName: "",
    assignedDoctorId: "",
    assignedOperatorId: "",
    notes: "",
  });

  const { data: keys = [], isLoading: keysLoading } = useQuery<any[]>({
    queryKey: ["/api/client/admin/keys"],
  });

  const { data: submissions = [], isLoading: subsLoading } = useQuery<any[]>({
    queryKey: ["/api/client/admin/submissions"],
  });

  const { data: reportDoctors = [] } = useQuery<any[]>({
    queryKey: ["/api/report-documents/admin/doctors"],
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const operators = allUsers.filter((u: any) => u.isReportOperator);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/client/admin/keys", data);
      return res.json();
    },
    onSuccess: (data) => {
      setNewKey(data.apiKey);
      queryClient.invalidateQueries({ queryKey: ["/api/client/admin/keys"] });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile creare la chiave", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await apiRequest("PATCH", `/api/client/admin/keys/${keyId}/toggle`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/admin/keys"] });
      toast({ title: "Aggiornato", description: "Stato API key modificato" });
    },
  });

  const handleCreate = () => {
    if (!form.clientName || !form.assignedDoctorId || !form.assignedOperatorId) {
      toast({ title: "Campi mancanti", description: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiato!", description: "Chiave copiata negli appunti" });
  };

  const statusMap: Record<string, string> = {
    processing: "Elaborazione AI",
    pending_review: "Attesa revisione",
    in_review: "In revisione",
    pending_signature: "Attesa firma",
    signed: "Firmato",
    rejected: "Rifiutato",
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Key className="h-6 w-6 text-blue-600" />
            API Client Esterni
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Gestisci le API key per i clienti B2B che integrano il sistema Prohmed
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setNewKey(null); setForm({ clientName: "", assignedDoctorId: "", assignedOperatorId: "", notes: "" }); } }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-api-key" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuova API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crea nuova API Key cliente</DialogTitle>
            </DialogHeader>

            {newKey ? (
              <div className="space-y-4">
                <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    API Key creata con successo. Copiala ora, non verrà mostrata di nuovo.
                  </AlertDescription>
                </Alert>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm break-all">
                  {newKey}
                </div>
                <Button
                  data-testid="button-copy-api-key"
                  className="w-full"
                  onClick={() => copyToClipboard(newKey)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copia API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Nome cliente *</Label>
                  <Input
                    data-testid="input-client-name"
                    placeholder="Es: Clinica Rossi srl"
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Medico refertatore assegnato *</Label>
                  <Select value={form.assignedDoctorId} onValueChange={(v) => setForm({ ...form, assignedDoctorId: v })}>
                    <SelectTrigger data-testid="select-doctor">
                      <SelectValue placeholder="Seleziona medico" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportDoctors.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>
                          Dr. {d.firstName} {d.lastName} {d.specialization ? `- ${d.specialization}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Operatore assegnato *</Label>
                  <Select value={form.assignedOperatorId} onValueChange={(v) => setForm({ ...form, assignedOperatorId: v })}>
                    <SelectTrigger data-testid="select-operator">
                      <SelectValue placeholder="Seleziona operatore" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((o: any) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.firstName} {o.lastName} ({o.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Note (opzionale)</Label>
                  <Textarea
                    data-testid="input-notes"
                    placeholder="Note interne..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                  />
                </div>
                <Button
                  data-testid="button-confirm-create"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creazione..." : "Crea API Key"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">API Keys attive</h2>
        {keysLoading ? (
          <p className="text-gray-400">Caricamento...</p>
        ) : keys.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-gray-400">
              <Key className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Nessuna API key creata</p>
            </CardContent>
          </Card>
        ) : (
          keys.map((k: any) => (
            <Card key={k.id} data-testid={`card-api-key-${k.id}`} className={k.isActive ? "" : "opacity-60"}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{k.clientName}</CardTitle>
                    <Badge variant={k.isActive ? "default" : "secondary"} className={k.isActive ? "bg-green-100 text-green-700" : ""}>
                      {k.isActive ? "Attiva" : "Disabilitata"}
                    </Badge>
                  </div>
                  <Button
                    data-testid={`button-toggle-${k.id}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMutation.mutate(k.id)}
                    disabled={toggleMutation.isPending}
                  >
                    {k.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    <span className="ml-1 text-xs">{k.isActive ? "Disabilita" : "Abilita"}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium w-24">API Key:</span>
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
                    {k.apiKey.slice(0, 12)}••••••••••••
                  </code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(k.apiKey)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {k.webhookSecret && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium w-24">Webhook secret:</span>
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
                      {k.webhookSecret.slice(0, 8)}••••••••
                    </code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(k.webhookSecret)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium w-24">Creata il:</span>
                  <span>{new Date(k.createdAt).toLocaleDateString("it-IT")}</span>
                </div>
                {k.lastUsedAt && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium w-24">Ultimo uso:</span>
                    <span>{new Date(k.lastUsedAt).toLocaleString("it-IT")}</span>
                  </div>
                )}
                {k.notes && (
                  <div className="flex items-start gap-2">
                    <span className="font-medium w-24">Note:</span>
                    <span className="text-gray-500">{k.notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Documenti ricevuti via API</h2>
        {subsLoading ? (
          <p className="text-gray-400">Caricamento...</p>
        ) : submissions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-gray-400">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Nessun documento ricevuto via API</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">ID Esterno</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Report ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Webhook URL</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Webhook inviato</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Tentativi</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {submissions.map((s: any) => (
                  <tr key={s.id} data-testid={`row-submission-${s.id}`} className="bg-white dark:bg-gray-900">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.clientExternalId || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.reportDocumentId?.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{s.webhookUrl}</td>
                    <td className="px-4 py-3">
                      {s.webhookSuccess ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> Sì
                        </span>
                      ) : s.webhookAttempts > 0 ? (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertCircle className="h-3 w-3" /> Fallito
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock className="h-3 w-3" /> In attesa
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{s.webhookAttempts}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString("it-IT")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
