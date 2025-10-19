import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import { Crown, Video, Headphones, Check, Loader2 } from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest, queryClient } from "@/lib/queryClient";

// Load Stripe
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

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        toast({
          title: "Pagamento fallito",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il pagamento",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        size="lg"
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Elaborazione...
          </>
        ) : (
          <>
            <Crown className="w-5 h-5 mr-2" />
            Attiva Premium - €29,90/mese
          </>
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [premiumCheckDone, setPremiumCheckDone] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    // Check if user is already premium (solo una volta)
    if (!premiumCheckDone && user?.isPremium) {
      setPremiumCheckDone(true);
      setLoadingPayment(false);
      return;
    }

    // Create payment intent only if not premium
    if (!premiumCheckDone && !user?.isPremium) {
      setPremiumCheckDone(true);
      apiRequest("/api/create-subscription", "POST", { tier: "premium" })
        .then((response) => response.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
          setLoadingPayment(false);
        })
        .catch((error) => {
          console.error("Error creating payment intent:", error);
          toast({
            title: "Errore",
            description: "Impossibile inizializzare il pagamento",
            variant: "destructive",
          });
          setLoadingPayment(false);
        });
    }
  }, [isAuthenticated, isLoading, user, premiumCheckDone, toast]);

  if (isLoading || loadingPayment) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se l'utente è già Premium, mostra una pagina dedicata
  if (user?.isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mb-6">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl mb-4">Sei già Premium! 🎉</CardTitle>
              <p className="text-lg text-muted-foreground">
                Il tuo abbonamento Premium è attivo e hai accesso a tutte le funzionalità esclusive
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-6 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h3 className="font-semibold text-lg mb-4 text-emerald-700 dark:text-emerald-300">I tuoi vantaggi Premium attivi:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Consulto medico settimanale</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Webinar sulla prevenzione</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Eventi esclusivi sulla prevenzione</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Accesso illimitato a CIRY</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Supporto medico prioritario</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={() => setLocation("/prevention")}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  size="lg"
                  data-testid="button-go-home"
                >
                  Vai alla Home
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      const response = await apiRequest("/api/create-billing-portal", "POST", {});
                      const data = await response.json();
                      if (data.url) {
                        window.location.href = data.url;
                      } else {
                        toast({
                          title: "Errore",
                          description: "Impossibile aprire il portale di gestione abbonamento",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Errore",
                        description: "Impossibile aprire il portale di gestione abbonamento",
                        variant: "destructive",
                      });
                    }
                  }}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  data-testid="button-manage-subscription"
                >
                  Gestisci Abbonamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Passa a Premium</h1>
          <p className="text-xl text-muted-foreground">
            Sblocca tutti i vantaggi della prevenzione salute
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Benefits Section */}
          <div className="space-y-6">
            <Card className="border-2 border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-emerald-600" />
                  Cosa include Premium
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Consulto medico settimanale</h3>
                    <p className="text-sm text-muted-foreground">Consulenza medica personalizzata ogni settimana</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Webinar sulla prevenzione</h3>
                    <p className="text-sm text-muted-foreground">Accedi a webinar esclusivi su salute e prevenzione</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Eventi esclusivi sulla prevenzione</h3>
                    <p className="text-sm text-muted-foreground">Partecipa a eventi riservati ai membri Premium</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Accesso illimitato a CIRY</h3>
                    <p className="text-sm text-muted-foreground">Usa l'intelligenza artificiale senza limiti</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Supporto medico prioritario</h3>
                    <p className="text-sm text-muted-foreground">Assistenza e risposte rapide dal team medico</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-2">€29,90</div>
                  <div className="text-sm text-muted-foreground">al mese</div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Cancella in qualsiasi momento
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Completa il pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                {clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm />
                  </Elements>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Impossibile caricare il modulo di pagamento</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
