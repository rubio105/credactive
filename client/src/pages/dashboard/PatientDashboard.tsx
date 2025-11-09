import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  FileText, 
  Activity, 
  Building2, 
  Shield, 
  ClipboardList, 
  Phone,
  Stethoscope,
  Calendar,
  HeartPulse
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useNotificationBadge";

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
  
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  const services = [
    {
      id: 'notifiche',
      label: 'Notifiche',
      icon: FileText,
      route: '/notifiche',
      badgeCount: unreadNotifications,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'analisi',
      label: 'Analisi',
      icon: Activity,
      route: '/chat',
      badgeCount: 0,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      id: 'medici',
      label: 'Medici',
      icon: Building2,
      route: '/medici',
      badgeCount: 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'wearable',
      label: 'Dispositivi',
      icon: HeartPulse,
      route: '/wearable',
      badgeCount: 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'storico',
      label: 'Storico',
      icon: ClipboardList,
      route: '/documenti',
      badgeCount: 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'assistenza',
      label: 'Assistenza',
      icon: Phone,
      route: '/guida',
      badgeCount: 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
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
            <p className="text-gray-600" data-testid="greeting-subtitle">
              Come ti senti oggi?
            </p>
          </div>
        </div>

        <Link href="/chat">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" data-testid="cta-autovalutazione">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-white text-lg font-semibold mb-1">
                    Inizia con la tua autovalutazione
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Parla con CIRY AI per analizzare i tuoi referti
                  </p>
                </div>
                <div className="ml-4 bg-white/20 rounded-full p-3">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

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
                    <span className="text-xs font-medium text-gray-700">
                      {service.label}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Link href="/prenotazioni">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl shadow-md"
            data-testid="prenota-btn"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Prenota Teleconsulto
          </Button>
        </Link>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-12 bg-blue-600 rounded"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Novità per te
              </h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Hai ricevuto nuovi consigli personalizzati di prevenzione</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Controlla i tuoi dispositivi wearable per dati aggiornati</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
