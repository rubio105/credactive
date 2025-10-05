import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, CheckCircle, Video, Calendar, Headphones, Users, Settings as SettingsIcon, User, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'subscription' | 'profile'>('subscription');

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

  const userTier = user?.subscriptionTier || 'free';
  const isPremium = userTier === 'premium';
  const isPremiumPlus = userTier === 'premium_plus';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Impostazioni</h1>
          <p className="text-xl text-muted-foreground">
            Gestisci il tuo account e abbonamento
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('subscription')}
            className={`pb-3 px-2 font-semibold transition-colors ${
              activeTab === 'subscription'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-subscription"
          >
            <Crown className="w-4 h-4 inline mr-2" />
            Abbonamento
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-2 font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-profile"
          >
            <User className="w-4 h-4 inline mr-2" />
            Profilo
          </button>
        </div>

        {activeTab === 'subscription' && (
          <div className="space-y-8">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Piano Attuale</CardTitle>
                <CardDescription>Il tuo abbonamento corrente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`inline-block p-3 rounded-lg ${
                      isPremiumPlus 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                        : isPremium 
                          ? 'bg-primary/10' 
                          : 'bg-muted'
                    }`}>
                      {isPremiumPlus ? (
                        <Sparkles className="w-8 h-8 text-white" />
                      ) : isPremium ? (
                        <Crown className="w-8 h-8 text-primary" />
                      ) : (
                        <SettingsIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">
                        {isPremiumPlus ? 'Premium Plus' : isPremium ? 'Premium' : 'Free'}
                      </h3>
                      <p className="text-muted-foreground">
                        {isPremiumPlus 
                          ? '€149/anno - Rinnovo automatico' 
                          : isPremium 
                            ? '€99/anno - Rinnovo automatico' 
                            : 'Piano gratuito con accesso limitato'}
                      </p>
                    </div>
                  </div>
                  {!isPremiumPlus && (
                    <Button
                      onClick={() => window.location.href = '/subscribe'}
                      className={isPremium ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : ''}
                      data-testid="button-upgrade"
                    >
                      {isPremium ? 'Passa a Premium Plus' : 'Passa a Premium'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Available Plans */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Piani Disponibili</h2>
              <p className="text-muted-foreground mb-6">
                Scegli il piano più adatto alle tue esigenze di formazione
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Premium Plan */}
                <Card className={`relative border-2 ${isPremium ? 'border-primary' : 'hover:border-primary'} transition-all`}>
                  {isPremium && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="px-4 py-1 bg-primary text-primary-foreground">
                        PIANO ATTUALE
                      </Badge>
                    </div>
                  )}
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
                        Accesso completo a tutti i quiz professionali
                      </p>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>10 categorie di quiz professionali</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Oltre 1.000.000 di domande aggiornate</span>
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
                        <span>Supporto via email</span>
                      </div>
                    </div>

                    {!isPremium && (
                      <Button 
                        onClick={() => window.location.href = '/subscribe'}
                        className="w-full py-6 text-lg font-semibold"
                        data-testid="button-select-premium-settings"
                      >
                        Scegli Premium
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Premium Plus Plan */}
                <Card className={`relative border-2 ${isPremiumPlus ? 'border-primary' : 'border-primary hover:border-primary'} shadow-xl`}>
                  {isPremiumPlus ? (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="px-4 py-1 bg-primary text-primary-foreground">
                        PIANO ATTUALE
                      </Badge>
                    </div>
                  ) : (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="px-4 py-1 bg-primary text-primary-foreground">
                        PIÙ POPOLARE
                      </Badge>
                    </div>
                  )}
                  
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
                        Tutto in Premium, più corsi e vantaggi esclusivi
                      </p>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="font-semibold">Tutto incluso in Premium</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Video className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Corsi On-Demand</strong> - Videocorsi completi con quiz</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Priorità Corsi Live</strong> - Accesso prioritario alle sessioni</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Headphones className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Supporto Dedicato</strong> - Consulenza certificazioni</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Users className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Eventi Esclusivi</strong> - Webinar e networking</span>
                      </div>
                    </div>

                    {!isPremiumPlus && (
                      <Button 
                        onClick={() => window.location.href = '/subscribe'}
                        className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        data-testid="button-select-premium-plus-settings"
                      >
                        Scegli Premium Plus
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Pagamento sicuro con Stripe • Cancellabile in qualsiasi momento • Garanzia 30 giorni
              </p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Profilo</CardTitle>
                <CardDescription>I tuoi dati personali</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-lg" data-testid="text-user-name">{user?.firstName || '-'} {user?.lastName || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg" data-testid="text-user-email">{user?.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lingua</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <p className="text-lg" data-testid="text-user-language">
                      {user?.language === 'it' ? 'Italiano' : 
                       user?.language === 'en' ? 'English' : 
                       user?.language === 'es' ? 'Español' : 
                       user?.language === 'fr' ? 'Français' : 'Italiano'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
