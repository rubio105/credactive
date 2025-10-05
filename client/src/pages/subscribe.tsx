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
import { CheckCircle, Crown, Shield, Star, ArrowLeft, Sparkles, Video, Calendar, Users, Headphones } from "lucide-react";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  amount: number;
  tierName: string;
}

const CheckoutForm = ({ amount, tierName }: CheckoutFormProps) => {
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
        title: "Pagamento Fallito",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pagamento Completato",
        description: `Benvenuto in ${tierName}! Reindirizzamento...`,
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
        {isProcessing ? "Processando..." : `Paga €${amount}`}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<'premium' | 'premium_plus' | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorizzato",
        description: "Devi effettuare il login",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleSelectTier = (tier: 'premium' | 'premium_plus') => {
    if (!isAuthenticated || !user) return;
    
    setSelectedTier(tier);
    setIsCreatingPayment(true);
    
    apiRequest("/api/create-subscription", "POST", { tier })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'active') {
          toast({
            title: "Abbonamento Attivo",
            description: "Hai già un abbonamento attivo!",
          });
          window.location.href = '/dashboard';
          return;
        }
        
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Sessione scaduta",
            description: "Effettua nuovamente il login",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 500);
          return;
        }
        
        toast({
          title: "Errore",
          description: "Impossibile creare il pagamento. Riprova.",
          variant: "destructive",
        });
        setSelectedTier(null);
      })
      .finally(() => {
        setIsCreatingPayment(false);
      });
  };

  if (isLoading) {
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

  if (isCreatingPayment) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Preparazione pagamento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (clientSecret && selectedTier) {
    const tierAmount = selectedTier === 'premium_plus' ? 149 : 99;
    const tierName = selectedTier === 'premium_plus' ? 'Premium Plus' : 'Premium';

    return (
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedTier(null);
              setClientSecret("");
            }}
            className="mb-6"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Selezione
          </Button>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className={`${selectedTier === 'premium_plus' ? 'gradient-premium-plus' : 'gradient-primary'} text-white rounded-2xl p-8`}>
              <div className="mb-6">
                <div className="inline-block p-3 bg-white/20 rounded-lg mb-4">
                  {selectedTier === 'premium_plus' ? <Sparkles className="w-8 h-8" /> : <Crown className="w-8 h-8" />}
                </div>
                <h3 className="text-2xl font-bold mb-2">Piano {tierName}</h3>
                <p className="text-white/80">Il meglio per la tua formazione professionale</p>
              </div>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-bold mb-2">€{tierAmount}</div>
                  <p className="text-white/80">Abbonamento annuale • Rinnovo automatico</p>
                </CardContent>
              </Card>

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
                  <span className="text-sm">Cancellabile in qualsiasi momento</span>
                </div>
              </div>
            </div>

            <Card className="shadow-xl">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h4 className="text-xl font-bold mb-2">Completa il Pagamento</h4>
                  <p className="text-muted-foreground">
                    Inserisci i dettagli della tua carta per completare l'acquisto
                  </p>
                </div>

                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm amount={tierAmount} tierName={tierName} />
                </Elements>

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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna Indietro
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Scegli il Tuo Piano</h1>
          <p className="text-xl text-muted-foreground">
            Investi nella tua formazione professionale
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Premium Plan */}
          <Card className="relative border-2 hover:border-primary transition-all">
            <CardContent className="p-8">
              <div className="mb-6">
                <div className="inline-block p-3 bg-primary/10 rounded-lg mb-4">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-bold">€99</span>
                  <span className="text-muted-foreground ml-2">/anno</span>
                </div>
                <p className="text-muted-foreground">
                  Accesso completo a tutti i quiz e contenuti
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>10 categorie di quiz professionali</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Oltre 2.000 domande aggiornate</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Certificati di completamento</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Dashboard e statistiche avanzate</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Aggiornamenti contenuti inclusi</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Supporto via email</span>
                </div>
              </div>

              <Button 
                onClick={() => handleSelectTier('premium')}
                className="w-full py-6 text-lg font-semibold"
                data-testid="button-select-premium"
              >
                Scegli Premium
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plus Plan */}
          <Card className="relative border-2 border-primary shadow-xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="px-4 py-1 bg-primary text-primary-foreground">
                PIÙ POPOLARE
              </Badge>
            </div>
            
            <CardContent className="p-8">
              <div className="mb-6">
                <div className="inline-block p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Premium Plus</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-bold">€149</span>
                  <span className="text-muted-foreground ml-2">/anno</span>
                </div>
                <p className="text-muted-foreground">
                  Tutto in Premium, più vantaggi esclusivi
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">Tutto incluso in Premium</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Video className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Corsi On-Demand</strong> - Videocorsi completi con quiz interattivi</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Priorità Corsi Live</strong> - Accesso prioritario alle sessioni dal vivo</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Headphones className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Supporto Dedicato</strong> - Consulenza per certificazioni professionali</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Eventi Esclusivi</strong> - Inviti a webinar e networking events</span>
                </div>
              </div>

              <Button 
                onClick={() => handleSelectTier('premium_plus')}
                className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                data-testid="button-select-premium-plus"
              >
                Scegli Premium Plus
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mt-16 max-w-5xl mx-auto">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Domande Frequenti</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-2">Come funziona l'abbonamento?</h4>
                <p className="text-sm text-muted-foreground">
                  L'abbonamento è annuale e si rinnova automaticamente. Puoi cancellarlo in qualsiasi momento dal tuo profilo.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Posso richiedere un rimborso?</h4>
                <p className="text-sm text-muted-foreground">
                  Certamente! Offriamo una garanzia di rimborso completo entro 30 giorni dall'acquisto, senza domande.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Cosa include Premium Plus?</h4>
                <p className="text-sm text-muted-foreground">
                  Premium Plus include tutto in Premium, più accesso ai corsi on-demand, priorità per i corsi live, supporto dedicato e inviti esclusivi.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">È sicuro il pagamento?</h4>
                <p className="text-sm text-muted-foreground">
                  Utilizziamo Stripe per gestire i pagamenti in modo sicuro. I tuoi dati non vengono mai memorizzati sui nostri server.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Posso cambiare piano?</h4>
                <p className="text-sm text-muted-foreground">
                  Sì, puoi passare da Premium a Premium Plus in qualsiasi momento. Contattaci per l'upgrade.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">I contenuti vengono aggiornati?</h4>
                <p className="text-sm text-muted-foreground">
                  Sì, aggiungiamo regolarmente nuove domande, quiz e corsi per mantenere i contenuti sempre aggiornati e rilevanti.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
