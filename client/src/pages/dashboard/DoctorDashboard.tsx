import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageSquare,
  AlertTriangle,
  Users,
  CalendarCheck,
  Share2,
  FileCheck,
  Activity
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUrgentAlerts } from "@/hooks/useNotificationBadge";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";
import { useQuery } from "@tanstack/react-query";
import { useViewMode } from "@/contexts/ViewModeContext";
import { DashboardHero, StatCard, ServiceGrid } from "@/components/dashboard/DashboardPrimitives";
import { cn } from "@/lib/utils";

function getUserDisplayName(user: any): string {
  if (user?.firstName || user?.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  return user?.email?.split('@')[0] || 'Dottore';
}

function getUserInitials(user: any): string {
  const name = getUserDisplayName(user);
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

interface DoctorStats {
  totalPatients: number;
  criticalAlerts: number;
  todayAppointments: number;
  weekAppointments: number;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { count: urgentAlertsCount } = useUrgentAlerts();
  const authenticatedProfileImage = useAuthenticatedImage((user as any)?.profileImageUrl);
  const { isMobileView } = useViewMode();
  
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  // Fetch doctor stats
  const { data: stats, isLoading: statsLoading } = useQuery<DoctorStats>({
    queryKey: ['/api/doctor/stats'],
    enabled: !!user?.isDoctor,
  });

  const services = [
    {
      id: 'ciry',
      label: 'Chiedi a CIRY',
      icon: MessageSquare,
      route: '/chat',
      badgeCount: 0,
      badgeText: null,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
    },
    {
      id: 'alerts',
      label: 'Alert Pazienti',
      icon: AlertTriangle,
      route: '/doctor/alerts',
      badgeCount: urgentAlertsCount,
      badgeText: null,
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
    },
    {
      id: 'pazienti',
      label: 'I miei pazienti',
      icon: Users,
      route: '/doctor/patients',
      badgeCount: 0,
      badgeText: stats?.totalPatients ? `${stats.totalPatients}` : null,
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    },
    {
      id: 'prenotazioni',
      label: 'Prenotazioni',
      icon: CalendarCheck,
      route: '/doctor/appointments',
      badgeCount: 0,
      badgeText: stats?.todayAppointments ? `${stats.todayAppointments} oggi` : null,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
    },
    {
      id: 'referti',
      label: 'Note e Referti',
      icon: FileCheck,
      route: '/doctor/reports',
      badgeCount: 0,
      badgeText: null,
      color: 'text-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
    },
    {
      id: 'condividi',
      label: 'Condividi codice',
      icon: Share2,
      route: '/doctor/share-code',
      badgeCount: 0,
      badgeText: null,
      color: 'text-pink-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-pink-100',
    },
  ];

  return (
    <section 
      data-testid="doctor-dashboard" 
      className={cn(
        "min-h-screen bg-gradient-to-b from-orange-50 to-white p-4",
        isMobileView ? "pb-24" : "pb-8 pl-64"
      )}
    >
      <div className={cn("mx-auto space-y-6", isMobileView ? "max-w-2xl" : "max-w-4xl")}>
        <DashboardHero
          displayName={displayName}
          initials={initials}
          profileImageUrl={authenticatedProfileImage}
          subtitle="Sono a tua disposizione per supportarti nella prevenzione 🩺"
          rolePrefix="dott."
        />

        {statsLoading ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="h-20 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ) : stats && (
          <StatCard 
            title="Panoramica"
            icon={Activity}
            className="from-orange-500 to-orange-600 mb-6"
            testId="quick-stats-banner"
            stats={[
              { value: stats.totalPatients, label: "pazienti", testId: "stat-patients" },
              { value: stats.criticalAlerts, label: "alert critici", testId: "stat-alerts" },
              { value: stats.todayAppointments, label: "oggi", testId: "stat-appointments" },
            ]}
          />
        )}

        <ServiceGrid 
          services={services} 
          columns={2}
          cardHeight="140px"
          showGradient={true}
        />
      </div>
    </section>
  );
}
