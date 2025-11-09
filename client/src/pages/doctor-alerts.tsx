import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";

interface Alert {
  id: string;
  patientId: string;
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

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const filteredAlerts = alerts.filter(alert => {
    if (statusFilter === "all") return true;
    return alert.status === statusFilter;
  });

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
                <Link key={alert.id} href={`/doctor/alerts/${alert.id}`}>
                  <Card
                    className="cursor-pointer hover:bg-accent transition-colors"
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
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
                    </CardContent>
                  </Card>
                </Link>
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
    </div>
  );
}
