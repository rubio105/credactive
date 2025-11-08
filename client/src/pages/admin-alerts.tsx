import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Clock, User, Calendar, MessageSquare, Eye, Filter, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TriageAlert {
  id: string;
  userId: string;
  sessionId: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  alertType: string;
  reason: string;
  isReviewed: boolean;
  reviewedAt?: string;
  reviewedById?: string;
  reviewNotes?: string;
  createdAt: string;
  userEmail?: string;
  userName?: string;
  sessionStatus?: string;
}

export default function AdminAlertsPage() {
  const { toast } = useToast();
  const [selectedAlert, setSelectedAlert] = useState<TriageAlert | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  
  // Filter states - Default to only RED and YELLOW alerts
  const [severityFilter, setSeverityFilter] = useState<string[]>(['emergency', 'high']);
  const [patientNameFilter, setPatientNameFilter] = useState("");

  const { data: rawAlerts = [], isLoading } = useQuery<TriageAlert[]>({
    queryKey: ["/api/triage/alerts"],
  });

  // Apply filters to alerts
  const allAlerts = useMemo(() => {
    let filtered = rawAlerts;

    // Filter by severity (only show selected levels)
    if (severityFilter.length > 0) {
      filtered = filtered.filter(alert => severityFilter.includes(alert.urgencyLevel));
    }

    // Filter by patient name or email (search both fields independently)
    if (patientNameFilter.trim()) {
      const searchTerm = patientNameFilter.toLowerCase();
      filtered = filtered.filter(alert => {
        const name = (alert.userName || '').toLowerCase();
        const email = (alert.userEmail || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
      });
    }

    return filtered;
  }, [rawAlerts, severityFilter, patientNameFilter]);

  const reviewMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes: string }) => {
      const response = await apiRequest(`/api/admin/triage/alerts/${alertId}/review`, "PATCH", { 
        reviewNotes: notes 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/triage/alerts"] });
      toast({
        title: "Alert rivisto",
        description: "L'alert è stato marcato come rivisto con successo",
      });
      setShowReviewDialog(false);
      setSelectedAlert(null);
      setReviewNotes("");
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile rivedere l'alert",
        variant: "destructive",
      });
    },
  });

  const handleReview = (alert: TriageAlert) => {
    setSelectedAlert(alert);
    setReviewNotes("");
    setShowReviewDialog(true);
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'emergency':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  const getUrgencyLabel = (level: string) => {
    switch (level) {
      case 'emergency':
        return 'Emergenza';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      default:
        return 'Bassa';
    }
  };

  const unreviewedAlerts = allAlerts.filter(a => !a.isReviewed);
  const reviewedAlerts = allAlerts.filter(a => a.isReviewed);

  const AlertCard = ({ alert }: { alert: TriageAlert }) => (
    <Card key={alert.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={getUrgencyColor(alert.urgencyLevel)}>
                  {getUrgencyLabel(alert.urgencyLevel)}
                </Badge>
                <Badge variant="outline">{alert.alertType}</Badge>
                {alert.isReviewed && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Rivisto
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-foreground">{alert.reason}</p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {alert.userName || alert.userEmail || 'Utente sconosciuto'}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(alert.createdAt).toLocaleString('it-IT')}
                </div>
                {alert.sessionStatus && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {alert.sessionStatus}
                  </div>
                )}
              </div>
              {alert.reviewNotes && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <strong>Note:</strong> {alert.reviewNotes}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 ml-4">
              {!alert.isReviewed && (
                <Button
                  size="sm"
                  onClick={() => handleReview(alert)}
                  disabled={reviewMutation.isPending}
                  data-testid={`button-review-${alert.id}`}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Rivedi
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`/prevention?session=${alert.sessionId}`, '_blank')}
                data-testid={`button-view-session-${alert.id}`}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Conversazione
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const toggleSeverity = (severity: string) => {
    setSeverityFilter(prev => 
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
  };

  const resetFilters = () => {
    setSeverityFilter(['emergency', 'high']);
    setPatientNameFilter("");
  };

  const hasActiveFilters = severityFilter.length !== 2 || !severityFilter.includes('emergency') || !severityFilter.includes('high') || patientNameFilter.trim() !== "";

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Alert Medici</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestisci alert triage e urgenze</p>
        </div>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Filtri Alert</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                  data-testid="button-reset-filters"
                >
                  <X className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Name Filter */}
              <div className="space-y-2">
                <Label htmlFor="patient-filter" className="text-sm font-medium">
                  Cerca Paziente
                </Label>
                <Input
                  id="patient-filter"
                  placeholder="Nome o email paziente..."
                  value={patientNameFilter}
                  onChange={(e) => setPatientNameFilter(e.target.value)}
                  data-testid="input-patient-filter"
                  className="w-full"
                />
              </div>

              {/* Severity Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Gravità (default: solo rossi e gialli)
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={severityFilter.includes('emergency') ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSeverity('emergency')}
                    data-testid="button-filter-emergency"
                    className={severityFilter.includes('emergency') ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    🔴 Emergenza
                  </Button>
                  <Button
                    variant={severityFilter.includes('high') ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSeverity('high')}
                    data-testid="button-filter-high"
                    className={severityFilter.includes('high') ? "bg-orange-600 hover:bg-orange-700" : ""}
                  >
                    🟠 Alta
                  </Button>
                  <Button
                    variant={severityFilter.includes('medium') ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSeverity('medium')}
                    data-testid="button-filter-medium"
                    className={severityFilter.includes('medium') ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                  >
                    🟡 Media
                  </Button>
                  <Button
                    variant={severityFilter.includes('low') ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSeverity('low')}
                    data-testid="button-filter-low"
                    className={severityFilter.includes('low') ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    🔵 Bassa
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Totale Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allAlerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Da Rivedere
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{unreviewedAlerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Rivisti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{reviewedAlerts.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="unreviewed" className="space-y-4">
          <TabsList>
            <TabsTrigger value="unreviewed" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Da Rivedere ({unreviewedAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Rivisti ({reviewedAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Tutti ({allAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unreviewed" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Caricamento...
                </CardContent>
              </Card>
            ) : unreviewedAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                  <p className="font-medium">Nessun alert da rivedere</p>
                  <p className="text-sm mt-2">Ottimo lavoro! Tutti gli alert sono stati gestiti.</p>
                </CardContent>
              </Card>
            ) : (
              unreviewedAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="space-y-4">
            {reviewedAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nessun alert rivisto</p>
                </CardContent>
              </Card>
            ) : (
              reviewedAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Caricamento...
                </CardContent>
              </Card>
            ) : allAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nessun alert presente</p>
                  <p className="text-sm mt-2">
                    Gli alert vengono generati quando l'AI identifica situazioni critiche nelle conversazioni.
                  </p>
                </CardContent>
              </Card>
            ) : (
              allAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
            )}
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rivedi Alert</DialogTitle>
              <DialogDescription>
                Aggiungi note e marca l'alert come rivisto
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedAlert && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge className={getUrgencyColor(selectedAlert.urgencyLevel)}>
                      {getUrgencyLabel(selectedAlert.urgencyLevel)}
                    </Badge>
                    <span className="text-sm font-medium">{selectedAlert.alertType}</span>
                  </div>
                  <p className="text-sm">{selectedAlert.reason}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="review-notes">Note (opzionale)</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Aggiungi note sulla revisione..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  data-testid="textarea-review-notes"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
                data-testid="button-cancel-review"
              >
                Annulla
              </Button>
              <Button
                onClick={() => selectedAlert && reviewMutation.mutate({ alertId: selectedAlert.id, notes: reviewNotes })}
                disabled={reviewMutation.isPending}
                data-testid="button-confirm-review"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {reviewMutation.isPending ? "Salvataggio..." : "Marca come Rivisto"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
