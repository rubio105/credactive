import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Filter, MessageSquare, Send } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  urgency: string;
  status: string;
  title: string;
  description: string;
  createdAt: string;
}

function getUrgencyBadgeVariant(urgency: string): "default" | "destructive" | "secondary" {
  if (urgency === 'EMERGENCY' || urgency === 'HIGH') return 'destructive';
  if (urgency === 'MEDIUM') return 'default';
  return 'secondary';
}

export default function DoctorAlertsPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("pending");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [responseText, setResponseText] = useState("");
  const { toast } = useToast();

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/doctor/alerts"],
  });

  const filteredAlerts = alerts.filter(alert => {
    if (statusFilter === "all") return true;
    return alert.status === statusFilter;
  });

  const sendResponseMutation = useMutation({
    mutationFn: async ({ alertId, patientId, noteText }: { alertId: string; patientId: string; noteText: string }) => {
      return await apiRequest("/api/doctor/notes", "POST", {
        patientId,
        alertId,
        noteText,
        noteTitle: "Risposta Alert",
        isReport: false,
        category: "Risposta Alert"
      });
    },
    onSuccess: () => {
      toast({
        title: "Risposta inviata",
        description: "La tua risposta è stata inviata al paziente",
      });
      setSelectedAlert(null);
      setResponseText("");
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/alerts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare la risposta",
        variant: "destructive",
      });
    },
  });

  const handleRespond = (alert: Alert) => {
    setSelectedAlert(alert);
    setResponseText("");
  };

  const handleSendResponse = () => {
    if (!selectedAlert || !responseText.trim()) {
      toast({
        title: "Testo richiesto",
        description: "Scrivi una risposta prima di inviare",
        variant: "destructive",
      });
      return;
    }

    sendResponseMutation.mutate({
      alertId: selectedAlert.id,
      patientId: selectedAlert.patientId,
      noteText: responseText.trim(),
    });
  };

  return (
    <div className="p-4 pb-20 md:pb-4" data-testid="doctor-alerts-page">
      <Card className="shadow-sm border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <CardTitle>Alert Pazienti</CardTitle>
          </div>
          <CardDescription>Gestisci gli alert medici dei tuoi pazienti</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
                data-testid="filter-pending"
              >
                In Attesa ({alerts.filter(a => a.status === 'pending').length})
              </Button>
              <Button
                variant={statusFilter === "resolved" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("resolved")}
                data-testid="filter-resolved"
              >
                Risolti
              </Button>
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                data-testid="filter-all"
              >
                Tutti
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </>
            ) : filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className="hover:shadow-md transition-shadow"
                  data-testid={`alert-${alert.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getUrgencyBadgeVariant(alert.urgency)}>
                            {alert.urgency}
                          </Badge>
                          {alert.status === 'resolved' && (
                            <Badge variant="outline">Risolto</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: it })}
                          </span>
                        </div>
                        <CardTitle className="text-sm">{alert.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Paziente: <span className="font-medium text-foreground">{alert.patientName}</span>
                        </p>
                      </div>
                      {alert.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRespond(alert)}
                          data-testid={`button-respond-${alert.id}`}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Rispondi
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {statusFilter === "pending" ? "Nessun alert in attesa" : "Nessun alert trovato"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rispondi all'Alert</DialogTitle>
            <DialogDescription>
              Paziente: {selectedAlert?.patientName} • {selectedAlert?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">{selectedAlert?.description}</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="response-text" className="text-sm font-medium">
                La tua risposta
              </label>
              <Textarea
                id="response-text"
                placeholder="Scrivi qui la tua risposta al paziente..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={5}
                data-testid="textarea-response"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedAlert(null)}
              disabled={sendResponseMutation.isPending}
              data-testid="button-cancel-response"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSendResponse}
              disabled={sendResponseMutation.isPending || !responseText.trim()}
              data-testid="button-send-response"
            >
              {sendResponseMutation.isPending ? (
                <>Invio...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Invia Risposta
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
