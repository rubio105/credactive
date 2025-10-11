import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import { Stethoscope, MessageCircle, Video, CheckCircle, Clock, Users, Shield, Sparkles } from "lucide-react";

export default function PacchettoProhmed() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-emerald-950 dark:to-teal-950">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="https://www.prohmed.it/wp-content/uploads/2024/02/logo-prohmed.png"
              alt="Prohmed"
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-green-900 dark:text-green-100 mb-4">
            Pacchetto Prohmed
          </h1>
          <p className="text-xl text-green-700 dark:text-green-300 mb-6">
            Supporto medico professionale h24 e webinar settimanali
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-5xl font-bold text-green-600 dark:text-green-400">39€</span>
            <span className="text-gray-600 dark:text-gray-400">/mese</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Supporto H24 */}
          <Card className="border-green-200 dark:border-green-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <MessageCircle className="w-6 h-6 text-green-600" />
                Supporto Medico H24
              </CardTitle>
              <CardDescription>
                Assistenza medica professionale sempre disponibile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Chat diretta con medici specializzati 24 ore su 24, 7 giorni su 7
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Risposte rapide entro 15 minuti per consulenze urgenti
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Accesso tramite app mobile Prohmed (iOS e Android)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Consulti illimitati senza costi aggiuntivi
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Webinar Settimanali */}
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <Video className="w-6 h-6 text-blue-600" />
                Webinar Settimanali
              </CardTitle>
              <CardDescription>
                Confronto diretto con medici esperti
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Webinar live ogni settimana con temi di prevenzione
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Sessioni Q&A interattive con specialisti
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Registrazioni disponibili on-demand
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Certificati di partecipazione per ogni webinar
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <Card className="mb-12 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Cosa Include il Pacchetto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Assistenza H24</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Supporto medico sempre disponibile, anche nei weekend e festivi
                </p>
              </div>

              <div className="text-center p-4">
                <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Medici Esperti</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Team di specialisti certificati in varie discipline mediche
                </p>
              </div>

              <div className="text-center p-4">
                <div className="bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Privacy Garantita</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tutte le conversazioni sono protette e confidenziali
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Card className="inline-block border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-4">
                Attiva Ora il Pacchetto Prohmed
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-md">
                Ottieni supporto medico professionale e accesso ai webinar settimanali per soli 39€ al mese
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg px-8 py-6"
                data-testid="button-activate-package"
              >
                <Stethoscope className="w-5 h-5 mr-2" />
                Attiva Pacchetto - 39€/mese
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Disdici quando vuoi, senza vincoli
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
