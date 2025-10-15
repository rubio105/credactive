import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAlertsPage() {
  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Alert Medici</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestisci alert triage e urgenze</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alert Medici</CardTitle>
            <CardDescription>Sistema di alert triage per casi urgenti</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Questa funzionalità sarà disponibile a breve.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
