import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Download, Database, TrendingUp, FileJson, Filter, Home, Zap, BarChart3, AlertCircle, Star, CheckCircle, Eye } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { AdminLayout } from "@/components/AdminLayout";

interface MLStats {
  totalRecords: number;
  byRequestType: Record<string, number>;
  byModel: Record<string, number>;
  withFeedback: number;
  includedInTraining: number;
}

interface MLRecord {
  id: string;
  requestType: string;
  modelUsed: string;
  inputPrompt: string;
  outputJson: any;
  userId: string | null;
  userAge: number | null;
  userGender: string | null;
  responseTimeMs: number | null;
  tokensUsed: number | null;
  userFeedback: string | null;
  qualityRating: number | null;
  includedInTraining: boolean;
  createdAt: string;
}

interface MLRecordsResponse {
  records: MLRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminMLTrainingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>('');
  const [modelFilter, setModelFilter] = useState<string>('');
  const [syntheticCount, setSyntheticCount] = useState<number>(10);
  const [balancedPerCategory, setBalancedPerCategory] = useState<number>(5);
  
  // Validation dialog state
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MLRecord | null>(null);
  const [validationRating, setValidationRating] = useState<number>(3);
  const [validationNotes, setValidationNotes] = useState<string>('');

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<MLStats>({
    queryKey: ['/api/ml/training/stats'],
    enabled: !!user?.isAdmin || !!user?.isDoctor,
  });

  const { data: recordsData, isLoading: recordsLoading, error: recordsError } = useQuery<MLRecordsResponse>({
    queryKey: ['/api/ml/training/records', { requestType: requestTypeFilter, modelUsed: modelFilter, page }],
    enabled: !!user?.isAdmin || !!user?.isDoctor,
  });

