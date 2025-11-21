import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
const logoImage = "/images/ciry-main-logo.png";
import { Link } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [requiresMfa, setRequiresMfa] = useState(false);
  
  // Get redirect parameter from URL query string
  const getRedirectUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') || null;
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const typedUser = user as any;
      console.log('[Login Guard] User already authenticated, redirecting...');
      
      // Check if there's a redirect URL from protected route
      const redirectUrl = getRedirectUrl();
      if (redirectUrl) {
        console.log('[Login Guard] Redirecting to:', redirectUrl);
        setLocation(redirectUrl);
        return;
      }
      
      // Default role-based redirects
      if (typedUser.isAdmin) {
        setLocation("/admin");
      } else if (typedUser.aiOnlyAccess) {
        setLocation("/prevention");
      } else if (typedUser.isDoctor) {
        setLocation("/doctor/patients");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; mfaCode?: string }) => {
      try {
        const res = await apiRequest("/api/auth/login", "POST", data);
        return await res.json();
      } catch (error: any) {
        let errorMessage = "Email o password non corretti. Verifica le tue credenziali.";
        if (error.message) {
          try {
            const match = error.message.match(/\{.*\}/);
            if (match) {
              const jsonError = JSON.parse(match[0]);
              errorMessage = jsonError.message || errorMessage;
            }
          } catch {}
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      // Check if MFA is required
      if (data?.requiresMfa) {
        setRequiresMfa(true);
        toast({
          title: "Autenticazione a due fattori",
          description: data.message || "Inserisci il codice dal tuo authenticator",
        });
        return;
      }

      // Direct redirect to dashboard without toast/dialog
      // Role-based redirect logic - use wouter for internal navigation
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (data?.isAdmin) {
        // Admin → Dashboard amministratore
        setLocation("/admin");
      } else if (data?.aiOnlyAccess) {
        // Utenti AI-only → Prevenzione (unica area accessibile)
        setLocation("/prevention");
      } else {
        // Dottore e Pazienti → Dashboard principale (role-aware routing)
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Accesso non riuscito",
        description: error.message || "Email o password non corretti. Verifica le tue credenziali.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci email e password per accedere",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes("@")) {
      toast({
        title: "Email non valida",
        description: "Inserisci un indirizzo email valido",
        variant: "destructive",
      });
      return;
    }

    if (requiresMfa && !mfaCode) {
      toast({
        title: "Codice MFA richiesto",
        description: "Inserisci il codice di autenticazione a due fattori",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({ email, password, mfaCode: mfaCode || undefined });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="CIRY" className="h-20" />
          </div>
          <CardTitle className="text-2xl">Accedi al tuo account</CardTitle>
          <CardDescription>
            Inserisci le tue credenziali per accedere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={requiresMfa}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={requiresMfa}
                data-testid="input-password"
              />
            </div>
            {requiresMfa && (
              <div className="space-y-2">
                <Label htmlFor="mfaCode">Codice Autenticazione (MFA) *</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  maxLength={6}
                  pattern="[0-9]*"
                  autoFocus
                  data-testid="input-mfa-code"
                />
                <p className="text-sm text-muted-foreground">
                  Inserisci il codice a 6 cifre dal tuo authenticator
                </p>
              </div>
            )}
            {!requiresMfa && (
              <div className="flex justify-end">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:underline" 
                  data-testid="link-forgot-password"
                >
                  Hai dimenticato la password?
                </Link>
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Accesso in corso..." : requiresMfa ? "Verifica e Accedi" : "Accedi"}
            </Button>
          </form>

          <div className="mt-6 text-center border-t pt-6">
            <p className="text-sm text-muted-foreground mb-3">
              Non hai ancora un account?
            </p>
            <Link href="/register-choice">
              <Button variant="outline" className="w-full" data-testid="button-go-to-register">
                Registrati
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
