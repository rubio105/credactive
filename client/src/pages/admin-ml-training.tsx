import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Download, Database, TrendingUp, FileJson, Filter, Home } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import AdminLayout from "@/components/AdminLayout";

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
  const [page, setPage] = useState(1);
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>('');
  const [modelFilter, setModelFilter] = useState<string>('');

  const { data: stats, isLoading: statsLoading } = useQuery<MLStats>({
    queryKey: ['/api/ml/training/stats'],
    enabled: !!user?.isAdmin,
  });

  const { data: recordsData, isLoading: recordsLoading } = useQuery<MLRecordsResponse>({
    queryKey: ['/api/ml/training/records', { requestType: requestTypeFilter, modelUsed: modelFilter, page }],
    enabled: !!user?.isAdmin,
  });

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

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>
              Non hai i permessi necessari per accedere ai dati ML.
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
          </div>
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

        {/* Export Section */}
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

        {/* Recent Records Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ultimi Record Raccolti</CardTitle>
            <CardDescription>Anteprima degli ultimi dati salvati nel database</CardDescription>
          </CardHeader>
          <CardContent>
            {recordsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
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
                        <th className="pb-3 font-semibold text-sm">Data</th>
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
                          <td className="py-3 text-sm text-muted-foreground">
                            {format(new Date(record.createdAt), 'dd/MM/yyyy HH:mm')}
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nessun record disponibile
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