  // Synthetic data generation mutations
  const generateSyntheticMutation = useMutation({
    mutationFn: async (count: number) => {
      return apiRequest('/api/ml/synthetic/generate', 'POST', { count, delayMs: 2000 });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Generazione Avviata",
        description: data.message || `Generazione di ${syntheticCount} conversazioni avviata`,
      });
      // Refresh stats after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/ml/training/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/ml/training/records'] });
      }, 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'avvio della generazione",
        variant: "destructive",
      });
    },
  });

  const generateBalancedMutation = useMutation({
    mutationFn: async (perCategory: number) => {
      return apiRequest('/api/ml/synthetic/generate-balanced', 'POST', { perCategory, delayMs: 2000 });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Dataset Bilanciato Avviato",
        description: data.message || `Generazione di ${data.totalCases} casi avviata`,
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/ml/training/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/ml/training/records'] });
      }, 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'avvio del dataset bilanciato",
        variant: "destructive",
      });
    },
  });

  const validateRecordMutation = useMutation({
    mutationFn: async ({ id, qualityRating, doctorNotes }: { id: string; qualityRating: number; doctorNotes: string }) => {
      return apiRequest(`/api/ml/training/${id}/validate`, 'PATCH', { 
        qualityRating, 
        doctorNotes,
        userFeedback: qualityRating >= 4 ? 'positive' : qualityRating <= 2 ? 'negative' : null
      });
    },
    onSuccess: () => {
      toast({
        title: "Validazione Salvata",
        description: "La valutazione è stata salvata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ml/training/records'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ml/training/stats'] });
      setValidationDialogOpen(false);
      setSelectedRecord(null);
      setValidationRating(3);
      setValidationNotes('');
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio della validazione",
        variant: "destructive",
      });
    },
  });

  const handleValidateRecord = (record: MLRecord) => {
    setSelectedRecord(record);
    setValidationRating(record.qualityRating || 3);
    setValidationNotes('');
    setValidationDialogOpen(true);
  };

  const handleSaveValidation = () => {
    if (!selectedRecord) return;
    validateRecordMutation.mutate({
      id: selectedRecord.id,
      qualityRating: validationRating,
      doctorNotes: validationNotes,
    });
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

  if (!user?.isAdmin && !user?.isDoctor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>
              Solo medici e amministratori possono accedere alla validazione ML.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleExport = (filters?: { requestType?: string; modelUsed?: string }) => {
    const params = new URLSearchParams();
    if (filters?.requestType) params.append('requestType', filters.requestType);
    if (filters?.modelUsed) params.append('modelUsed', filters.modelUsed);
    params.append('excludeAlreadyIncluded', 'true'); // Export only unused data

    window.open(`/api/ml/training/export?${params.toString()}`, '_blank');
  };

  const getTypeColor = (type: string) => {
    if (type.includes('radiological') || type.includes('triage') || type.includes('medical')) {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    }
    if (type.includes('chat') || type.includes('translation') || type.includes('email')) {
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    }
    if (type.includes('doctor') || type.includes('report')) {
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  };

  const getModelColor = (model: string) => {
    if (model.includes('gemini')) {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
    }
    if (model.includes('gpt')) {
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary" />
              ML Training Data Collection
            </h1>
            <p className="text-muted-foreground mt-1">
              Raccolta dati per addestramento modelli proprietari
            </p>
          </div>
          <Link 
            href="/admin" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-back-to-admin"
          >
            <Home className="w-4 h-4" />
            Torna alla Dashboard
          </Link>
        </div>

        {/* Statistics Cards */}
        {statsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Caricamento statistiche...</p>
          </div>
        ) : statsError ? (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 dark:text-red-400 font-semibold">Errore nel caricamento delle statistiche</p>
              <p className="text-sm text-muted-foreground mt-2">{statsError instanceof Error ? statsError.message : 'Errore sconosciuto'}</p>
            </CardContent>
          </Card>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  Totale Record
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Dati raccolti totali</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Con Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.withFeedback.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Dati con feedback utenti</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  In Training
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.includedInTraining.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Già usati per training</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-orange-500" />
                  Disponibili
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats.totalRecords - stats.includedInTraining).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Pronti per export</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Breakdown by Type */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Per Tipo Richiesta</CardTitle>
                <CardDescription>Distribuzione dei dati raccolti per categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byRequestType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <Badge className={getTypeColor(type)}>{type}</Badge>
                        <span className="font-semibold">{count.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Per Modello AI</CardTitle>
                <CardDescription>Distribuzione per modello utilizzato</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byModel)
                    .sort((a, b) => b[1] - a[1])
                    .map(([model, count]) => (
                      <div key={model} className="flex items-center justify-between">
                        <Badge className={getModelColor(model)}>{model}</Badge>
                        <span className="font-semibold">{count.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Synthetic Data Generator - ADMIN ONLY */}
        {user?.isAdmin && (
          <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="bg-purple-50 dark:bg-purple-950/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              Agente Sintetico - Generazione Dati ML
            </CardTitle>
            <CardDescription>
              Genera conversazioni mediche sintetiche con sintomi variati per addestrare i modelli
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Batch Generation */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                Generazione Batch Casuale
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Genera N conversazioni con sintomi casuali da tutte le categorie (testa, addome, torace, arti, generale)
              </p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label htmlFor="synthetic-count">Numero Conversazioni</Label>
                  <Input
                    id="synthetic-count"
                    type="number"
                    min="1"
                    max="100"
                    value={syntheticCount}
                    onChange={(e) => setSyntheticCount(parseInt(e.target.value) || 10)}
                    data-testid="input-synthetic-count"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Massimo 100 per volta (2 sec tra ogni generazione)
                  </p>
                </div>
                <Button
                  onClick={() => generateSyntheticMutation.mutate(syntheticCount)}
                  disabled={generateSyntheticMutation.isPending || syntheticCount < 1 || syntheticCount > 100}
                  className="flex items-center gap-2"
                  data-testid="button-generate-synthetic"
                >
                  <Zap className="w-4 h-4" />
                  {generateSyntheticMutation.isPending ? 'Generazione...' : 'Genera'}
                </Button>
              </div>
              {generateSyntheticMutation.isPending && (
                <div className="mt-3 text-sm text-muted-foreground">
                  ⏱️ Tempo stimato: ~{Math.round((syntheticCount * 2) / 60)} minuti
                </div>
              )}
            </div>

            {/* Balanced Generation */}
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Dataset Bilanciato per Categoria
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Genera ugual numero di casi per ogni categoria medica (testa, addome, torace, arti, generale)
              </p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label htmlFor="balanced-per-category">Casi per Categoria</Label>
                  <Input
                    id="balanced-per-category"
                    type="number"
                    min="1"
                    max="20"
                    value={balancedPerCategory}
                    onChange={(e) => setBalancedPerCategory(parseInt(e.target.value) || 5)}
                    data-testid="input-balanced-per-category"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Totale: {balancedPerCategory * 5} conversazioni (5 categorie × {balancedPerCategory})
                  </p>
                </div>
                <Button
                  onClick={() => generateBalancedMutation.mutate(balancedPerCategory)}
                  disabled={generateBalancedMutation.isPending || balancedPerCategory < 1 || balancedPerCategory > 20}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-generate-balanced"
                >
                  <BarChart3 className="w-4 h-4" />
                  {generateBalancedMutation.isPending ? 'Generazione...' : 'Genera Bilanciato'}
                </Button>
              </div>
              {generateBalancedMutation.isPending && (
                <div className="mt-3 text-sm text-muted-foreground">
                  ⏱️ Tempo stimato: ~{Math.round((balancedPerCategory * 5 * 2) / 60)} minuti
                </div>
              )}
            </div>

            {/* Categories Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
              <h4 className="font-semibold text-sm mb-2">Categorie Sintomi Disponibili</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <Badge variant="outline" className="justify-center">🧠 Testa</Badge>
                <Badge variant="outline" className="justify-center">🫀 Addome</Badge>
                <Badge variant="outline" className="justify-center">💨 Torace</Badge>
                <Badge variant="outline" className="justify-center">🦴 Arti</Badge>
                <Badge variant="outline" className="justify-center">🌡️ Generale</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Ogni conversazione include: età, sesso, peso, altezza + sintomo + analisi AI completa
              </p>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Export Section - ADMIN ONLY */}
        {user?.isAdmin && (
          <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export Dati per Training</CardTitle>
            <CardDescription>
              Scarica i dati in formato JSON per addestrare i tuoi modelli ML proprietari
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Filtra per Tipo</label>
                <Select value={requestTypeFilter} onValueChange={setRequestTypeFilter}>
                  <SelectTrigger data-testid="select-request-type">
                    <SelectValue placeholder="Tutti i tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutti i tipi</SelectItem>
                    {stats && Object.keys(stats.byRequestType).map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Filtra per Modello</label>
                <Select value={modelFilter} onValueChange={setModelFilter}>
                  <SelectTrigger data-testid="select-model">
                    <SelectValue placeholder="Tutti i modelli" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutti i modelli</SelectItem>
                    {stats && Object.keys(stats.byModel).map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => handleExport()} 
                className="flex items-center gap-2"
                data-testid="button-export-all"
              >
                <Download className="w-4 h-4" />
                Export Tutti i Dati (Non Usati)
              </Button>
              
              {(requestTypeFilter || modelFilter) && (
                <Button 
                  onClick={() => handleExport({ 
                    requestType: requestTypeFilter, 
                    modelUsed: modelFilter 
                  })} 
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-export-filtered"
                >
                  <Filter className="w-4 h-4" />
                  Export con Filtri
                </Button>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Strategia Migrazione 12 Mesi
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>Mesi 1-3:</strong> Raccolta 500-1000 casi annotati</li>
                <li>• <strong>Mesi 4-6:</strong> Training modello base proprietario</li>
                <li>• <strong>Mesi 7-9:</strong> A/B testing Gemini vs modello proprietario</li>
                <li>• <strong>Mesi 10-12:</strong> Migrazione completa → risparmio costi</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Recent Records Table - VALIDATION (doctors + admin) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ultimi Record Raccolti</CardTitle>
            <CardDescription>Anteprima degli ultimi dati salvati nel database</CardDescription>
          </CardHeader>
          <CardContent>
            {recordsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-sm text-muted-foreground">Caricamento record...</p>
              </div>
            ) : recordsError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-600 dark:text-red-400">Errore nel caricamento dei record</p>
                <p className="text-sm text-muted-foreground mt-2">{recordsError instanceof Error ? recordsError.message : 'Errore sconosciuto'}</p>
              </div>
            ) : recordsData && recordsData.records.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-semibold text-sm">Tipo</th>
                        <th className="pb-3 font-semibold text-sm">Modello</th>
                        <th className="pb-3 font-semibold text-sm">Utente</th>
                        <th className="pb-3 font-semibold text-sm">Tempo (ms)</th>
                        <th className="pb-3 font-semibold text-sm">Tokens</th>
                        <th className="pb-3 font-semibold text-sm">Rating</th>
                        <th className="pb-3 font-semibold text-sm">Data</th>
                        <th className="pb-3 font-semibold text-sm">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recordsData.records.map((record) => (
                        <tr key={record.id} data-testid={`row-ml-record-${record.id}`}>
                          <td className="py-3">
                            <Badge className={getTypeColor(record.requestType)}>
                              {record.requestType}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge className={getModelColor(record.modelUsed)}>
                              {record.modelUsed}
                            </Badge>
                          </td>
                          <td className="py-3 text-sm">
                            {record.userId ? (
                              <div className="flex flex-col">
                                <span className="text-muted-foreground">{record.userId.substring(0, 8)}...</span>
                                {record.userAge && (
                                  <span className="text-xs text-muted-foreground">
                                    {record.userAge} anni, {record.userGender || 'N/A'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 text-sm">
                            {record.responseTimeMs ? `${record.responseTimeMs}ms` : '-'}
                          </td>
                          <td className="py-3 text-sm">
                            {record.tokensUsed ? record.tokensUsed.toLocaleString() : '-'}
                          </td>
                          <td className="py-3">
                            {record.qualityRating ? (
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < record.qualityRating!
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">Non validato</Badge>
                            )}
                          </td>
                          <td className="py-3 text-sm text-muted-foreground">
                            {format(new Date(record.createdAt), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td className="py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleValidateRecord(record)}
                              className="flex items-center gap-1"
                              data-testid={`button-validate-${record.id}`}
                            >
                              {record.qualityRating ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  Rivedi
                                </>
                              ) : (
                                <>
                                  <Star className="w-3 h-3" />
                                  Valida
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {recordsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                      Pagina {recordsData.pagination.page} di {recordsData.pagination.totalPages} 
                      ({recordsData.pagination.total} totali)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        data-testid="button-prev-page"
                      >
                        Precedente
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= recordsData.pagination.totalPages}
                        data-testid="button-next-page"
                      >
                        Successiva
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : recordsData ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">Nessun record raccolto ancora</p>
                <p className="text-sm text-muted-foreground mt-2">I dati ML inizieranno ad accumularsi quando gli utenti interagiscono con la piattaforma</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Validation Dialog */}
        <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Validazione Conversazione ML</DialogTitle>
              <DialogDescription>
                Valuta la qualità della conversazione sintetica per migliorare il training dei modelli proprietari
              </DialogDescription>
            </DialogHeader>
            
            {selectedRecord && (
              <div className="space-y-4">
                {/* Record Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold">Tipo:</span> {selectedRecord.requestType}
                  </div>
                  <div>
                    <span className="font-semibold">Modello:</span> {selectedRecord.modelUsed}
                  </div>
                  <div>
                    <span className="font-semibold">Data:</span> {format(new Date(selectedRecord.createdAt), 'dd/MM/yyyy HH:mm')}
                  </div>
                  {selectedRecord.responseTimeMs && (
                    <div>
                      <span className="font-semibold">Tempo:</span> {selectedRecord.responseTimeMs}ms
                    </div>
                  )}
                </div>

                {/* Input Prompt */}
                <div>
                  <Label className="font-semibold mb-2 block">Prompt Input</Label>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md max-h-32 overflow-y-auto text-sm">
                    {selectedRecord.inputPrompt.substring(0, 500)}
                    {selectedRecord.inputPrompt.length > 500 && '...'}
                  </div>
                </div>

                {/* Output Response */}
                <div>
                  <Label className="font-semibold mb-2 block">Risposta AI</Label>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md max-h-40 overflow-y-auto text-sm">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {JSON.stringify(selectedRecord.outputJson, null, 2).substring(0, 1000)}
                      {JSON.stringify(selectedRecord.outputJson).length > 1000 && '\n...'}
                    </pre>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <Label className="font-semibold mb-2 block">Rating Qualità (1-5 stelle)</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setValidationRating(rating)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            rating <= validationRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium">
                      {validationRating}/5
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    1 = Molto scarsa, 3 = Accettabile, 5 = Eccellente
                  </p>
                </div>

                {/* Doctor Notes */}
                <div>
                  <Label htmlFor="validation-notes" className="font-semibold mb-2 block">
                    Note Medico (Opzionale)
                  </Label>
                  <Textarea
                    id="validation-notes"
                    placeholder="Aggiungi note, correzioni o suggerimenti per migliorare la risposta AI..."
                    value={validationNotes}
                    onChange={(e) => setValidationNotes(e.target.value)}
                    rows={4}
                    data-testid="textarea-validation-notes"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setValidationDialogOpen(false)}
                    disabled={validateRecordMutation.isPending}
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={handleSaveValidation}
                    disabled={validateRecordMutation.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-save-validation"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {validateRecordMutation.isPending ? 'Salvataggio...' : 'Salva Validazione'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
