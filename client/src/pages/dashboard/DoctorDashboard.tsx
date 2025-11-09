import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare,
  AlertTriangle,
  Users,
  Calendar,
  ClipboardList,
  Share2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUrgentAlerts } from "@/hooks/useNotificationBadge";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";

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

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { count: urgentAlertsCount } = useUrgentAlerts();
  const authenticatedProfileImage = useAuthenticatedImage((user as any)?.profileImageUrl);
  
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  const services = [
    {
      id: 'ciry',
      label: 'Parla con CIRY',
      icon: MessageSquare,
      route: '/chat',
      badgeCount: 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'alerts',
      label: 'Alert',
      icon: AlertTriangle,
      route: '/doctor/alerts',
      badgeCount: urgentAlertsCount,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      id: 'pazienti',
      label: 'I miei pazienti',
      icon: Users,
      route: '/doctor/patients',
      badgeCount: 0,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'prenotazioni',
      label: 'Prenotazioni',
      icon: Calendar,
      route: '/doctor/appointments',
      badgeCount: 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: ClipboardList,
      route: '/doctor/availability',
      badgeCount: 0,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'condividi',
      label: 'Condividi codice',
      icon: Share2,
      route: '/doctor/share-code',
      badgeCount: 0,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <section data-testid="doctor-dashboard" className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
            <AvatarImage src={authenticatedProfileImage || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="greeting-title">
              Ciao dott. {displayName}
            </h1>
            <p className="text-gray-600 text-sm" data-testid="greeting-subtitle">
              Sono a tua disposizione per supportarti nella prevenzione 🩺
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link key={service.id} href={service.route}>
                <Card 
                  className="relative hover:shadow-md transition-shadow cursor-pointer border-gray-200"
                  data-testid={`service-${service.id}`}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                    {service.badgeCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                        data-testid={`badge-${service.id}`}
                      >
                        {service.badgeCount}
                      </Badge>
                    )}
                    <div className={`${service.bgColor} rounded-full p-3`}>
                      <Icon className={`h-6 w-6 ${service.color}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 leading-tight">
                      {service.label}
                    </span>
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
