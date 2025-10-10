import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/image_1760068094229.png";
import { Link } from "wouter";
import { CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("/api/auth/forgot-password", "POST", data);
      return await res.json();
    },
    onSuccess: () => {
      setSent(true);
      toast({
        title: "Email inviata",
        description: "Controlla la tua casella email per le istruzioni",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'invio della email",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPasswordMutation.mutate({ email });
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">Email inviata!</CardTitle>
            <CardDescription className="text-base">
              Abbiamo inviato le istruzioni per reimpostare la password all'indirizzo <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Controlla la tua casella email (e anche lo spam) e segui il link per reimpostare la tua password.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full" data-testid="button-back-login">
                Torna al login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="CIRY" className="h-12" />
          </div>
          <CardTitle className="text-2xl">Recupera la password</CardTitle>
          <CardDescription>
            Inserisci la tua email per ricevere le istruzioni
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
            <Button
              type="submit"
              className="w-full"
              disabled={forgotPasswordMutation.isPending}
              data-testid="button-submit"
            >
              {forgotPasswordMutation.isPending ? "Invio in corso..." : "Invia istruzioni"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <Link 
              href="/login" 
              className="text-primary hover:underline" 
              data-testid="link-back-login"
            >
              Torna al login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
