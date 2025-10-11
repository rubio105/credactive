import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, HelpCircle, Settings, Calendar, FileText, Video, Building2, Key, Mail, BarChart3, Home, Tv, MessageSquare, Book, Shield, Gift, CreditCard, Database } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminQuizzes } from "@/components/admin/AdminQuizzes";
import { AdminQuestions } from "@/components/admin/AdminQuestions";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminAPIKeys } from "@/components/admin/AdminAPIKeys";
import { AdminLiveCourses } from "@/components/admin/AdminLiveCourses";
import { AdminContentPages } from "@/components/admin/AdminContentPages";
import { AdminOnDemandCourses } from "@/components/admin/AdminOnDemandCourses";
import { AdminCorporateAgreements } from "@/components/admin/AdminCorporateAgreements";
import { AdminEmailTemplates } from "@/components/admin/AdminEmailTemplates";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminMarketing } from "@/components/admin/AdminMarketing";
import { AdminLiveSessions } from "@/components/admin/AdminLiveSessions";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminDocumentation } from "@/components/admin/AdminDocumentation";
import { AdminPrevention } from "@/components/admin/AdminPrevention";
import { AdminProhmedCodes } from "@/components/admin/AdminProhmedCodes";
import { AdminWebinarHealth } from "@/components/admin/AdminWebinarHealth";
import { AdminSubscriptionPlans } from "@/components/admin/AdminSubscriptionPlans";
import { AdminKnowledgeBase } from "@/components/admin/AdminKnowledgeBase";

const menuItems = [
  { id: "analytics", icon: BarChart3, label: "Analytics", testId: "tab-analytics" },
  { id: "feedback", icon: MessageSquare, label: "Feedback", testId: "tab-feedback" },
  { id: "marketing", icon: Mail, label: "Marketing", testId: "tab-marketing" },
  { id: "users", icon: Users, label: "Utenti", testId: "tab-users" },
  { id: "subscription-plans", icon: CreditCard, label: "Piani", testId: "tab-subscription-plans" },
  { id: "categories", icon: BookOpen, label: "Categorie", testId: "tab-categories" },
  { id: "quizzes", icon: BookOpen, label: "Quiz", testId: "tab-quizzes" },
  { id: "questions", icon: HelpCircle, label: "Domande", testId: "tab-questions" },
  { id: "live-courses", icon: Calendar, label: "Corsi Live", testId: "tab-live-courses" },
  { id: "live-sessions", icon: Tv, label: "Sessioni Live", testId: "tab-live-sessions" },
  { id: "webinar-health", icon: Shield, label: "Webinar Health", testId: "tab-webinar-health" },
  { id: "on-demand-courses", icon: Video, label: "Corsi On-Demand", testId: "tab-on-demand-courses" },
  { id: "pages", icon: FileText, label: "Pagine", testId: "tab-pages" },
  { id: "corporate", icon: Building2, label: "Aziende", testId: "tab-corporate" },
  { id: "prevention", icon: Shield, label: "AI Prohmed", testId: "tab-prevention" },
  { id: "prohmed-codes", icon: Gift, label: "Codici Prohmed", testId: "tab-prohmed-codes" },
  { id: "knowledge-base", icon: Database, label: "Knowledge Base", testId: "tab-knowledge-base" },
  { id: "email", icon: Mail, label: "Email", testId: "tab-email" },
  { id: "api", icon: Key, label: "API Keys", testId: "tab-api" },
  { id: "settings", icon: Settings, label: "Impostazioni", testId: "tab-settings" },
  { id: "documentation", icon: Book, label: "Documentazione", testId: "tab-documentation" },
];

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("analytics");

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
          <h2 className="text-xl font-bold mt-4">Admin Panel</h2>
          <p className="text-sm text-muted-foreground mt-1">CIRY</p>
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
            <p className="text-muted-foreground mt-1">Gestione completa della piattaforma</p>
          </div>
        </div>

        <div className="p-8">
          {activeTab === "analytics" && <AdminAnalytics />}
          {activeTab === "feedback" && <AdminFeedback />}
          {activeTab === "marketing" && <AdminMarketing />}
          {activeTab === "users" && <AdminUsers />}
          {activeTab === "subscription-plans" && <AdminSubscriptionPlans />}
          {activeTab === "categories" && <AdminCategories />}
          {activeTab === "quizzes" && <AdminQuizzes />}
          {activeTab === "questions" && <AdminQuestions />}
          {activeTab === "live-courses" && <AdminLiveCourses />}
          {activeTab === "live-sessions" && <AdminLiveSessions />}
          {activeTab === "webinar-health" && <AdminWebinarHealth />}
          {activeTab === "on-demand-courses" && <AdminOnDemandCourses />}
          {activeTab === "pages" && <AdminContentPages />}
          {activeTab === "corporate" && <AdminCorporateAgreements />}
          {activeTab === "prevention" && <AdminPrevention />}
          {activeTab === "prohmed-codes" && <AdminProhmedCodes />}
          {activeTab === "knowledge-base" && <AdminKnowledgeBase />}
          {activeTab === "email" && <AdminEmailTemplates />}
          {activeTab === "api" && <AdminAPIKeys />}
          {activeTab === "settings" && <AdminSettings />}
          {activeTab === "documentation" && <AdminDocumentation />}
        </div>
      </main>
    </div>
  );
}
