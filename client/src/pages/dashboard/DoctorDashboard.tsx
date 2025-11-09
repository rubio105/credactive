import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, AlertTriangle, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useDoctorStats,
  useUrgentAlertsList,
  formatRelativeTime,
  type Alert,
} from "@/hooks/useDashboardData";

function getUserDisplayName(user: any): string {
  if (user?.firstName || user?.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  return user?.email?.split('@')[0] || 'Dottore';
}

function getUrgencyBadgeVariant(urgency: string): "default" | "destructive" | "secondary" {
  if (urgency === 'EMERGENCY') return 'destructive';
  if (urgency === 'HIGH') return 'destructive';
  return 'secondary';
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const stats = useDoctorStats();
  const { data: urgentAlerts, isLoading: isLoadingAlerts } = useUrgentAlertsList();

  const displayName = getUserDisplayName(user);

  const quickActions = [
    { label: "Genera Report Pre-Visita", icon: FileText, route: "/doctor/reports", testId: "quick-report", variant: "outline" as const },
    { label: "Vedi Pazienti", icon: Users, route: "/doctor/patients", testId: "quick-patients", variant: "default" as const },
  ];

  return (
    <section data-testid="doctor-dashboard" className="space-y-4 p-4 pb-20 md:pb-4 md:grid md:grid-cols-2 md:gap-4">
      <Card className="shadow-sm border md:col-span-2">
        <CardHeader>
          <CardTitle className="text-2xl">Ciao dott. {displayName},</CardTitle>
          <CardDescription className="text-base">
            sono a tua disposizione per supportarti nella prevenzione 🩺
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-sm border" data-testid="stats-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle>Statistiche Rapide</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Pazienti Totali</span>
              </div>
              <span className="text-2xl font-bold">{stats.totalPatients}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-sm font-medium">Alert Urgenti</span>
              </div>
              <span className="text-2xl font-bold text-destructive">{stats.urgentAlerts}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Appuntamenti Oggi</span>
              </div>
              <span className="text-2xl font-bold">{stats.todayAppointments}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoadingAlerts ? (
        <Card className="shadow-sm border">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : urgentAlerts && urgentAlerts.length > 0 ? (
        <Card className="shadow-sm border" data-testid="urgent-alerts-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle>Alert Urgenti</CardTitle>
            </div>
            <CardDescription>Richiede attenzione immediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentAlerts.map((alert: Alert) => (
                <Link key={alert.id} href={`/doctor/alerts/${alert.id}`}>
                  <div
                    className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getUrgencyBadgeVariant(alert.urgency)} className="text-xs">
                            {alert.urgency}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(alert.createdAt)}
                          </span>
                        </div>
                        <p className="font-medium text-sm line-clamp-1">{alert.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{alert.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              
              <Link href="/doctor/alerts">
                <Button variant="outline" className="w-full mt-2" data-testid="view-all-alerts">
                  Vedi Tutti gli Alert
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-4">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessun alert urgente</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border md:col-span-2">
        <CardHeader>
          <CardTitle>Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.testId} href={action.route}>
                  <Button
                    variant={action.variant}
                    className="w-full h-auto py-4 flex flex-col items-center gap-2"
                    data-testid={action.testId}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
