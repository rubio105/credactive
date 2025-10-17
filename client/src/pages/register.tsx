import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

const logoImage = "/images/ciry-main-logo.png";

export default function Register() {
  const [, setLocation] = useLocation();

  // Auto-redirect to login after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/login");
    }, 5000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="CIRY Logo" 
              className="h-16 w-auto"
            />
          </div>
          <div className="flex justify-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Registrazione Non Disponibile
          </CardTitle>
          <CardDescription className="text-base">
            Al momento la registrazione pubblica è disabilitata.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
              Per richiedere l'accesso alla piattaforma CIRY, 
              contatta il nostro team amministrativo.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/login">
              <Button className="w-full" size="lg" data-testid="button-go-to-login">
                Vai al Login
              </Button>
            </Link>
            
            <p className="text-xs text-center text-muted-foreground">
              Sarai automaticamente reindirizzato al login tra 5 secondi...
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-center text-muted-foreground">
              Hai domande? Contatta:{" "}
              <a 
                href="mailto:support@ciry.app" 
                className="text-primary hover:underline font-medium"
              >
                support@ciry.app
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
