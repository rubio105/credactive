import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import { CheckCircle, Crown, Loader2, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function PaymentSuccess() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentIntentId = params.get('payment_intent');
    const paymentIntentClientSecret = params.get('payment_intent_client_secret');

    if (!paymentIntentId) {
      setStatus('error');
      setMessage('Informazioni sul pagamento non trovate');
      return;
    }

    // Confirm payment with backend
    apiRequest("/api/payment-success", "POST", { paymentIntentId })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage('Il tuo abbonamento Premium è stato attivato!');
          // Refetch user data to update premium status
          queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
          toast({
            title: "Pagamento completato!",
            description: "Benvenuto in Premium",
          });
        } else {
          setStatus('error');
          setMessage(data.message || 'Errore durante la conferma del pagamento');
        }
      })
      .catch((error) => {
        console.error("Error confirming payment:", error);
        setStatus('error');
        setMessage('Errore durante la verifica del pagamento');
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante la verifica del pagamento",
          variant: "destructive",
        });
      });
  }, [toast]);

  const handleContinue = () => {
    if (status === 'success') {
      setLocation('/prevention');
    } else {
      setLocation('/subscribe');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="text-center">
          <CardContent className="pt-12 pb-12">
            {status === 'processing' && (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-6 text-emerald-600 animate-spin" />
                <h1 className="text-2xl font-bold mb-4">Elaborazione pagamento...</h1>
                <p className="text-muted-foreground">
                  Stiamo verificando il tuo pagamento. Attendere prego.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-bold mb-4 text-emerald-600">Pagamento completato!</h1>
                <p className="text-lg text-muted-foreground mb-6">
                  {message}
                </p>
                <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg p-6 mb-8">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Crown className="w-6 h-6 text-emerald-600" />
                    <span className="text-xl font-bold">Sei ora Premium!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Accesso illimitato a tutte le funzionalità di prevenzione
                  </p>
                </div>
                <Button
                  onClick={handleContinue}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  data-testid="button-continue"
                >
                  Inizia ad usare Premium
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold mb-4 text-red-600">Errore nel pagamento</h1>
                <p className="text-muted-foreground mb-8">
                  {message}
                </p>
                <Button
                  onClick={handleContinue}
                  variant="outline"
                  size="lg"
                  data-testid="button-retry"
                >
                  Riprova
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
