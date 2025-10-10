import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/image_1759605874808.png";
import { Link } from "wouter";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast({
        title: "Link non valido",
        description: "Il link di recupero password non è valido o è scaduto",
        variant: "destructive",
      });
      setLocation("/forgot-password");
    }
  }, []);

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return checks;
  };

  const passwordChecks = validatePassword(password);
  const isPasswordValid = Object.values(passwordChecks).every(check => check);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      try {
        const res = await apiRequest("/api/auth/reset-password", "POST", data);
        return await res.json();
      } catch (error: any) {
        let errorMessage = "Il link di recupero non è valido o è scaduto. Richiedi un nuovo link.";
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
    onSuccess: () => {
      toast({
        title: "Password reimpostata",
        description: "La tua password è stata aggiornata con successo",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Il link di recupero non è valido o è scaduto. Richiedi un nuovo link.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci e conferma la nuova password",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password non corrispondenti",
        description: "Le due password inserite non coincidono",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: "Password non valida",
        description: "La password non soddisfa tutti i requisiti di sicurezza",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({ token, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="CIRY" className="h-12" />
          </div>
          <CardTitle className="text-2xl">Reimposta la password</CardTitle>
          <CardDescription>
            Crea una nuova password sicura per il tuo account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nuova Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Crea una password sicura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ripeti la password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                data-testid="input-confirmPassword"
              />
            </div>

            {password && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium mb-2">Requisiti password:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {passwordChecks.length ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={passwordChecks.length ? "text-green-600" : ""}>
                      Almeno 8 caratteri
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordChecks.uppercase ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={passwordChecks.uppercase ? "text-green-600" : ""}>
                      Una lettera maiuscola (A-Z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordChecks.lowercase ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={passwordChecks.lowercase ? "text-green-600" : ""}>
                      Una lettera minuscola (a-z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordChecks.number ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={passwordChecks.number ? "text-green-600" : ""}>
                      Un numero (0-9)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordChecks.special ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={passwordChecks.special ? "text-green-600" : ""}>
                      Un carattere speciale (!@#$%...)
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={resetPasswordMutation.isPending || !isPasswordValid}
              data-testid="button-submit"
            >
              {resetPasswordMutation.isPending ? "Aggiornamento in corso..." : "Reimposta password"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <Link 
              href="/login" 
              className="text-primary hover:underline" 
              data-testid="link-login"
            >
              Torna al login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
