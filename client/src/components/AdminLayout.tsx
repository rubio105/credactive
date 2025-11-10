import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { BackButton } from "@/components/BackButton";
import { 
  LayoutDashboard,
  Users,
  Crown,
  AlertTriangle,
  Video,
  Mail,
  Sparkles,
  Database,
  Bell,
  Shield,
  BookOpen,
  LogOut,
  MessageSquare,
  Brain,
  Zap
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();

  const menuItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard", testId: "nav-admin-dashboard" },
    { href: "/admin/users", icon: Users, label: "Gestione Utenti", testId: "nav-admin-users" },
    { href: "/admin/subscriptions", icon: Crown, label: "Abbonamenti", testId: "nav-admin-subscriptions" },
    { href: "/admin/alerts", icon: AlertTriangle, label: "Alert Medici", testId: "nav-admin-alerts" },
    { href: "/admin/proactive-triggers", icon: Zap, label: "Trigger Proattivi", testId: "nav-admin-proactive-triggers" },
    { href: "/admin/webinar", icon: Video, label: "Webinar Health", testId: "nav-admin-webinar" },
    { href: "/admin/feedback", icon: MessageSquare, label: "Feedback Utenti", testId: "nav-admin-feedback" },
    { href: "/admin/mail", icon: Mail, label: "Email Templates", testId: "nav-admin-mail" },
    { href: "/admin/marketing", icon: Sparkles, label: "AI Marketing", testId: "nav-admin-marketing" },
    { href: "/admin/rag", icon: Database, label: "Knowledge Base", testId: "nav-admin-rag" },
    { href: "/admin/in-app-notifications", icon: Bell, label: "Notifiche In-App", testId: "nav-admin-in-app-notifications" },
    { href: "/admin/push-notifications", icon: Bell, label: "Notifiche Push", testId: "nav-admin-push" },
    { href: "/admin/audit", icon: Shield, label: "Audit Log", testId: "nav-admin-audit" },
    { href: "/admin/ml-training", icon: Brain, label: "ML Training Data", testId: "nav-admin-ml" },
    { href: "/admin/documentazione", icon: BookOpen, label: "Documentazione", testId: "nav-admin-docs" },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      // Full page reload to ensure complete session cleanup
      window.location.assign('/login');
    } catch (error) {
      console.error('Logout error:', error);
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      window.location.assign('/login');
    }
  };

  const isHomePage = location === "/admin";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Verticale */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">CIRY Admin</h1>
          <p className="text-xs text-muted-foreground mt-1">Pannello Amministrazione</p>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    isActive 
                      ? "bg-primary/10 text-primary hover:bg-primary/20" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  data-testid={item.testId}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="flex-1 text-left">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
            data-testid="button-admin-logout"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Esci
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar with Back Button */}
        {!isHomePage && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
            <BackButton
              fallbackRoute="/admin"
              label="Torna alla Dashboard"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground text-sm h-9 px-3"
              testId="button-back-to-dashboard"
            />
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
