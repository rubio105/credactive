import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, KeyRound, RefreshCw } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !code) {
      toast({
        title: "Campi mancanti",
        description: "Inserisci email e codice di verifica",
        variant: "destructive",
      });
      return;
    }

    if (code.length !== 6) {
      toast({
        title: "Codice non valido",
        description: "Il codice deve essere di 6 cifre",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await apiRequest('/api/auth/verify-email', 'POST', {
        email,
        code,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Email Verificata!",
          description: "Il tuo account è stato attivato con successo.",
        });

        // Invalidate auth query to refresh user state
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

        // Redirect to home page
        setTimeout(() => {
          setLocation("/");
        }, 1000);
      } else {
        throw new Error(data.message || "Verifica fallita");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({
        title: "Errore Verifica",
        description: error.message || "Codice non valido o scaduto",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({
        title: "Email mancante",
        description: "Inserisci la tua email",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);

    try {
      const response = await apiRequest('/api/auth/resend-verification', 'POST', {
        email,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Codice Inviato!",
          description: "Controlla la tua email per il nuovo codice di verifica.",
        });
        setCode("");
      } else {
        throw new Error(data.message || "Impossibile inviare il codice");
      }
    } catch (error: any) {
      console.error("Resend error:", error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare il codice",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verifica la tua Email</CardTitle>
          <CardDescription>
            Abbiamo inviato un codice di verifica a 6 cifre alla tua email. Inseriscilo qui sotto per attivare il tuo account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tua@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="input-verify-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Codice di Verifica</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="pl-10 text-center text-2xl tracking-widest font-mono"
                  required
                  maxLength={6}
                  data-testid="input-verification-code"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Il codice è valido per 15 minuti
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isVerifying || code.length !== 6}
              data-testid="button-verify"
            >
              {isVerifying ? "Verifica in corso..." : "Verifica Email"}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Non hai ricevuto il codice?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={isResending}
                className="w-full"
                data-testid="button-resend-code"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Invia Nuovo Codice
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
