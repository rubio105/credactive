import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Download, Calendar, Filter, Home, Search } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceOwnerId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: any;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminAuditPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    resourceType: '',
    userId: '',
    startDate: '',
    endDate: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data, isLoading, error } = useQuery<AuditLogsResponse>({
    queryKey: ['/api/admin/audit/logs', appliedFilters, page],
    enabled: !!user?.isAdmin,
    refetchInterval: 30000, // Refresh every 30s
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
              Non hai i permessi necessari per accedere ai log di audit.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (appliedFilters.userId) params.append('userId', appliedFilters.userId);
    if (appliedFilters.resourceType) params.append('resourceType', appliedFilters.resourceType);
    if (appliedFilters.startDate) params.append('startDate', appliedFilters.startDate);
    if (appliedFilters.endDate) params.append('endDate', appliedFilters.endDate);

    window.open(`/api/admin/audit/export?${params.toString()}`, '_blank');
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      resourceType: '',
      userId: '',
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
                <Shield className="w-8 h-8 text-primary" />
                Audit Log System
              </h1>
              <p className="text-muted-foreground mt-1">Tracciamento accessi GDPR-compliant</p>
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
            <CardDescription>Filtra i log di audit per resource type, utente o intervallo temporale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resourceType">Tipo Risorsa</Label>
                <Select 
                  value={filters.resourceType} 
                  onValueChange={(value) => setFilters({ ...filters, resourceType: value })}
                >
                  <SelectTrigger id="resourceType" data-testid="select-resource-type">
                    <SelectValue placeholder="Tutte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte</SelectItem>
                    <SelectItem value="health_report">Referti Sanitari</SelectItem>
                    <SelectItem value="prevention_document">Documenti Prevenzione</SelectItem>
                    <SelectItem value="doctor_note">Note Mediche</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="es. user-123..."
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  data-testid="input-user-id"
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
                Totale: <strong>{data.pagination.total}</strong> log trovati
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

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Log di Accesso</CardTitle>
            <CardDescription>Tracciamento completo delle operazioni su risorse sensibili</CardDescription>
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
                  <table className="w-full text-sm" data-testid="table-audit-logs">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-semibold">Data/Ora</th>
                        <th className="pb-3 font-semibold">Utente</th>
                        <th className="pb-3 font-semibold">Azione</th>
                        <th className="pb-3 font-semibold">Risorsa</th>
                        <th className="pb-3 font-semibold">ID Risorsa</th>
                        <th className="pb-3 font-semibold">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-muted/50" data-testid={`row-audit-${log.id}`}>
                          <td className="py-3 text-muted-foreground">
                            {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                          </td>
                          <td className="py-3">
                            <div>
                              <div className="font-medium">{log.user?.fullName || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{log.user?.email || log.userId}</div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">{log.resourceType}</td>
                          <td className="py-3 font-mono text-xs text-muted-foreground">
                            {log.resourceId.substring(0, 8)}...
                          </td>
                          <td className="py-3 text-muted-foreground">{log.ipAddress || 'N/A'}</td>
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
