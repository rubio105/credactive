import { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import { Crown, Video, Headphones } from "lucide-react";

export default function Subscribe() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorizzato",
        description: "Devi effettuare il login",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Abbonamento AI Prevenzione Plus</h1>
          <p className="text-xl text-muted-foreground">
            Sblocca tutti i vantaggi della prevenzione salute
          </p>
        </div>

        {/* Benefits Cards - Simple 3-item display */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Passa a Plus</h3>
              <p className="text-sm text-muted-foreground">
                Accesso illimitato all'AI Prevenzione
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Contatto medico H24</h3>
              <p className="text-sm text-muted-foreground">
                Assistenza medica sempre disponibile
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Webinar sulla prevenzione</h3>
              <p className="text-sm text-muted-foreground">
                Partecipa ai webinar educativi gratuiti
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Contatta l'amministrazione per attivare il piano Plus</h2>
            <p className="text-muted-foreground mb-6">
              Per informazioni sui piani disponibili e per procedere con l'attivazione, contatta il team amministrativo
            </p>
            <Button 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => window.location.href = 'mailto:admin@ciry.app'}
              data-testid="button-contact-admin"
            >
              <Headphones className="w-5 h-5 mr-2" />
              Contatta Amministrazione
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
