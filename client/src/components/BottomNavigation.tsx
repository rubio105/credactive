import { Link, useLocation } from "wouter";
import { Home, MessageSquare, Stethoscope, Calendar, Bell, AlertTriangle, Users, Settings, Shield, FileText, Watch } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications, useUrgentAlerts } from "@/hooks/useNotificationBadge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type BadgeType = "notifications" | "alerts" | null;

interface BottomNavTab {
  route: string;
  icon: LucideIcon;
  label: string;
  badgeType: BadgeType;
  testId: string;
}

interface BottomNavigationProps {
  className?: string;
}

const patientTabs: BottomNavTab[] = [
  {
    route: "/",
    icon: Home,
    label: "Home",
    badgeType: null,
    testId: "bottom-nav-home",
  },
  {
    route: "/settings",
    icon: Settings,
    label: "Impostazioni",
    badgeType: null,
    testId: "bottom-nav-settings",
  },
  {
    route: "/guida",
    icon: FileText,
    label: "Guida",
    badgeType: null,
    testId: "bottom-nav-guida",
  },
  {
    route: "/security",
    icon: Shield,
    label: "Sicurezza",
    badgeType: null,
    testId: "bottom-nav-security",
  },
  {
    route: "/notifiche",
    icon: Bell,
    label: "Notifiche",
    badgeType: "notifications",
    testId: "bottom-nav-notifiche",
  },
];

const doctorTabs: BottomNavTab[] = [
  {
    route: "/",
    icon: Home,
    label: "Home",
    badgeType: null,
    testId: "bottom-nav-home",
  },
  {
    route: "/chat",
    icon: MessageSquare,
    label: "CIRY",
    badgeType: null,
    testId: "bottom-nav-ciry",
  },
  {
    route: "/doctor/alerts",
    icon: AlertTriangle,
    label: "Alert",
    badgeType: "alerts",
    testId: "bottom-nav-alerts",
  },
  {
    route: "/doctor/patients",
    icon: Users,
    label: "Pazienti",
    badgeType: null,
    testId: "bottom-nav-patients",
  },
  {
    route: "/doctor/appointments",
    icon: Calendar,
    label: "Agenda",
    badgeType: null,
    testId: "bottom-nav-agenda",
  },
];

function isActive(tabRoute: string, currentLocation: string): boolean {
  if (tabRoute === "/") {
    return currentLocation === "/";
  }
  return currentLocation.startsWith(tabRoute);
}

interface TabItemProps {
  tab: BottomNavTab;
  active: boolean;
  badgeCount?: number;
}

function TabItem({ tab, active, badgeCount }: TabItemProps) {
  const Icon = tab.icon;
  
  return (
    <Link href={tab.route}>
      <a
        data-testid={tab.testId}
        aria-label={tab.label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg relative cursor-pointer",
          "transition-colors duration-200 active:scale-95",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        <div className="relative">
          <Icon className={cn("w-5 h-5", active && "stroke-[2.5px]")} />
          {badgeCount !== undefined && badgeCount > 0 && (
            <div className="absolute -top-1 -right-3 h-5 w-5 rounded-full bg-destructive text-[10px] text-destructive-foreground font-medium flex items-center justify-center">
              {badgeCount > 9 ? "9+" : badgeCount}
            </div>
          )}
        </div>
        <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
          {tab.label}
        </span>
      </a>
    </Link>
  );
}

export default function BottomNavigation({ className }: BottomNavigationProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const { count: notificationsCount } = useUnreadNotifications();
  const { count: alertsCount } = useUrgentAlerts();

  if (isLoading) {
    return (
      <nav
        role="navigation"
        data-testid="bottom-nav-skeleton"
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          className
        )}
      >
        <div className="flex justify-between items-center h-16 px-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-2 px-3">
              <div className="w-5 h-5 bg-muted rounded" />
              <div className="w-12 h-2 bg-muted rounded" />
            </div>
          ))}
        </div>
      </nav>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isDoctor = (user as any)?.isDoctor;
  const isAdmin = (user as any)?.isAdmin;
  
  const tabs = isDoctor && !isAdmin ? doctorTabs : patientTabs;

  const getBadgeCount = (badgeType: BadgeType): number | undefined => {
    if (badgeType === "notifications") return notificationsCount;
    if (badgeType === "alerts") return alertsCount;
    return undefined;
  };

  return (
    <nav
      role="navigation"
      data-testid="bottom-nav"
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe",
        className
      )}
    >
      <div className="flex justify-between items-center h-16 px-2">
        {tabs.map((tab) => (
          <TabItem
            key={tab.route}
            tab={tab}
            active={isActive(tab.route, location)}
            badgeCount={getBadgeCount(tab.badgeType)}
          />
        ))}
      </div>
    </nav>
  );
}
