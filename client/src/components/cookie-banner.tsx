import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import { Link } from "wouter";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem("cookie-consent", "all");
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem("cookie-consent", "necessary");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <Card className="max-w-4xl mx-auto shadow-2xl border-2">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Cookie className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-bold text-lg">Utilizzo dei Cookie</h3>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  Utilizziamo cookie essenziali per garantire il corretto funzionamento della piattaforma 
                  (autenticazione, sessioni, preferenze). Non utilizziamo cookie di profilazione o pubblicità. 
                  I dati raccolti sono utilizzati esclusivamente per migliorare la tua esperienza di apprendimento.
                </p>
                <Link 
                  href="/page/privacy-policy"
                  className="text-primary hover:underline font-medium" 
                  data-testid="link-privacy-policy"
                >
                  Leggi l'informativa sulla privacy →
                </Link>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button 
                  onClick={acceptAll}
                  className="font-semibold"
                  data-testid="button-accept-cookies"
                >
                  Accetta tutti
                </Button>
                <Button 
                  onClick={acceptNecessary}
                  variant="outline"
                  className="font-semibold"
                  data-testid="button-accept-necessary"
                >
                  Solo necessari
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={acceptNecessary}
              data-testid="button-close-banner"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
