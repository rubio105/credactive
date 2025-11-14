import { useEffect, useState } from 'react';
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PaymentStatus() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'canceled' | 'error'>('loading');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processPaymentStatus = async () => {
      const params = new URLSearchParams(window.location.search);
      const paymentIntent = params.get('payment_intent');
      const paymentIntentClientSecret = params.get('payment_intent_client_secret');
      const redirectStatus = params.get('redirect_status');

      // Handle cancellation from URL params
      if (redirectStatus === 'canceled' || params.get('status') === 'canceled') {
        setStatus('canceled');
        setIsProcessing(false);
        toast({
          title: "Pagamento annullato",
          description: "Il pagamento è stato annullato. Puoi riprovare quando vuoi.",
          variant: "destructive",
        });
        return;
      }

      // Handle success from Stripe redirect
      if (redirectStatus === 'succeeded' && paymentIntent) {
        try {
          const response = await apiRequest("/api/payment-success", "POST", { paymentIntentId: paymentIntent });
          const data = await response.json();
          
          if (data.success) {
            setStatus('success');
            toast({
              title: "Pagamento completato!",
              description: data.message,
            });
            
            // Invalidate user query to refresh premium status
            queryClient.invalidateQueries({ queryKey: ['/api/user'] });
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              setLocation('/dashboard');
            }, 2000);
          } else {
            setStatus('error');
            toast({
              title: "Errore verifica pagamento",
              description: data.message || "Impossibile verificare il pagamento",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
          setStatus('error');
          toast({
            title: "Errore",
            description: "Si è verificato un errore durante la verifica del pagamento",
            variant: "destructive",
          });
        }
        setIsProcessing(false);
        return;
      }

      // If no valid status, assume error
      setStatus('error');
      setIsProcessing(false);
    };

    processPaymentStatus();
  }, [toast, setLocation]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center" data-testid="card-payment-status">
          <CardHeader className="pb-8">
            <div className="mx-auto mb-6">
              {isProcessing && (
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" data-testid="icon-loading" />
                </div>
              )}
              
              {!isProcessing && status === 'success' && (
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" data-testid="icon-success" />
                </div>
              )}
              
              {!isProcessing && status === 'canceled' && (
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-orange-600" data-testid="icon-canceled" />
                </div>
              )}
              
              {!isProcessing && status === 'error' && (
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" data-testid="icon-error" />
                </div>
              )}
            </div>
            
            <CardTitle className="text-3xl mb-4">
              {isProcessing && "Elaborazione pagamento..."}
              {!isProcessing && status === 'success' && "Pagamento completato!"}
              {!isProcessing && status === 'canceled' && "Pagamento annullato"}
              {!isProcessing && status === 'error' && "Errore pagamento"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isProcessing && (
              <p className="text-muted-foreground">
                Stiamo verificando il tuo pagamento. Attendere prego...
              </p>
            )}
            
            {!isProcessing && status === 'success' && (
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  Il tuo abbonamento Premium è ora attivo! Verrai reindirizzato alla dashboard...
                </p>
                <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Riceverai una email di conferma a breve.
                  </p>
                </div>
              </div>
            )}
            
            {!isProcessing && status === 'canceled' && (
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  Hai annullato il processo di pagamento. Non è stato addebitato alcun importo.
                </p>
                <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Puoi ritentare il pagamento in qualsiasi momento dalla pagina abbonamenti.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    onClick={() => setLocation('/subscribe')}
                    className="flex-1"
                    data-testid="button-retry-payment"
                  >
                    Riprova il pagamento
                  </Button>
                  <Button 
                    onClick={() => setLocation('/dashboard')}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-back-dashboard"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Torna alla Dashboard
                  </Button>
                </div>
              </div>
            )}
            
            {!isProcessing && status === 'error' && (
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  Si è verificato un errore durante il processo di pagamento.
                </p>
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Se il problema persiste, contatta il supporto a support@ciry.app
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    onClick={() => setLocation('/subscribe')}
                    className="flex-1"
                    data-testid="button-retry-payment-error"
                  >
                    Riprova
                  </Button>
                  <Button 
                    onClick={() => setLocation('/dashboard')}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-back-dashboard-error"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Torna alla Dashboard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
