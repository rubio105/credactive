/**
 * DesktopNavigation - Barra di navigazione orizzontale superiore per visualizzazione desktop
 * 
 * VISIBILITÀ: Questo componente viene mostrato SOLO in modalità desktop (>= 768px).
 * In modalità mobile viene nascosto e sostituito da navigazione mobile dedicata.
 * 
 * LAYOUT: Logo | Tab di navigazione | Pulsante Logout
 * 
 * FUNZIONALITÀ:
 * - Navigazione role-based (pazienti vs medici hanno tab diverse)
 * - Badge per notifiche e alert non letti
 * - Highlighting della tab attiva
 * - Logout condiviso tramite hook useLogout
 */

import { Link, useLocation } from "wouter";
import { Home, MessageSquare, Stethoscope, CalendarCheck, Bell, AlertTriangle, Users, Settings, Shield, FileText, Watch, Activity, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications, useUrgentAlerts } from "@/hooks/useNotificationBadge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useLogout } from "@/hooks/useLogout";

/**
 * Tipo di badge che può essere mostrato su una tab
 * - "notifications": Mostra conteggio notifiche non lette
 * - "alerts": Mostra conteggio alert urgenti
 * - null: Nessun badge
 */
type BadgeType = "notifications" | "alerts" | null;

/**
 * Definizione di una tab di navigazione
 */
interface DesktopNavTab {
  route: string;           // Percorso della route (es. "/settings")
  icon: LucideIcon;        // Icona Lucide da mostrare
  label: string;           // Testo visualizzato
  badgeType: BadgeType;    // Tipo di badge da mostrare (se presente)
  testId: string;          // ID per test automatizzati
}

/**
 * Tab di navigazione per PAZIENTI
 * Ordine: Home, Impostazioni, Guida, Sicurezza, Dispositivi
 */
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

/**
 * Tab di navigazione per MEDICI
 * Ordine: Home, Impostazioni, Sicurezza, Guida
 * NOTA: I medici NON hanno accesso alla sezione "Dispositivi"
 */
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

/**
 * Determina se una tab è attiva basandosi sulla route corrente
 * 
 * LOGICA:
 * - Home ("/") è attiva SOLO se location è esattamente "/"
 * - Altre route sono attive se location inizia con la route (es. "/settings/privacy" attiva tab "/settings")
 * 
 * @param tabRoute - Route della tab da verificare
 * @param currentLocation - Location corrente dell'applicazione
 * @returns true se la tab deve essere evidenziata come attiva
 */
function isActive(tabRoute: string, currentLocation: string): boolean {
  if (tabRoute === "/") {
    // Home richiede match esatto per evitare che sia sempre attiva
    return currentLocation === "/";
  }
  // Altre route usano startsWith per includere sotto-route
  return currentLocation.startsWith(tabRoute);
}

/**
 * Props per il componente TabItem
 */
interface TabItemProps {
  tab: DesktopNavTab;      // Configurazione della tab
  active: boolean;         // Se la tab è attualmente attiva
  badgeCount?: number;     // Numero da mostrare nel badge (opzionale)
}

/**
 * TabItem - Singolo elemento di navigazione cliccabile
 * 
 * RENDERING:
 * - Icona della tab con badge numerato (se badgeCount > 0)
 * - Label testuale
 * - Stili diversi per stato attivo/inattivo
 * - Animazione hover
 * 
 * ACCESSIBILITÀ:
 * - aria-label per screen readers
 * - aria-current="page" quando attiva
 * - data-testid per testing automatizzato
 */
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

/**
 * DesktopNavigation - Componente principale della barra di navigazione desktop
 * 
 * CONDIZIONI DI RENDERING:
 * Questo componente ritorna null (non viene mostrato) se:
 * 1. Dati utente ancora in caricamento (isLoading)
 * 2. Utente non autenticato (isAuthenticated === false)
 * 3. Vista mobile attiva (isMobileView === true)
 * 
 * LOGICA ROLE-BASED:
 * - Medici (non admin) vedono doctorTabs
 * - Pazienti e Admin vedono patientTabs
 * 
 * STRUTTURA:
 * [Logo CIRY] [Tab Home] [Tab Settings] [...altre tab] [Spacer] [Logout Button]
 */
export default function DesktopNavigation() {
  // Hooks per autenticazione e location
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // Conteggi per i badge sulle tab
  const { count: notificationsCount } = useUnreadNotifications();
  const { count: alertsCount } = useUrgentAlerts();
  
  // Determina se siamo in vista mobile (per nascondere questa navbar)
  const { isMobileView } = useViewMode();
  
  // Hook per gestire il logout in modo centralizzato
  const handleLogout = useLogout();

  /**
   * EARLY RETURN: Non mostrare la navbar se:
   * - Stiamo ancora caricando i dati dell'utente
   * - L'utente non è autenticato
   * - Siamo in vista mobile (< 768px)
   * - L'utente è admin (usa AdminLayout con sidebar dedicata)
   */
  if (isLoading || !isAuthenticated || isMobileView) {
    return null;
  }

  // Determina il ruolo dell'utente per scegliere le tab appropriate
  const isDoctor = (user as any)?.isDoctor;
  const isAdmin = (user as any)?.isAdmin;
  
  // Admin users use AdminLayout, not DesktopNavigation
  if (isAdmin) {
    return null;
  }
  
  /**
   * Selezione delle tab basata sul ruolo:
   * - Medici (che non sono admin) → doctorTabs
   * - Tutti gli altri (pazienti e admin) → patientTabs
   */
  const tabs = isDoctor && !isAdmin ? doctorTabs : patientTabs;

  /**
   * Helper function per ottenere il conteggio del badge per una specifica tab
   * 
   * @param badgeType - Tipo di badge richiesto dalla tab
   * @returns Numero da mostrare nel badge o undefined se nessun badge
   */
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
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src="/images/ciry-main-logo.png" alt="CIRY" className="h-8" />
          </div>
        </Link>

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
