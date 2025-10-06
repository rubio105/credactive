import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/image_1759658677025.png";
import { Link } from "wouter";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
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
    onSuccess: () => {
      toast({
        title: "Accesso effettuato",
        description: "Benvenuto su CREDACTIVE!",
      });
      window.location.href = "/";
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

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="CREDACTIVE" className="h-12" />
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
                data-testid="input-password"
              />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password">
                <a className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                  Hai dimenticato la password?
                </a>
              </Link>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">O continua con</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => window.location.href = "/api/auth/social/login"}
              data-testid="button-google-login"
              className="w-full"
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              Google
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => window.location.href = "/api/auth/social/login"}
              data-testid="button-apple-login"
              className="w-full"
            >
              <FaApple className="mr-2 h-5 w-5" />
              Apple
            </Button>
          </div>

          <div className="mt-6 text-center text-sm">
            Non hai un account?{" "}
            <Link href="/register">
              <a className="text-primary font-medium hover:underline" data-testid="link-register">
                Registrati
              </a>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
