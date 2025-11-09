import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare,
  Stethoscope, 
  FileText, 
  Calendar, 
  Video,
  Bell,
  TrendingUp,
  Target
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useNotificationBadge";
import { usePreventionIndex, getPreventionTierMeta } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

function getUserDisplayName(user: any): string {
  if (user?.firstName || user?.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  return user?.email?.split('@')[0] || 'Utente';
}

function getUserInitials(user: any): string {
  const name = getUserDisplayName(user);
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const { count: unreadNotifications } = useUnreadNotifications();
  const { data: preventionIndex, isLoading: isLoadingIndex } = usePreventionIndex();
  
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
      id: 'medici',
      label: 'I miei medici',
      icon: Stethoscope,
      route: '/medici',
      badgeCount: 0,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'documenti',
      label: 'Documenti',
      icon: FileText,
      route: '/documenti',
      badgeCount: 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'prenotazioni',
      label: 'Prenotazioni',
      icon: Calendar,
      route: '/prenotazioni',
      badgeCount: 0,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'webinar',
      label: 'Prevenzione in diretta',
      icon: Video,
      route: '/webinar',
      badgeCount: 0,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      id: 'notifiche',
      label: 'Notifiche',
      icon: Bell,
      route: '/notifiche',
      badgeCount: unreadNotifications,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <section data-testid="patient-dashboard" className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
            <AvatarImage src={(user as any)?.profileImageUrl} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="greeting-title">
              Ciao, {displayName}
            </h1>
            <p className="text-gray-600 text-sm" data-testid="greeting-subtitle">
              Come stai? Facciamo prevenzione insieme 💙
            </p>
          </div>
        </div>

        {isLoadingIndex ? (
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : preventionIndex ? (
          <Card className="border-gray-200 shadow-md" data-testid="prevention-score-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">Indice di Prevenzione</h3>
                </div>
                <Badge className={`${getPreventionTierMeta(preventionIndex.tier).bgClass} text-white`}>
                  {getPreventionTierMeta(preventionIndex.tier).label}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">{preventionIndex.score}</span>
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>
                <Progress value={preventionIndex.score} className="h-3" />
                
                <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg mt-4">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    {getPreventionTierMeta(preventionIndex.tier).suggestion}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

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
