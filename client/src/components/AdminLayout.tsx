import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  Video, 
  Database, 
  Mail, 
  Megaphone, 
  AlertTriangle, 
  MessageSquare,
  Bell,
  LogOut
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const menuItems = [
    { href: "/admin", icon: BarChart3, label: "Dashboard", testId: "nav-admin-dashboard" },
    { href: "/admin/users", icon: Users, label: "Gestione Utenti", testId: "nav-admin-users" },
    { href: "/admin/webinar", icon: Video, label: "Webinar", testId: "nav-admin-webinar" },
    { href: "/admin/rag", icon: Database, label: "Sistemi RAG", testId: "nav-admin-rag" },
    { href: "/admin/mail", icon: Mail, label: "Mail", testId: "nav-admin-mail" },
    { href: "/admin/marketing", icon: Megaphone, label: "Marketing", testId: "nav-admin-marketing" },
    { href: "/admin/alerts", icon: AlertTriangle, label: "Alert", testId: "nav-admin-alerts" },
    { href: "/admin/feedback", icon: MessageSquare, label: "Feedback", testId: "nav-admin-feedback" },
    { href: "/admin/push-notifications", icon: Bell, label: "Notifiche Push", testId: "nav-admin-push" },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Verticale */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">CIRY Admin</h1>
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
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
