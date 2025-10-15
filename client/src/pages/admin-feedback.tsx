import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminFeedbackPage() {
  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feedback Utenti</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestisci feedback e suggerimenti</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Utenti</CardTitle>
            <CardDescription>Recensioni e suggerimenti degli utenti</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Questa funzionalità sarà disponibile a breve.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
