import { useState } from "react";
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

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("/api/auth/login", "POST", data);
      return await res.json();
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
        title: "Errore",
        description: error.message || "Email o password non corretti",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
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
