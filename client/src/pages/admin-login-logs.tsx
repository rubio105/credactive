import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogIn, Download, Filter, Home, Search, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

interface LoginLog {
  id: string;
  userId: string | null;
  userEmail: string;
  userName: string | null;
  userRole: string | null;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  failureReason: string | null;
  createdAt: string;
}

interface LoginLogsResponse {
  logs: LoginLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminLoginLogsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    success: 'all',
    userEmail: '',
    startDate: '',
    endDate: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data, isLoading, error } = useQuery<LoginLogsResponse>({
    queryKey: ['/api/admin/login-logs', appliedFilters, page],
    enabled: !!(user as any)?.isAdmin,
    refetchInterval: 30000, // Refresh every 30s
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      
      if (appliedFilters.userEmail) params.append('userEmail', appliedFilters.userEmail);
      if (appliedFilters.success && appliedFilters.success !== 'all') params.append('success', appliedFilters.success);
      if (appliedFilters.startDate) params.append('startDate', appliedFilters.startDate);
      if (appliedFilters.endDate) params.append('endDate', appliedFilters.endDate);

      const response = await fetch(`/api/admin/login-logs?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch login logs: ${response.statusText}`);
      }

      return response.json();
    },
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
              Non hai i permessi necessari per accedere ai log di accesso.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (appliedFilters.userEmail) params.append('userEmail', appliedFilters.userEmail);
    if (appliedFilters.success && appliedFilters.success !== 'all') params.append('success', appliedFilters.success);
    if (appliedFilters.startDate) params.append('startDate', appliedFilters.startDate);
    if (appliedFilters.endDate) params.append('endDate', appliedFilters.endDate);

    window.open(`/api/admin/login-logs/export?${params.toString()}`, '_blank');
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      success: 'all',
      userEmail: '',
      startDate: '',
      endDate: '',
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <LogIn className="w-8 h-8 text-primary" />
                Log Accessi Sistema
              </h1>
              <p className="text-muted-foreground mt-1">Monitoraggio autenticazioni utenti</p>
            </div>
            <Link 
              href="/admin" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-back-to-admin"
            >
              <Home className="w-4 h-4" />
              Dashboard Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-8 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtri
            </CardTitle>
            <CardDescription>Filtra i log di accesso per email, stato o intervallo temporale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="success">Stato Login</Label>
                <Select 
                  value={filters.success} 
                  onValueChange={(value) => setFilters({ ...filters, success: value })}
                >
                  <SelectTrigger id="success" data-testid="select-success">
                    <SelectValue placeholder="Tutti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="true">Solo Successi</SelectItem>
                    <SelectItem value="false">Solo Fallimenti</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Utente</Label>
                <Input
                  id="userEmail"
                  type="text"
                  placeholder="es. user@example.com"
                  value={filters.userEmail}
                  onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })}
                  data-testid="input-user-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inizio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fine</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleApplyFilters}
                className="flex items-center gap-2"
                data-testid="button-apply-filters"
              >
                <Search className="w-4 h-4" />
                Applica Filtri
              </Button>
              <Button 
                variant="outline"
                onClick={handleResetFilters}
                data-testid="button-reset-filters"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export & Stats */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {data && (
              <>
                Totale: <strong>{data.pagination.total}</strong> accessi trovati
                {appliedFilters.success !== 'all' && (
                  <span className="ml-2">
                    ({appliedFilters.success === 'true' ? 'Solo successi' : 'Solo fallimenti'})
                  </span>
                )}
              </>
            )}
          </div>
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            className="flex items-center gap-2"
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4" />
            Esporta CSV
          </Button>
        </div>

        {/* Login Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Log di Accesso</CardTitle>
            <CardDescription>Cronologia completa dei tentativi di autenticazione</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                Errore nel caricamento dei log: {(error as any).message}
              </div>
            ) : !data || data.logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nessun log trovato con i filtri selezionati
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-login-logs">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-semibold">Data/Ora</th>
                        <th className="pb-3 font-semibold">Email</th>
                        <th className="pb-3 font-semibold">Nome</th>
                        <th className="pb-3 font-semibold">Ruolo</th>
                        <th className="pb-3 font-semibold">Stato</th>
                        <th className="pb-3 font-semibold">IP</th>
                        <th className="pb-3 font-semibold">Motivo Fallimento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-muted/50" data-testid={`row-login-${log.id}`}>
                          <td className="py-3 text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                          </td>
                          <td className="py-3">
                            <div className="font-medium truncate max-w-[200px]" title={log.userEmail}>
                              {log.userEmail}
                            </div>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {log.userName || 'N/A'}
                          </td>
                          <td className="py-3">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
                              {log.userRole || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3">
                            {log.success ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">Successo</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-destructive">
                                <XCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">Fallito</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 text-muted-foreground font-mono text-xs">
                            {log.ipAddress || 'N/A'}
                          </td>
                          <td className="py-3 text-muted-foreground text-xs max-w-[250px] truncate" title={log.failureReason || ''}>
                            {log.failureReason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Pagina {data.pagination.page} di {data.pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        data-testid="button-prev-page"
                      >
                        Precedente
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= data.pagination.totalPages}
                        data-testid="button-next-page"
                      >
                        Successiva
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
