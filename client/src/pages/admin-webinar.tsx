import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function AdminWebinarPage() {
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
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestione Webinar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestisci webinar e corsi live</p>
        </div>

        <Card className="border-yellow-200 dark:border-yellow-900/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <CardTitle>Disponibile a breve</CardTitle>
            </div>
            <CardDescription>Webinar e corsi live per la formazione</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Questa funzionalità sarà disponibile a breve. Potrai organizzare webinar, gestire registrazioni 
              e offrire corsi live interattivi ai tuoi utenti.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
