import { Link, useLocation } from "wouter";
import { Home, MessageSquare, Stethoscope, CalendarCheck, Bell, AlertTriangle, Users, Settings, Shield, FileText, Watch, Activity, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications, useUrgentAlerts } from "@/hooks/useNotificationBadge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/ViewToggle";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useLogout } from "@/hooks/useLogout";

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
          "flex items-center gap-2 px-3 py-2 rounded-lg relative cursor-pointer whitespace-nowrap",
          "transition-all duration-200 hover:bg-accent/50",
          active ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="relative">
          <Icon className={cn("w-4 h-4", active && "stroke-[2.5px]")} />
          {badgeCount !== undefined && badgeCount > 0 && (
            <Badge 
              variant="destructive"
              className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[9px]"
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
  const handleLogout = useLogout();

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
      className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-50 flex items-center justify-between px-6"
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <img src="/images/ciry-main-logo.png" alt="CIRY" className="h-8" />
        </div>

        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <TabItem
              key={tab.route}
              tab={tab}
              active={isActive(tab.route, location)}
              badgeCount={getBadgeCount(tab.badgeType)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ViewToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Esci</span>
        </Button>
      </div>
    </nav>
  );
}
