import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import { Stethoscope, Video, CheckCircle, Users, Sparkles, Shield, Crown } from "lucide-react";

export default function PacchettoProhmed() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar Sinistra */}
          <div className="lg:col-span-1 space-y-6">
            {/* Logo Prohmed */}
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <img 
                  src="/images/prohmed-logo.png"
                  alt="Prohmed - Medical Intelligence Prevention"
                  className="h-24 w-auto mx-auto mb-4"
                />
                <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                  Pacchetto Prohmed
                </h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-4xl font-bold text-green-600 dark:text-green-400">14,90€</span>
                  <span className="text-gray-600 dark:text-gray-400">/mese</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Prevenzione completa e consulenza specialistica
                </p>
              </CardContent>
            </Card>

            {/* Caratteristiche Pacchetto */}
            <Card className="shadow-lg border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Cosa Include
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Webinar Interattivi</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Sulla prevenzione con esperti</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Stethoscope className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">1 Consulto al Mese</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Con specialista in teleconsulto</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Eventi Live</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Inviti a eventi sul territorio</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vantaggi */}
            <Card className="shadow-lg border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  Vantaggi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Prezzo accessibile</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Disdici quando vuoi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Nessun vincolo</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenuto Principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Pacchetto Prohmed - Prevenzione Completa
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Webinar interattivi, consulti specialistici ed eventi live per la tua salute
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Webinar Interattivi */}
              <Card className="border-green-200 dark:border-green-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                    <Video className="w-6 h-6 text-green-600" />
                    Webinar Interattivi sulla Prevenzione
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Webinar mensili con temi di prevenzione
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Sessioni Q&A interattive dal vivo
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Registrazioni disponibili on-demand
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Materiali didattici scaricabili
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Consulto Specialistico */}
              <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <Stethoscope className="w-6 h-6 text-blue-600" />
                    Consulto con Specialista
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>1 consulto al mese</strong> incluso
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Teleconsulto video in alta qualità
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Referto medico digitale incluso
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Prenotazione online semplificata
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Eventi Live */}
              <Card className="border-purple-200 dark:border-purple-800 shadow-lg md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                    <Users className="w-6 h-6 text-purple-600" />
                    Eventi Live sul Territorio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Inviti esclusivi a eventi dal vivo
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Incontri con medici esperti
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Networking con altri iscritti
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <Card className="border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 shadow-xl">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-4">
                  Attiva Ora il Tuo Pacchetto
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Accedi a tutti i servizi di prevenzione per soli 14,90€ al mese
                </p>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg px-8 py-6"
                  data-testid="button-activate-package"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Attiva Pacchetto - 14,90€/mese
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Nessun vincolo • Disdici quando vuoi
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
