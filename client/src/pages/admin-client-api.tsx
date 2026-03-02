import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Copy, Plus, ToggleLeft, ToggleRight, Key, Globe,
  AlertCircle, CheckCircle2, Clock, BookOpen, Settings,
  ArrowRight, Shield, Zap, FileText, Send
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BASE_URL = "https://credactive.com";

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const { toast } = useToast();
  const copy = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copiato!", description: "Codice copiato negli appunti" });
  };
  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 rounded-t-lg px-4 py-2">
        <span className="text-xs text-gray-400 font-mono">{lang}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={copy}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <pre className="bg-gray-900 dark:bg-black rounded-b-lg p-4 overflow-x-auto text-xs text-green-300 font-mono leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-0.5">
        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-2 flex-shrink-0">
      {n}
    </span>
  );
}

export default function AdminClientApiPage() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
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
      setNewSecret(data.webhookSecret || null);
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

  const copyToClipboard = (text: string, label = "Copiato") => {
    navigator.clipboard.writeText(text);
    toast({ title: label, description: "Valore copiato negli appunti" });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Key className="h-6 w-6 text-blue-600" />
            API Client Esterni
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Integrazione B2B per clienti che inviano documenti da elaborare via Prohmed
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) { setNewKey(null); setNewSecret(null); setForm({ clientName: "", assignedDoctorId: "", assignedOperatorId: "", notes: "" }); }
        }}>
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
                  <AlertDescription className="text-green-700 dark:text-green-400 text-xs">
                    API Key creata. Copiala ora e consegnala al cliente: non verrà mostrata di nuovo.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">API KEY (da consegnare al cliente)</Label>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-xs break-all flex items-center justify-between gap-2">
                    <span>{newKey}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => copyToClipboard(newKey, "API Key copiata")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {newSecret && (
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">WEBHOOK SECRET (per verificare le notifiche)</Label>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-xs break-all flex items-center justify-between gap-2">
                      <span>{newSecret}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => copyToClipboard(newSecret, "Webhook secret copiato")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                <Button data-testid="button-copy-api-key" className="w-full" onClick={() => copyToClipboard(newKey, "API Key copiata")}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copia API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Nome cliente *</Label>
                  <Input data-testid="input-client-name" placeholder="Es: Clinica Rossi srl" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
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
                          Dr. {d.firstName} {d.lastName}{d.specialization ? ` - ${d.specialization}` : ""}
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
                  <Label>Note interne (opzionale)</Label>
                  <Textarea data-testid="input-notes" placeholder="Note interne..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>
                <Button data-testid="button-confirm-create" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creazione..." : "Crea API Key"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keys" data-testid="tab-keys">
            <Settings className="h-4 w-4 mr-2" />
            Gestione Keys
          </TabsTrigger>
          <TabsTrigger value="submissions" data-testid="tab-submissions">
            <Globe className="h-4 w-4 mr-2" />
            Documenti ricevuti
          </TabsTrigger>
          <TabsTrigger value="docs" data-testid="tab-docs">
            <BookOpen className="h-4 w-4 mr-2" />
            Guida API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4 mt-6">
          {keysLoading ? (
            <p className="text-gray-400 text-sm">Caricamento...</p>
          ) : keys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-gray-400">
                <Key className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nessuna API key creata. Clicca "Nuova API Key" per iniziare.</p>
              </CardContent>
            </Card>
          ) : (
            keys.map((k: any) => (
              <Card key={k.id} data-testid={`card-api-key-${k.id}`} className={k.isActive ? "" : "opacity-60"}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">{k.clientName}</CardTitle>
                      <Badge className={k.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500"}>
                        {k.isActive ? "Attiva" : "Disabilitata"}
                      </Badge>
                    </div>
                    <Button data-testid={`button-toggle-${k.id}`} variant="ghost" size="sm" onClick={() => toggleMutation.mutate(k.id)} disabled={toggleMutation.isPending}>
                      {k.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                      <span className="ml-1 text-xs">{k.isActive ? "Disabilita" : "Abilita"}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {[
                    { label: "API Key", value: k.apiKey.slice(0, 16) + "••••••••••••", full: k.apiKey },
                    k.webhookSecret && { label: "Webhook Secret", value: k.webhookSecret.slice(0, 8) + "••••••••", full: k.webhookSecret },
                  ].filter(Boolean).map((item: any) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="font-medium w-32">{item.label}:</span>
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">{item.value}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(item.full, `${item.label} copiato`)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <span className="font-medium w-32">Creata il:</span>
                    <span className="text-xs">{new Date(k.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}</span>
                  </div>
                  {k.lastUsedAt && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium w-32">Ultimo uso:</span>
                      <span className="text-xs">{new Date(k.lastUsedAt).toLocaleString("it-IT")}</span>
                    </div>
                  )}
                  {k.notes && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium w-32">Note:</span>
                      <span className="text-xs text-gray-500">{k.notes}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          {subsLoading ? (
            <p className="text-gray-400 text-sm">Caricamento...</p>
          ) : submissions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-gray-400">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nessun documento ricevuto via API esterna</p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {["ID Esterno", "Report ID", "Webhook URL", "Webhook", "Tentativi", "Data"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {submissions.map((s: any) => (
                    <tr key={s.id} data-testid={`row-submission-${s.id}`} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.clientExternalId || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.reportDocumentId?.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{s.webhookUrl}</td>
                      <td className="px-4 py-3">
                        {s.webhookSuccess
                          ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="h-3 w-3" /> Inviato</span>
                          : s.webhookAttempts > 0
                          ? <span className="flex items-center gap-1 text-red-500 text-xs"><AlertCircle className="h-3 w-3" /> Fallito</span>
                          : <span className="flex items-center gap-1 text-gray-400 text-xs"><Clock className="h-3 w-3" /> In attesa</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">{s.webhookAttempts}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString("it-IT")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="docs" className="mt-6 space-y-10">

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">Guida all'integrazione API Prohmed</h2>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Questa guida spiega come integrare il sistema di refertazione Prohmed nella tua applicazione.
              Il cliente invia un documento medico, Prohmed lo elabora con AI, il medico lo revisa e firma, e il PDF firmato
              viene consegnato automaticamente al tuo server tramite webhook.
            </p>
          </div>

          <div>
            <SectionTitle icon={ArrowRight} title="Flusso completo" subtitle="Come funziona il processo end-to-end" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start">
              {[
                { n: 1, label: "Carica documento", desc: "Il cliente invia file + dati paziente via API" },
                { n: 2, label: "Elaborazione AI", desc: "Prohmed analizza il documento con OCR e genera una bozza" },
                { n: 3, label: "Revisione medico", desc: "Il medico rivede e corregge il referto" },
                { n: 4, label: "Firma OTP", desc: "Il medico firma digitalmente con codice OTP" },
                { n: 5, label: "Webhook PDF", desc: "Il PDF firmato viene inviato al tuo server" },
              ].map((step, i) => (
                <div key={step.n} className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mb-2">{step.n}</div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{step.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
                  {i < 4 && <ArrowRight className="h-4 w-4 text-gray-300 mt-2 hidden md:block" />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle icon={Shield} title="Autenticazione" subtitle="Come identificarsi in ogni richiesta API" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Ogni richiesta deve includere l'header <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">Authorization</code> con la API key fornita da Prohmed.
              Le chiavi iniziano sempre con <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">pmk_</code>.
            </p>
            <CodeBlock lang="http" code={`Authorization: Bearer pmk_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6`} />
            <Alert className="mt-3 border-amber-300 bg-amber-50 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">
                Conserva la API key in modo sicuro. Non includerla mai in codice frontend pubblico. Usala solo server-to-server.
              </AlertDescription>
            </Alert>
          </div>

          <div>
            <SectionTitle icon={FileText} title="Endpoint 1 — Caricamento documento" subtitle={`POST ${BASE_URL}/api/client/reports/upload`} />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Carica un documento medico da elaborare. La richiesta deve essere <strong>multipart/form-data</strong>.
              Il sistema risponde immediatamente con un <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">report_id</code> e inizia l'elaborazione in background.
            </p>

            <div className="space-y-3 mb-5">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Parametri richiesta</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {["Campo", "Tipo", "Obbligatorio", "Descrizione"].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {[
                      ["file", "File (PDF, JPG, PNG)", "SI", "Il documento medico da refertare. Max 10MB."],
                      ["patient_name", "Stringa", "SI", "Nome e cognome del paziente. Es: Mario Rossi"],
                      ["webhook_url", "URL HTTPS", "SI", "URL del tuo server dove ricevere il PDF firmato."],
                      ["patient_fiscal_code", "Stringa", "No", "Codice fiscale del paziente. Es: RSSMRA80A01H501U"],
                      ["patient_date_of_birth", "Data (YYYY-MM-DD)", "No", "Data di nascita. Es: 1980-01-01"],
                      ["external_id", "Stringa", "No", "Il tuo ID interno per tracciare il documento nel tuo sistema."],
                    ].map(([field, type, req, desc]) => (
                      <tr key={field} className="bg-white dark:bg-gray-900">
                        <td className="px-3 py-2 font-mono text-blue-600 dark:text-blue-400">{field}</td>
                        <td className="px-3 py-2 text-gray-500">{type}</td>
                        <td className="px-3 py-2">
                          <Badge className={req === "SI" ? "bg-red-100 text-red-700 text-xs" : "bg-gray-100 text-gray-500 text-xs"}>{req}</Badge>
                        </td>
                        <td className="px-3 py-2 text-gray-500">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="h-8">
                {["curl", "python", "php", "node"].map(l => (
                  <TabsTrigger key={l} value={l} className="text-xs px-3 py-1">{l === "node" ? "Node.js" : l.charAt(0).toUpperCase() + l.slice(1)}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="curl" className="mt-3">
                <CodeBlock lang="bash — cURL" code={`curl -X POST "${BASE_URL}/api/client/reports/upload" \\
  -H "Authorization: Bearer pmk_LA_TUA_API_KEY" \\
  -F "file=@/percorso/documento.pdf" \\
  -F "patient_name=Mario Rossi" \\
  -F "patient_fiscal_code=RSSMRA80A01H501U" \\
  -F "patient_date_of_birth=1980-01-01" \\
  -F "webhook_url=https://tuo-server.com/webhook/prohmed" \\
  -F "external_id=DOC-2026-00123"`} />
              </TabsContent>

              <TabsContent value="python" className="mt-3">
                <CodeBlock lang="python" code={`import requests

API_KEY = "pmk_LA_TUA_API_KEY"
BASE_URL = "${BASE_URL}"

def upload_document(file_path, patient_name, webhook_url, external_id=None,
                    fiscal_code=None, date_of_birth=None):
    """
    Carica un documento medico su Prohmed per la refertazione.
    
    Args:
        file_path: Percorso del file PDF o immagine
        patient_name: Nome completo del paziente
        webhook_url: URL dove ricevere il PDF firmato
        external_id: ID interno opzionale per tracciare il documento
    
    Returns:
        dict con report_id e status
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    
    data = {
        "patient_name": patient_name,
        "webhook_url": webhook_url,
    }
    
    if external_id:
        data["external_id"] = external_id
    if fiscal_code:
        data["patient_fiscal_code"] = fiscal_code
    if date_of_birth:
        data["patient_date_of_birth"] = date_of_birth
    
    with open(file_path, "rb") as f:
        files = {"file": (file_path.split("/")[-1], f, "application/pdf")}
        response = requests.post(
            f"{BASE_URL}/api/client/reports/upload",
            headers=headers,
            data=data,
            files=files
        )
    
    response.raise_for_status()
    return response.json()


# Esempio di utilizzo
result = upload_document(
    file_path="/documenti/analisi_sangue.pdf",
    patient_name="Mario Rossi",
    webhook_url="https://tuo-server.com/webhook/prohmed",
    external_id="DOC-2026-00123",
    fiscal_code="RSSMRA80A01H501U",
    date_of_birth="1980-01-01"
)

print(f"Documento caricato! ID: {result['report_id']}")
print(f"Stato: {result['status']}")
# Output: Documento caricato! ID: 550e8400-e29b-41d4-a716-446655440000
# Output: Stato: processing`} />
              </TabsContent>

              <TabsContent value="php" className="mt-3">
                <CodeBlock lang="php" code={`<?php

define('PROHMED_API_KEY', 'pmk_LA_TUA_API_KEY');
define('PROHMED_BASE_URL', '${BASE_URL}');

/**
 * Carica un documento medico su Prohmed per la refertazione.
 */
function uploadDocumentProhmed(string $filePath, string $patientName, 
                                string $webhookUrl, array $options = []): array 
{
    $cfile = new CURLFile(
        $filePath,
        mime_content_type($filePath),
        basename($filePath)
    );
    
    $postData = [
        'file'         => $cfile,
        'patient_name' => $patientName,
        'webhook_url'  => $webhookUrl,
    ];
    
    if (!empty($options['external_id']))        $postData['external_id']          = $options['external_id'];
    if (!empty($options['fiscal_code']))         $postData['patient_fiscal_code']  = $options['fiscal_code'];
    if (!empty($options['date_of_birth']))       $postData['patient_date_of_birth']= $options['date_of_birth'];
    
    $ch = curl_init(PROHMED_BASE_URL . '/api/client/reports/upload');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postData,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . PROHMED_API_KEY,
        ],
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 202) {
        throw new Exception("Errore Prohmed API: HTTP $httpCode - $response");
    }
    
    return json_decode($response, true);
}

// Esempio di utilizzo
try {
    $result = uploadDocumentProhmed(
        filePath: '/var/documenti/analisi.pdf',
        patientName: 'Mario Rossi',
        webhookUrl: 'https://tuo-server.com/webhook/prohmed',
        options: [
            'external_id'  => 'DOC-2026-00123',
            'fiscal_code'  => 'RSSMRA80A01H501U',
            'date_of_birth'=> '1980-01-01',
        ]
    );
    
    echo "Documento caricato! ID: " . $result['report_id'] . PHP_EOL;
    // Salva $result['report_id'] nel tuo database per tracciare lo stato
    
} catch (Exception $e) {
    error_log("Errore upload Prohmed: " . $e->getMessage());
}`} />
              </TabsContent>

              <TabsContent value="node" className="mt-3">
                <CodeBlock lang="javascript — Node.js" code={`const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch'); // npm install node-fetch

const API_KEY = 'pmk_LA_TUA_API_KEY';
const BASE_URL = '${BASE_URL}';

/**
 * Carica un documento medico su Prohmed per la refertazione.
 */
async function uploadDocument({ filePath, patientName, webhookUrl, 
                                externalId, fiscalCode, dateOfBirth }) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('patient_name', patientName);
  form.append('webhook_url', webhookUrl);
  
  if (externalId)   form.append('external_id', externalId);
  if (fiscalCode)   form.append('patient_fiscal_code', fiscalCode);
  if (dateOfBirth)  form.append('patient_date_of_birth', dateOfBirth);

  const response = await fetch(\`\${BASE_URL}/api/client/reports/upload\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(\`Prohmed API error: \${error.message}\`);
  }

  return response.json();
}

// Esempio di utilizzo
(async () => {
  try {
    const result = await uploadDocument({
      filePath: './documenti/analisi_sangue.pdf',
      patientName: 'Mario Rossi',
      webhookUrl: 'https://tuo-server.com/webhook/prohmed',
      externalId: 'DOC-2026-00123',
      fiscalCode: 'RSSMRA80A01H501U',
      dateOfBirth: '1980-01-01',
    });

    console.log('Documento caricato! ID:', result.report_id);
    // Salva result.report_id nel tuo DB per poter controllare lo stato
  } catch (err) {
    console.error('Errore:', err.message);
  }
})();`} />
              </TabsContent>
            </Tabs>

            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Risposta di successo (HTTP 202)</h4>
              <CodeBlock lang="json" code={`{
  "success": true,
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "external_id": "DOC-2026-00123",
  "status": "processing",
  "message": "Documento ricevuto. In elaborazione AI. Riceverai il referto firmato al webhook_url una volta completato il processo.",
  "status_url": "/api/client/reports/550e8400-e29b-41d4-a716-446655440000"
}`} />
              <p className="text-xs text-gray-500 mt-2">
                Salva il <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">report_id</code> nel tuo database.
                Ti serve per controllare lo stato e per verificare le notifiche webhook.
              </p>
            </div>
          </div>

          <div>
            <SectionTitle icon={Clock} title="Endpoint 2 — Controllo stato" subtitle={`GET ${BASE_URL}/api/client/reports/{report_id}`} />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Puoi controllare lo stato di un documento in qualsiasi momento. Utile per implementare un sistema di polling
              se preferisci non usare i webhook, o per verificare lo stato dopo una notifica.
            </p>

            <CodeBlock lang="bash — cURL" code={`curl "${BASE_URL}/api/client/reports/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer pmk_LA_TUA_API_KEY"`} />

            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Risposta</h4>
              <CodeBlock lang="json" code={`{
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "external_id": "DOC-2026-00123",
  "status": "signed",
  "status_description": "Firmato e completato",
  "patient_name": "Mario Rossi",
  "created_at": "2026-03-02T10:00:00.000Z",
  "updated_at": "2026-03-02T14:30:00.000Z",
  "signed_at": "2026-03-02T14:30:00.000Z",
  "webhook_url": "https://tuo-server.com/webhook/prohmed",
  "webhook_sent": true,
  "webhook_sent_at": "2026-03-02T14:30:05.000Z",
  "pdf_ready": true
}`} />
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {["Status", "Descrizione", "Azione richiesta"].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {[
                    ["processing", "Elaborazione AI in corso", "Attendi. L'AI sta analizzando il documento."],
                    ["pending_review", "In attesa di revisione del medico", "Attendi. Il medico deve ancora aprire il documento."],
                    ["in_review", "Il medico sta revisionando", "Attendi. Il medico sta modificando la bozza."],
                    ["pending_signature", "In attesa di firma OTP", "Attendi. Il medico ha richiesto il codice OTP."],
                    ["signed", "Firmato e completato", "Il PDF è pronto. Controlla il tuo webhook o usa l'endpoint di stato."],
                    ["rejected", "Documento rifiutato", "Contatta il supporto Prohmed per i dettagli."],
                  ].map(([status, desc, action]) => (
                    <tr key={status} className="bg-white dark:bg-gray-900">
                      <td className="px-3 py-2 font-mono text-blue-600 dark:text-blue-400">{status}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{desc}</td>
                      <td className="px-3 py-2 text-gray-500">{action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <SectionTitle icon={Send} title="Ricezione del PDF firmato (Webhook)" subtitle="Come ricevere il documento una volta firmato dal medico" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Quando il medico firma il referto, Prohmed invia automaticamente una richiesta <strong>POST</strong> al tuo <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">webhook_url</code>.
              Il PDF è incluso nel payload come <strong>Base64</strong>. Il tuo server deve rispondere con HTTP 200-299 per confermare la ricezione.
            </p>

            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Struttura del payload ricevuto</h4>
            <CodeBlock lang="json" code={`{
  "event": "report.signed",
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "external_id": "DOC-2026-00123",
  "patient_name": "Mario Rossi",
  "patient_fiscal_code": "RSSMRA80A01H501U",
  "signed_at": "2026-03-02T14:30:00.000Z",
  "pdf_filename": "referto-Mario-Rossi-1709384200000.pdf",
  "pdf_base64": "JVBERi0xLjQKJeLjz9MKMSAwIG9iagoxIDAgb2JqCjw8...",
  "pdf_size_bytes": 145231
}`} />

            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-5 mb-2">Header della richiesta webhook</h4>
            <CodeBlock lang="http" code={`POST /webhook/prohmed HTTP/1.1
Content-Type: application/json
X-Prohmed-Event: report.signed
X-Prohmed-Report-Id: 550e8400-e29b-41d4-a716-446655440000
X-Prohmed-Signature: sha256=a1b2c3d4e5f6...`} />

            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-5 mb-2">Esempio — Gestione webhook</h4>
            <Tabs defaultValue="python_webhook">
              <TabsList className="h-8">
                {[["python_webhook", "Python (Flask)"], ["php_webhook", "PHP"], ["node_webhook", "Node.js (Express)"]].map(([v, l]) => (
                  <TabsTrigger key={v} value={v} className="text-xs px-3 py-1">{l}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="python_webhook" className="mt-3">
                <CodeBlock lang="python — Flask" code={`import hmac
import hashlib
import base64
import json
from flask import Flask, request, jsonify

app = Flask(__name__)

WEBHOOK_SECRET = "il_tuo_webhook_secret"  # Ricevuto da Prohmed all'attivazione

def verify_signature(payload: bytes, signature_header: str) -> bool:
    """Verifica che la richiesta provenga davvero da Prohmed."""
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    received = signature_header.replace("sha256=", "")
    return hmac.compare_digest(expected, received)


@app.route("/webhook/prohmed", methods=["POST"])
def receive_report():
    # 1. Verifica firma di sicurezza
    signature = request.headers.get("X-Prohmed-Signature", "")
    if not verify_signature(request.get_data(), signature):
        return jsonify({"error": "Firma non valida"}), 401
    
    data = request.get_json()
    
    # 2. Controlla che sia l'evento corretto
    if data.get("event") != "report.signed":
        return jsonify({"ok": True}), 200  # Ignora altri eventi
    
    # 3. Decodifica il PDF dal Base64
    pdf_bytes = base64.b64decode(data["pdf_base64"])
    pdf_filename = data["pdf_filename"]
    
    # 4. Salva il PDF sul tuo server
    with open(f"/storage/referti/{pdf_filename}", "wb") as f:
        f.write(pdf_bytes)
    
    # 5. Aggiorna il tuo database
    report_id = data["report_id"]
    external_id = data.get("external_id")  # Il tuo ID interno
    
    # db.update("documenti", {"stato": "firmato", "pdf_path": pdf_filename}, where={"id": external_id})
    
    print(f"PDF ricevuto: {pdf_filename} | Paziente: {data['patient_name']}")
    
    # 6. Rispondi 200 per confermare la ricezione
    return jsonify({"received": True}), 200

if __name__ == "__main__":
    app.run(port=5000)`} />
              </TabsContent>

              <TabsContent value="php_webhook" className="mt-3">
                <CodeBlock lang="php" code={`<?php

define('WEBHOOK_SECRET', 'il_tuo_webhook_secret');
define('PDF_STORAGE_PATH', '/var/www/storage/referti/');

/**
 * Endpoint webhook: /webhook/prohmed.php
 * Riceve il PDF firmato da Prohmed e lo salva.
 */

// Leggi il body della richiesta
$rawBody = file_get_contents('php://input');
$data    = json_decode($rawBody, true);

// 1. Verifica firma di sicurezza
$signatureHeader = $_SERVER['HTTP_X_PROHMED_SIGNATURE'] ?? '';

if (!verifySignature($rawBody, $signatureHeader)) {
    http_response_code(401);
    echo json_encode(['error' => 'Firma non valida']);
    exit;
}

// 2. Controlla tipo di evento
if (($data['event'] ?? '') !== 'report.signed') {
    http_response_code(200);
    echo json_encode(['ok' => true]);
    exit;
}

// 3. Decodifica e salva il PDF
$pdfBytes    = base64_decode($data['pdf_base64']);
$pdfFilename = $data['pdf_filename'];
$savePath    = PDF_STORAGE_PATH . $pdfFilename;

if (file_put_contents($savePath, $pdfBytes) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossibile salvare il PDF']);
    exit;
}

// 4. Aggiorna il tuo database
$reportId   = $data['report_id'];
$externalId = $data['external_id'] ?? null;
$patientName= $data['patient_name'];
$signedAt   = $data['signed_at'];

// $pdo->prepare("UPDATE documenti SET stato=?, pdf_path=? WHERE id=?")
//     ->execute(['firmato', $pdfFilename, $externalId]);

error_log("PDF ricevuto: $pdfFilename | Paziente: $patientName");

// 5. Rispondi 200
http_response_code(200);
echo json_encode(['received' => true]);


function verifySignature(string $payload, string $signatureHeader): bool {
    if (empty($signatureHeader) || !str_starts_with($signatureHeader, 'sha256=')) {
        return false;
    }
    $received = substr($signatureHeader, 7); // Rimuove "sha256="
    $expected = hash_hmac('sha256', $payload, WEBHOOK_SECRET);
    return hash_equals($expected, $received);
}`} />
              </TabsContent>

              <TabsContent value="node_webhook" className="mt-3">
                <CodeBlock lang="javascript — Node.js / Express" code={`const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const app = express();

const WEBHOOK_SECRET = 'il_tuo_webhook_secret';
const PDF_STORAGE = './storage/referti/';

// IMPORTANTE: usa express.raw() per poter verificare la firma sul body grezzo
app.post('/webhook/prohmed', express.raw({ type: 'application/json' }), (req, res) => {
  
  // 1. Verifica firma di sicurezza
  const signatureHeader = req.headers['x-prohmed-signature'] || '';
  if (!verifySignature(req.body, signatureHeader)) {
    return res.status(401).json({ error: 'Firma non valida' });
  }

  const data = JSON.parse(req.body.toString());

  // 2. Controlla tipo di evento
  if (data.event !== 'report.signed') {
    return res.status(200).json({ ok: true });
  }

  // 3. Decodifica e salva il PDF
  const pdfBuffer = Buffer.from(data.pdf_base64, 'base64');
  const pdfPath = \`\${PDF_STORAGE}\${data.pdf_filename}\`;
  
  fs.writeFileSync(pdfPath, pdfBuffer);

  // 4. Aggiorna il tuo database
  const { report_id, external_id, patient_name, signed_at } = data;
  
  // await db.query(
  //   'UPDATE documenti SET stato=$1, pdf_path=$2 WHERE id=$3',
  //   ['firmato', data.pdf_filename, external_id]
  // );

  console.log(\`PDF ricevuto: \${data.pdf_filename} | Paziente: \${patient_name}\`);

  // 5. Risposta 200 per confermare la ricezione
  return res.status(200).json({ received: true });
});

function verifySignature(rawBody, signatureHeader) {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const received = signatureHeader.replace('sha256=', '');
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

app.listen(3000, () => console.log('Webhook server in ascolto su porta 3000'));`} />
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <SectionTitle icon={AlertCircle} title="Gestione degli errori" subtitle="Cosa fare quando la richiesta fallisce" />
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {["Codice HTTP", "Errore", "Causa", "Soluzione"].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {[
                    ["401", "unauthorized", "API key mancante o errata", "Controlla l'header Authorization e la chiave fornita da Prohmed"],
                    ["400", "missing_file", "Nessun file allegato", "Aggiungi il campo 'file' al form-data"],
                    ["400", "validation_error", "Parametri mancanti o non validi", "Controlla i campi patient_name e webhook_url"],
                    ["500", "configuration_error", "Medico/operatore non configurato", "Contatta il supporto Prohmed"],
                    ["500", "server_error", "Errore interno del server", "Riprova dopo qualche minuto o contatta il supporto"],
                  ].map(([code, err, cause, sol]) => (
                    <tr key={err} className="bg-white dark:bg-gray-900">
                      <td className="px-3 py-2"><Badge className={code.startsWith("4") ? "bg-orange-100 text-orange-700 text-xs" : "bg-red-100 text-red-700 text-xs"}>{code}</Badge></td>
                      <td className="px-3 py-2 font-mono text-gray-600 dark:text-gray-400">{err}</td>
                      <td className="px-3 py-2 text-gray-500">{cause}</td>
                      <td className="px-3 py-2 text-gray-500">{sol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-5 mb-2">Esempio di risposta di errore</h4>
            <CodeBlock lang="json" code={`{
  "error": "validation_error",
  "message": "Dati mancanti o non validi",
  "details": {
    "patient_name": ["patient_name obbligatorio"],
    "webhook_url": ["webhook_url deve essere un URL valido"]
  }
}`} />
          </div>

          <div>
            <SectionTitle icon={Zap} title="Limiti e note tecniche" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Formati file accettati", body: "PDF, JPEG, JPG, PNG. Dimensione massima: 10MB per file." },
                { title: "Tempo di elaborazione", body: "L'analisi AI richiede 30-120 secondi. La revisione del medico dipende dalla disponibilità. Il processo completo può richiedere da alcune ore a 1-2 giorni lavorativi." },
                { title: "Timeout webhook", body: "Il tuo server webhook ha 30 secondi per rispondere. Se non risponde, il sistema registra il tentativo come fallito. Contatta il supporto per ritrasmissioni manuali." },
                { title: "Sicurezza", body: "Usa sempre HTTPS per il webhook_url. Verifica sempre la firma X-Prohmed-Signature prima di elaborare il payload ricevuto." },
                { title: "Rate limiting", body: "Nessun limite di upload al momento. In caso di grandi volumi, contattare il supporto Prohmed per concordare i piani." },
                { title: "Ambiente di test", body: "Per testare l'integrazione, usa un servizio come webhook.site o ngrok per ricevere le notifiche di test senza un server pubblico." },
              ].map((item) => (
                <Card key={item.title} className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Supporto tecnico</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Per assistenza tecnica sull'integrazione, problemi con le API key o richieste di configurazione personalizzata, contatta il team Prohmed.
              Fornisci sempre il <strong>report_id</strong> o <strong>external_id</strong> del documento in questione per un'assistenza più rapida.
            </p>
          </div>

        </TabsContent>
      </Tabs>
    </div>
  );
}
