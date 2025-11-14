import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare,
  Stethoscope, 
  FileText, 
  Calendar, 
  Video,
  Bell,
  TrendingUp,
  Target,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useNotificationBadge";
import { usePreventionIndex, getPreventionTierMeta } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";
import { useViewMode } from "@/contexts/ViewModeContext";
import { DashboardHero, ServiceGrid } from "@/components/dashboard/DashboardPrimitives";
import { cn } from "@/lib/utils";

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
  const authenticatedProfileImage = useAuthenticatedImage((user as any)?.profileImageUrl);
  const { isMobileView } = useViewMode();
  
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
      label: 'Prevenzione live',
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
    <section 
      data-testid="patient-dashboard" 
      className={cn(
        "min-h-screen bg-gradient-to-b from-blue-50 to-white p-4",
        isMobileView ? "pb-24" : "pb-8 pl-64"
      )}
    >
      <div className={cn("mx-auto space-y-6", isMobileView ? "max-w-2xl" : "max-w-4xl")}>
        <DashboardHero
          displayName={displayName}
          initials={initials}
          profileImageUrl={authenticatedProfileImage}
          isPremium={(user as any)?.isPremium}
          subtitle="Come stai? Facciamo prevenzione insieme 💙"
          showPremiumUpgrade={true}
          showAvatar={false}
        />

        <div className="grid grid-cols-1 gap-4">
          {isLoadingIndex ? (
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : preventionIndex ? (
            <Card className="border-gray-200 shadow-md" data-testid="prevention-score-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-base">Indice di Prevenzione</h3>
                  </div>
                  <Badge className={`${getPreventionTierMeta(preventionIndex.tier).bgClass} text-white text-xs`}>
                    {getPreventionTierMeta(preventionIndex.tier).label}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">{preventionIndex.score}</span>
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                  <Progress value={preventionIndex.score} className="h-2" />
                  
                  <div className="flex items-start gap-2 bg-blue-50 p-2.5 rounded-lg mt-3">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">
                      {getPreventionTierMeta(preventionIndex.tier).suggestion}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <ServiceGrid 
          services={services} 
          columns={3}
          cardHeight="120px"
          showGradient={false}
        />
      </div>
    </section>
  );
}
