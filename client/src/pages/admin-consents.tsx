import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Download, Search, CheckCircle2, XCircle, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import AdminLayout from "@/components/AdminLayout";

export default function AdminConsents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/consents', { search: searchTerm, page, limit }],
  });

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/consents/export', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consensi-utenti-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: it });
  };

  const ConsentBadge = ({ accepted, timestamp }: { accepted: boolean; timestamp: string | null }) => {
    if (accepted && timestamp) {
      return (
        <div className="flex flex-col items-start">
          <Badge variant="default" className="bg-green-600 hover:bg-green-700 mb-1">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Sì
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(timestamp)}
          </span>
        </div>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700">
        <XCircle className="h-3 w-3 mr-1" />
        No
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            Gestione Consensi Utenti
          </h1>
          <p className="text-muted-foreground">
            Monitora i consensi privacy di tutti gli utenti registrati
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Consensi Privacy Utenti</CardTitle>
                <CardDescription>
                  Elenco completo dei consensi accettati e revocati
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per email o nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full sm:w-64"
                    data-testid="input-search-consents"
                  />
                </div>
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  className="whitespace-nowrap"
                  data-testid="button-export-csv"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Esporta CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Utente</TableHead>
                        <TableHead className="w-[100px]">Ruolo</TableHead>
                        <TableHead className="min-w-[140px]">Privacy</TableHead>
                        <TableHead className="min-w-[140px]">Dati Sanitari</TableHead>
                        <TableHead className="min-w-[140px]">Termini</TableHead>
                        <TableHead className="min-w-[140px]">Marketing</TableHead>
                        <TableHead className="min-w-[140px]">Commerciale</TableHead>
                        <TableHead className="min-w-[140px]">Scientifico</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.data?.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <User className="h-4 w-4 mt-1 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{user.firstName} {user.lastName}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isDoctor ? "default" : "secondary"}>
                              {user.isDoctor ? "Medico" : "Paziente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ConsentBadge 
                              accepted={user.privacyAccepted} 
                              timestamp={user.privacyAcceptedAt} 
                            />
                          </TableCell>
                          <TableCell>
                            <ConsentBadge 
                              accepted={user.healthDataConsent} 
                              timestamp={user.healthDataConsentAt} 
                            />
                          </TableCell>
                          <TableCell>
                            <ConsentBadge 
                              accepted={user.termsAccepted} 
                              timestamp={user.termsAcceptedAt} 
                            />
                          </TableCell>
                          <TableCell>
                            <ConsentBadge 
                              accepted={user.marketingConsent} 
                              timestamp={user.marketingConsentAt} 
                            />
                          </TableCell>
                          <TableCell>
                            <ConsentBadge 
                              accepted={user.commercialConsent} 
                              timestamp={user.commercialConsentAt} 
                            />
                          </TableCell>
                          <TableCell>
                            <ConsentBadge 
                              accepted={user.scientificConsent} 
                              timestamp={user.scientificConsentAt} 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data?.pagination && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Pagina {data.pagination.page} di {data.pagination.totalPages} (Totale: {data.pagination.total} utenti)
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

        {/* Statistics Summary */}
        {data?.data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {data.data.filter((u: any) => u.privacyAccepted).length}
                </div>
                <div className="text-xs text-muted-foreground">Privacy OK</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {data.data.filter((u: any) => u.healthDataConsent).length}
                </div>
                <div className="text-xs text-muted-foreground">Dati Sanitari OK</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {data.data.filter((u: any) => u.termsAccepted).length}
                </div>
                <div className="text-xs text-muted-foreground">Termini OK</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {data.data.filter((u: any) => u.marketingConsent).length}
                </div>
                <div className="text-xs text-muted-foreground">Marketing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {data.data.filter((u: any) => u.commercialConsent).length}
                </div>
                <div className="text-xs text-muted-foreground">Commerciale</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {data.data.filter((u: any) => u.scientificConsent).length}
                </div>
                <div className="text-xs text-muted-foreground">Scientifico</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
