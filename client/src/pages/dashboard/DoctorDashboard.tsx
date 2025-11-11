import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
    <section data-testid="doctor-dashboard" className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-4 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
            <AvatarImage src={authenticatedProfileImage || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900" data-testid="greeting-title">
              Ciao dott. {displayName}
            </h1>
            <p className="text-gray-600 text-sm" data-testid="greeting-subtitle">
              Sono a tua disposizione per supportarti nella prevenzione 🩺
            </p>
          </div>
        </div>

        {/* Quick Stats Banner */}
        {statsLoading ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : stats && (
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-md mb-6" data-testid="quick-stats-banner">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-white" />
                <p className="text-white text-xs font-medium">Panoramica</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-white">
                <div className="text-center" data-testid="stat-patients">
                  <p className="text-2xl font-bold">{stats.totalPatients}</p>
                  <p className="text-xs opacity-90">pazienti</p>
                </div>
                <div className="text-center" data-testid="stat-alerts">
                  <p className="text-2xl font-bold">{stats.criticalAlerts}</p>
                  <p className="text-xs opacity-90">alert critici</p>
                </div>
                <div className="text-center" data-testid="stat-appointments">
                  <p className="text-2xl font-bold">{stats.todayAppointments}</p>
                  <p className="text-xs opacity-90">oggi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link key={service.id} href={service.route}>
                <Card 
                  className="relative hover:shadow-lg hover:scale-105 transition-all cursor-pointer border-0 shadow-md"
                  data-testid={`service-${service.id}`}
                >
                  <CardContent className={`p-6 flex flex-col items-center justify-center text-center min-h-[140px] ${service.bgColor}`}>
                    <div className={`p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm mb-3`}>
                      <Icon className={`w-8 h-8 ${service.color}`} />
                    </div>
                    <div className="w-full">
                      <p className="font-bold text-sm text-gray-900 leading-tight">{service.label}</p>
                      {service.badgeText && !statsLoading && (
                        <p className="text-xs text-gray-600 mt-1" data-testid={`text-${service.id}`}>
                          {service.badgeText}
                        </p>
                      )}
                    </div>
                    {service.badgeCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs shadow-md"
                        data-testid={`badge-${service.id}`}
                      >
                        {service.badgeCount}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
