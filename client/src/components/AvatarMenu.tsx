import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  Shield,
  FileText,
  Watch,
  MessageCircle,
  GraduationCap,
  Share2,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type Role = "patient" | "doctor" | "admin";

interface MenuItem {
  route?: string;
  icon: LucideIcon;
  label: string;
  onSelect?: () => void;
  variant?: "default" | "destructive";
  testId: string;
}

interface MenuSection {
  id: string;
  items: MenuItem[];
  showDividerAfter?: boolean;
}

interface AvatarMenuProps {
  className?: string;
}

function getUserRole(user: any): Role {
  if (user?.isAdmin) return "admin";
  if (user?.isDoctor) return "doctor";
  return "patient";
}

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

export default function AvatarMenu({ className }: AvatarMenuProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const handleLogout = useLogout();

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className={cn("w-10 h-10 rounded-full bg-muted animate-pulse", className)} />
    );
  }

  const role = getUserRole(user);
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  const patientSections: MenuSection[] = [
    {
      id: "main",
      items: [
        {
          route: "/settings",
          icon: Settings,
          label: "Impostazioni",
          testId: "menu-item-settings",
        },
        {
          route: "/settings/security",
          icon: Shield,
          label: "Sicurezza & Privacy",
          testId: "menu-item-security",
        },
        {
          route: "/settings/privacy",
          icon: FileText,
          label: "Guida e Consensi",
          testId: "menu-item-privacy",
        },
        {
          route: "/wearable",
          icon: Watch,
          label: "Wearable",
          testId: "menu-item-wearable",
        },
        {
          route: "/settings/whatsapp",
          icon: MessageCircle,
          label: "WhatsApp Integration",
          testId: "menu-item-whatsapp",
        },
        {
          route: "/webinar",
          icon: GraduationCap,
          label: "Webinar",
          testId: "menu-item-webinar",
        },
      ],
      showDividerAfter: true,
    },
    {
      id: "actions",
      items: [
        {
          icon: LogOut,
          label: "Logout",
          onSelect: handleLogout,
          variant: "destructive",
          testId: "menu-item-logout",
        },
      ],
    },
  ];

  const doctorSections: MenuSection[] = [
    {
      id: "main",
      items: [
        {
          route: "/doctor/share-code",
          icon: Share2,
          label: "Condividi Codice Paziente",
          testId: "menu-item-share-code",
        },
        {
          route: "/settings/privacy",
          icon: FileText,
          label: "Consensi",
          testId: "menu-item-privacy",
        },
        {
          route: "/settings/whatsapp",
          icon: MessageCircle,
          label: "Alert WhatsApp",
          testId: "menu-item-whatsapp",
        },
        {
          route: "/settings",
          icon: Settings,
          label: "Impostazioni",
          testId: "menu-item-settings",
        },
      ],
      showDividerAfter: true,
    },
    {
      id: "actions",
      items: [
        {
          icon: LogOut,
          label: "Logout",
          onSelect: handleLogout,
          variant: "destructive",
          testId: "menu-item-logout",
        },
      ],
    },
  ];

  const sections = role === "doctor" || role === "admin" ? doctorSections : patientSections;

  const isActive = (route?: string): boolean => {
    if (!route) return false;
    if (route === "/") return location === "/";
    return location.startsWith(route);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="avatar-trigger"
          className={cn(
            "rounded-full border-2 border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all hover:scale-105",
            className
          )}
        >
          <Avatar className="w-10 h-10">
            {(user as any)?.profileImageUrl && (
              <AvatarImage src={(user as any).profileImageUrl} alt={displayName} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 max-h-80 overflow-y-auto p-2 space-y-1"
        align="end"
      >
        <div className="px-2 py-3 mb-2" data-testid="menu-header">
          <p className="text-sm font-medium leading-none">{displayName}</p>
          <p className="text-xs text-muted-foreground mt-1">{(user as any)?.email}</p>
        </div>

        {sections.map((section, sectionIdx) => (
          <div key={section.id}>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.route);

              if (item.route) {
                return (
                  <Link key={item.testId} href={item.route}>
                    <DropdownMenuItem
                      data-testid={item.testId}
                      className={cn(
                        "flex items-center gap-2 px-2 py-2 rounded-md text-sm cursor-pointer",
                        active && "bg-accent text-accent-foreground",
                        item.variant === "destructive" && "text-destructive focus:text-destructive"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  </Link>
                );
              }

              return (
                <DropdownMenuItem
                  key={item.testId}
                  data-testid={item.testId}
                  onClick={item.onSelect}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-md text-sm cursor-pointer",
                    item.variant === "destructive" && "text-destructive focus:text-destructive"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </DropdownMenuItem>
              );
            })}

            {section.showDividerAfter && sectionIdx < sections.length - 1 && (
              <DropdownMenuSeparator className="my-2" />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
