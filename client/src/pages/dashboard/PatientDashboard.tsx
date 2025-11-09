import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, MessageSquare, Calendar, Target, TrendingUp, FileText, AlertCircle, Activity, Video } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  usePreventionIndex,
  useUpcomingAppointment,
  getPreventionTierMeta,
  formatRelativeTime,
} from "@/hooks/useDashboardData";
import { format } from "date-fns";
import { it } from "date-fns/locale";

function getUserDisplayName(user: any): string {
  if (user?.firstName || user?.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  return user?.email?.split('@')[0] || 'Utente';
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data: preventionIndex, isLoading: isLoadingIndex, error: indexError, refetch: refetchIndex } = usePreventionIndex();
  const { data: upcomingAppointments, isLoading: isLoadingAppointments, error: appointmentsError } = useUpcomingAppointment();

  const displayName = getUserDisplayName(user);
  const nextAppointment = upcomingAppointments?.[0];

  const quickActions = [
    { label: "Carica Referto", icon: Upload, route: "/chat?action=upload", testId: "quick-carica", variant: "outline" as const },
    { label: "Parla con CIRY", icon: MessageSquare, route: "/chat", testId: "quick-chat", variant: "default" as const },
  ];

  return (
    <section data-testid="patient-dashboard" className="space-y-4 p-4 pb-20 md:pb-4">
      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle className="text-2xl">Ciao {displayName},</CardTitle>
          <CardDescription className="text-base">
            come stai? Facciamo prevenzione insieme 💙
          </CardDescription>
        </CardHeader>
      </Card>

      {isLoadingIndex ? (
        <Card className="shadow-sm border" data-testid="prevention-score-skeleton">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ) : indexError ? (
        <Card className="shadow-sm border">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Errore nel caricamento del punteggio prevenzione.
                <Button variant="link" onClick={() => refetchIndex()} className="ml-2 p-0 h-auto">
                  Riprova
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : preventionIndex ? (
        <Card className="shadow-sm border" data-testid="prevention-score-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle>Indice di Prevenzione</CardTitle>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getPreventionTierMeta(preventionIndex.tier).bgClass} text-white`}>
                {getPreventionTierMeta(preventionIndex.tier).label}
              </div>
            </div>
            <CardDescription>
              Il tuo punteggio di prevenzione basato sulle ultime 4 settimane
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-bold">{preventionIndex.score}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <Progress value={preventionIndex.score} className="h-3" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Dettagli punteggio:</p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Frequenza
                  </span>
                  <span className="font-medium">{preventionIndex.breakdown.frequencyScore}/30</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Profondità
                  </span>
                  <span className="font-medium">{preventionIndex.breakdown.depthScore}/20</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Documenti
                  </span>
                  <span className="font-medium">{preventionIndex.breakdown.documentScore}/20</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Alert
                  </span>
                  <span className="font-medium">{preventionIndex.breakdown.alertScore}/15</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Insight
                  </span>
                  <span className="font-medium">{preventionIndex.breakdown.insightScore}/15</span>
                </div>
              </div>
            </div>

            <Alert className="bg-muted">
              <Target className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {getPreventionTierMeta(preventionIndex.tier).suggestion}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : null}

      {isLoadingAppointments ? (
        <Card className="shadow-sm border">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ) : nextAppointment ? (
        <Card className="shadow-sm border" data-testid="next-appointment-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle>Prossimo Appuntamento</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium">
                  {format(new Date(nextAppointment.appointmentDate), "EEEE d MMMM yyyy", { locale: it })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Ore {nextAppointment.startTime} • {nextAppointment.duration} min
                </p>
                {nextAppointment.doctorName && (
                  <p className="text-sm text-muted-foreground">
                    con {nextAppointment.doctorName}
                  </p>
                )}
                {nextAppointment.studioAddress && (
                  <p className="text-sm text-muted-foreground">
                    📍 {nextAppointment.studioAddress}
                  </p>
                )}
              </div>
            </div>
            
            {nextAppointment.appointmentDate === format(new Date(), 'yyyy-MM-dd') && nextAppointment.type === 'video' && (
              <Link href={`/teleconsulto/${nextAppointment.id}`}>
                <Button className="w-full" data-testid="join-video-btn">
                  <Video className="w-4 h-4 mr-2" />
                  Entra in VideoCall
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : !appointmentsError && (
        <Card className="shadow-sm border">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-4">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessun appuntamento programmato</p>
              <Link href="/prenotazioni">
                <Button variant="link" className="mt-2" data-testid="book-appointment-link">
                  Prenota ora
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border">
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
