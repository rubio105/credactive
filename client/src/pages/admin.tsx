import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, HelpCircle, Settings, Image, DollarSign, Calendar, FileText } from "lucide-react";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminQuizzes } from "@/components/admin/AdminQuizzes";
import { AdminQuestions } from "@/components/admin/AdminQuestions";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminLiveCourses } from "@/components/admin/AdminLiveCourses";
import { AdminContentPages } from "@/components/admin/AdminContentPages";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

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
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Pannello Amministrativo</h1>
          <p className="text-muted-foreground mt-1">Gestione completa della piattaforma IBI ACADEMY</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2" data-testid="tab-users">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Utenti</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2" data-testid="tab-categories">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Categorie</span>
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2" data-testid="tab-quizzes">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Quiz</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2" data-testid="tab-questions">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Domande</span>
            </TabsTrigger>
            <TabsTrigger value="live-courses" className="flex items-center gap-2" data-testid="tab-live-courses">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Corsi Live</span>
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-2" data-testid="tab-pages">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Pagine</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2" data-testid="tab-settings">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Impostazioni</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="categories">
            <AdminCategories />
          </TabsContent>

          <TabsContent value="quizzes">
            <AdminQuizzes />
          </TabsContent>

          <TabsContent value="questions">
            <AdminQuestions />
          </TabsContent>

          <TabsContent value="live-courses">
            <AdminLiveCourses />
          </TabsContent>

          <TabsContent value="pages">
            <AdminContentPages />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
