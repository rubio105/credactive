import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Home, Shield, Gift, Database, BarChart3, UserCheck } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminEmailTemplates } from "@/components/admin/AdminEmailTemplates";
import { AdminMarketing } from "@/components/admin/AdminMarketing";
import { AdminPrevention } from "@/components/admin/AdminPrevention";
import { AdminProhmedCodes } from "@/components/admin/AdminProhmedCodes";
import { AdminWebinarHealth } from "@/components/admin/AdminWebinarHealth";
import { AdminKnowledgeBase } from "@/components/admin/AdminKnowledgeBase";
import { AdminProfessionalRequests } from "@/components/admin/AdminProfessionalRequests";

const menuItems = [
  { id: "dashboard", icon: BarChart3, label: "Dashboard", testId: "tab-dashboard" },
  { id: "users", icon: Users, label: "Gestione Utenti", testId: "tab-users" },
  { id: "professional-requests", icon: UserCheck, label: "Richieste Professionali", testId: "tab-professional-requests" },
  { id: "prevention", icon: Shield, label: "AI Prohmed", testId: "tab-prevention" },
  { id: "marketing", icon: Mail, label: "Marketing", testId: "tab-marketing" },
  { id: "email", icon: Mail, label: "Template Email", testId: "tab-email" },
  { id: "knowledge-base", icon: Database, label: "Documenti Scientifici", testId: "tab-knowledge-base" },
  { id: "webinar-health", icon: Shield, label: "Webinar Salute", testId: "tab-webinar-health" },
  { id: "prohmed-codes", icon: Gift, label: "Codici Accesso", testId: "tab-prohmed-codes" },
];

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>
              Non hai i permessi necessari per accedere al pannello amministrativo.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Verticale */}
      <aside className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Home className="w-4 h-4" />
            Torna alla Home
          </Link>
          <h2 className="text-xl font-bold mt-4">Pannello Sanitario</h2>
          <p className="text-sm text-muted-foreground mt-1">Gestione Sistema Prohmed</p>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  data-testid={item.testId}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Contenuto Principale */}
      <main className="flex-1 overflow-auto">
        <div className="border-b bg-background sticky top-0 z-10">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold">
              {menuItems.find(item => item.id === activeTab)?.label || "Pannello Amministrativo"}
            </h1>
            <p className="text-muted-foreground mt-1">Sistema di gestione sanitaria e prevenzione</p>
          </div>
        </div>

        <div className="p-8">
          {activeTab === "dashboard" && <AdminDashboard />}
          {activeTab === "users" && <AdminUsers />}
          {activeTab === "professional-requests" && <AdminProfessionalRequests />}
          {activeTab === "prevention" && <AdminPrevention />}
          {activeTab === "marketing" && <AdminMarketing />}
          {activeTab === "email" && <AdminEmailTemplates />}
          {activeTab === "knowledge-base" && <AdminKnowledgeBase />}
          {activeTab === "webinar-health" && <AdminWebinarHealth />}
          {activeTab === "prohmed-codes" && <AdminProhmedCodes />}
        </div>
      </main>
    </div>
  );
}
