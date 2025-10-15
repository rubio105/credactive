import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAIPreventionPage() {
  const { user, isLoading } = useAuth();

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

  if (!(user as any)?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>
              Non hai i permessi necessari per accedere a questa sezione.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Prevention</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestisci sistema AI per prevenzione sanitaria</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gestione AI Prevention</CardTitle>
            <CardDescription>Sezione in sviluppo</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Questa funzionalità sarà disponibile a breve.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
