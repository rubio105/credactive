import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";

export default function AdminRAGPage() {
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

  if (!user?.isAdmin) {
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
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sistemi RAG</h1>
              <p className="text-muted-foreground mt-1">Gestisci knowledge base e documenti scientifici</p>
            </div>
            <Link 
              href="/admin" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              Torna al Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sistemi RAG</CardTitle>
            <CardDescription>Knowledge Base per AI Prevention</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Questa funzionalità sarà disponibile a breve.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
