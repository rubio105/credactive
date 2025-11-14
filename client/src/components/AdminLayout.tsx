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
    console.log('[LOGOUT] Starting logout process...');
    try {
      console.log('[LOGOUT] Calling /api/auth/logout...');
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      console.log('[LOGOUT] Server logout successful, clearing client state...');
      
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('[LOGOUT] Redirecting to /login with window.location.href...');
      window.location.href = '/login';
    } catch (error) {
      console.error('[LOGOUT] Logout error:', error);
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  const isHomePage = location === "/admin";

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
      {/* Sidebar Verticale - Design Migliorato */}
      <aside className="w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col shadow-xl">
        {/* Logo & Header */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CIRY Admin</h1>
              <p className="text-xs text-blue-100">Pannello Amministrazione</p>
            </div>
          </div>
        </div>

        {/* Menu Items - Design Migliorato */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start group relative transition-all duration-200 ${
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md" 
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                  data-testid={item.testId}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`} />
                  <span className={`flex-1 text-left text-sm font-medium ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button - Design Migliorato */}
        <div className="p-3 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
            onClick={handleLogout}
            data-testid="button-admin-logout"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
            <span className="font-medium">Esci</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area - Design Migliorato */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar with Back Button */}
        {!isHomePage && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4 shadow-sm">
            <BackButton
              fallbackRoute="/admin"
              label="← Dashboard"
              variant="ghost"
              className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-medium h-9 px-4 transition-all"
              testId="button-back-to-dashboard"
            />
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
