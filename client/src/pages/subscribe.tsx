import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import { CheckCircle, Crown, Shield, Star, ArrowLeft } from "lucide-react";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?payment=success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to Premium! Redirecting...",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full py-4 font-bold text-lg"
        data-testid="button-pay"
      >
        <Shield className="w-5 h-5 mr-2" />
        {isProcessing ? "Processando..." : "Paga €90"}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsCreatingPayment(true);
      
      apiRequest("POST", "/api/create-subscription")
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'active') {
            // User already has active subscription
            toast({
              title: "Already Premium",
              description: "You already have an active Premium subscription!",
            });
            window.location.href = '/dashboard';
            return;
          }
          
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          if (isUnauthorizedError(error)) {
            toast({
              title: "Unauthorized",
              description: "You are logged out. Logging in again...",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = "/api/login";
            }, 500);
            return;
          }
          
          toast({
            title: "Error",
            description: "Failed to create payment. Please try again.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsCreatingPayment(false);
        });
    }
  }, [isAuthenticated, user, toast]);

  if (isLoading || isCreatingPayment) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {isLoading ? "Loading..." : "Preparing payment..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <CardContent>
              <h2 className="text-2xl font-bold mb-4">Payment Setup Error</h2>
              <p className="text-muted-foreground mb-4">
                We couldn't initialize the payment system. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna Indietro
        </Button>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side: Plan Details */}
          <div className="gradient-primary text-white rounded-2xl p-8">
            <div className="mb-6">
              <div className="inline-block p-3 bg-white/20 rounded-lg mb-4">
                <Crown className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Piano Premium</h3>
              <p className="text-white/80">Accesso completo a tutti i contenuti</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>10 categorie di quiz professionali</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>Oltre 2.000 domande aggiornate</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>Certificati di completamento</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>Dashboard e statistiche avanzate</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>Aggiornamenti contenuti inclusi</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>Supporto prioritario</span>
              </div>
            </div>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <div className="text-5xl font-bold mb-2">€90</div>
                <p className="text-white/80">Abbonamento annuale • Rinnovo automatico</p>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5" />
                <span className="text-sm">Pagamento sicuro con Stripe</span>
              </div>
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5" />
                <span className="text-sm">Garanzia 30 giorni soddisfatti o rimborsati</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Abbonamento annuale - Cancellabile in qualsiasi momento</span>
              </div>
            </div>
          </div>

          {/* Right Side: Payment Form */}
          <Card className="shadow-xl">
            <CardContent className="p-8">
              <div className="mb-6">
                <h4 className="text-xl font-bold mb-2">Completa il Pagamento</h4>
                <p className="text-muted-foreground">
                  Inserisci i dettagli della tua carta per completare l'acquisto
                </p>
              </div>

              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm />
              </Elements>

              {/* Security Notice */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>SSL sicuro</span>
                  <span>•</span>
                  <span>256-bit encryption</span>
                  <span>•</span>
                  <span>PCI compliant</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">Metodi di pagamento accettati:</p>
                <div className="flex justify-center space-x-2">
                  <Badge variant="outline" className="text-xs">Visa</Badge>
                  <Badge variant="outline" className="text-xs">Mastercard</Badge>
                  <Badge variant="outline" className="text-xs">American Express</Badge>
                  <Badge variant="outline" className="text-xs">PayPal</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mt-12">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-6 text-center">Domande Frequenti</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-2">Come funziona l'abbonamento?</h4>
                <p className="text-sm text-muted-foreground">
                  L'abbonamento Premium costa €90 all'anno e si rinnova automaticamente. Puoi cancellarlo in qualsiasi momento.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Posso richiedere un rimborso?</h4>
                <p className="text-sm text-muted-foreground">
                  Certamente! Offriamo una garanzia di rimborso completo entro 30 giorni dall'acquisto.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">I contenuti vengono aggiornati?</h4>
                <p className="text-sm text-muted-foreground">
                  Sì, aggiungiamo regolarmente nuove domande e quiz per mantenere i contenuti sempre aggiornati.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">È sicuro il pagamento?</h4>
                <p className="text-sm text-muted-foreground">
                  Utilizziamo Stripe per gestire i pagamenti in modo sicuro. I tuoi dati non vengono mai memorizzati sui nostri server.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
