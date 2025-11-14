import { Link, useLocation } from "wouter";
import { Home, MessageSquare, Stethoscope, CalendarCheck, Bell, AlertTriangle, Users, Settings, Shield, FileText, Watch, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications, useUrgentAlerts } from "@/hooks/useNotificationBadge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ViewToggle } from "@/components/ViewToggle";
import { useViewMode } from "@/contexts/ViewModeContext";

type BadgeType = "notifications" | "alerts" | null;

interface DesktopNavTab {
  route: string;
  icon: LucideIcon;
  label: string;
  badgeType: BadgeType;
  testId: string;
}

const patientTabs: DesktopNavTab[] = [
  {
    route: "/",
    icon: Home,
    label: "Home",
    badgeType: null,
    testId: "desktop-nav-home",
  },
  {
    route: "/settings",
    icon: Settings,
    label: "Impostazioni",
    badgeType: null,
    testId: "desktop-nav-settings",
  },
  {
    route: "/guida",
    icon: FileText,
    label: "Guida",
    badgeType: null,
    testId: "desktop-nav-guida",
  },
  {
    route: "/security",
    icon: Shield,
    label: "Sicurezza",
    badgeType: null,
    testId: "desktop-nav-security",
  },
  {
    route: "/wearable",
    icon: Activity,
    label: "Dispositivi",
    badgeType: null,
    testId: "desktop-nav-dispositivi",
  },
];

const doctorTabs: DesktopNavTab[] = [
  {
    route: "/",
    icon: Home,
    label: "Home",
    badgeType: null,
    testId: "desktop-nav-home",
  },
  {
    route: "/settings",
    icon: Settings,
    label: "Impostazioni",
    badgeType: null,
    testId: "desktop-nav-settings",
  },
  {
    route: "/security",
    icon: Shield,
    label: "Sicurezza",
    badgeType: null,
    testId: "desktop-nav-security",
  },
  {
    route: "/guida",
    icon: FileText,
    label: "Guida",
    badgeType: null,
    testId: "desktop-nav-guida",
  },
];

function isActive(tabRoute: string, currentLocation: string): boolean {
  if (tabRoute === "/") {
    return currentLocation === "/";
  }
  return currentLocation.startsWith(tabRoute);
}

interface TabItemProps {
  tab: DesktopNavTab;
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
          "flex items-center gap-3 px-4 py-2.5 rounded-lg relative cursor-pointer",
          "transition-all duration-200 hover:bg-accent/50",
          active ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="relative">
          <Icon className={cn("w-5 h-5", active && "stroke-[2.5px]")} />
          {badgeCount !== undefined && badgeCount > 0 && (
            <Badge 
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {badgeCount > 9 ? "9+" : badgeCount}
            </Badge>
          )}
        </div>
        <span className="text-sm">{tab.label}</span>
      </a>
    </Link>
  );
}

export default function DesktopNavigation() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const { count: notificationsCount } = useUnreadNotifications();
  const { count: alertsCount } = useUrgentAlerts();
  const { isMobileView } = useViewMode();

  if (isLoading || !isAuthenticated || isMobileView) {
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
      data-testid="desktop-nav"
      className="fixed left-0 top-0 bottom-0 w-64 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r flex-col p-4 gap-2 flex"
    >
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <img src="/images/ciry-main-logo.png" alt="CIRY" className="h-8" />
        </div>
        <ViewToggle />
      </div>

      <div className="flex flex-col gap-1">
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
