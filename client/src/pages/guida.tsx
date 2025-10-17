import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Lock, 
  FileText, 
  MessageSquare, 
  Upload, 
  Brain,
  Users,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Stethoscope,
  FileSearch,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Heart,
  Activity
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { Link } from "wouter";

export default function GuidaPage() {
  const { user } = useAuth();
  const isDoctor = (user as any)?.isDoctor;
  const isPatient = user && !isDoctor && !(user as any)?.isAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <SEO 
        title="Come Funziona CIRY - Guida Semplice"
        description="Scopri come usare CIRY per la prevenzione sanitaria. Guida facile con esempi pratici per caricare referti, chattare con l'AI e monitorare la tua salute."
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Guida Semplice</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Come Funziona CIRY
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isDoctor 
              ? "La tua assistente AI per il supporto diagnostico e la gestione pazienti"
              : "La tua piattaforma intelligente per la prevenzione sanitaria con AI"}
          </p>
        </div>

        {/* Security Badge */}
        <Alert className="mb-12 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50">
          <Shield className="h-5 w-5 text-emerald-600" />
          <AlertDescription className="text-emerald-900 dark:text-emerald-100 font-medium">
            🔒 <strong>100% Sicuro e Privato:</strong> I tuoi dati sanitari sono crittografati, anonimizzati e protetti secondo GDPR. 
            L'AI non memorizza informazioni personali identificabili.
          </AlertDescription>
        </Alert>

        {/* Quick Start Steps - Visual Timeline */}
        {!isDoctor && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              Inizia in 3 Semplici Passi
            </h2>
            
            <div className="relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-blue-300 via-purple-300 to-emerald-300 dark:from-blue-800 dark:via-purple-800 dark:to-emerald-800 mx-32"></div>
              
              <div className="grid gap-8 md:grid-cols-3 relative z-10">
                {/* Step 1 */}
                <div className="relative">
                  <Card className="border-2 border-blue-200 dark:border-blue-800 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <CardContent className="pt-8 pb-6 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <Upload className="w-10 h-10 text-white" />
                      </div>
                      <Badge className="mb-3 bg-blue-600 text-white">Passo 1</Badge>
                      <h3 className="font-bold text-xl mb-3">Carica i Referti</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload esami del sangue, radiografie o qualsiasi documento medico in PDF o immagine
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center text-xs">
                        <Badge variant="secondary">PDF</Badge>
                        <Badge variant="secondary">Immagini</Badge>
                        <Badge variant="secondary">Max 10MB</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <Card className="border-2 border-purple-200 dark:border-purple-800 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <CardContent className="pt-8 pb-6 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Brain className="w-10 h-10 text-white" />
                      </div>
                      <Badge className="mb-3 bg-purple-600 text-white">Passo 2</Badge>
                      <h3 className="font-bold text-xl mb-3">Analisi AI Istantanea</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        L'intelligenza artificiale analizza i tuoi documenti in pochi secondi e genera un report completo
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center text-xs">
                        <Badge variant="secondary">⚡ Veloce</Badge>
                        <Badge variant="secondary">🎯 Precisa</Badge>
                        <Badge variant="secondary">🔬 Scientifica</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <Card className="border-2 border-emerald-200 dark:border-emerald-800 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <CardContent className="pt-8 pb-6 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <MessageSquare className="w-10 h-10 text-white" />
                      </div>
                      <Badge className="mb-3 bg-emerald-600 text-white">Passo 3</Badge>
                      <h3 className="font-bold text-xl mb-3">Chatta con l'AI</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Fai domande sui tuoi esami, ricevi consigli personalizzati e scopri come migliorare la tua salute
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center text-xs">
                        <Badge variant="secondary">💬 24/7</Badge>
                        <Badge variant="secondary">🎓 Educativa</Badge>
                        <Badge variant="secondary">🎁 Illimitata</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href="/prevention">
                <a className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow font-semibold" data-testid="link-start-now">
                  Inizia Subito <ArrowRight className="w-4 h-4" />
                </a>
              </Link>
            </div>
          </div>
        )}

        {/* Doctor Quick Start */}
        {isDoctor && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              Strumenti per Medici
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-2 hover:shadow-xl transition-all">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Stethoscope className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Supporto Diagnostico AI</h3>
                  <p className="text-sm text-muted-foreground">
                    Analizza referti medici e ricevi suggerimenti diagnostici basati su evidenze scientifiche
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-xl transition-all">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Gestione Pazienti</h3>
                  <p className="text-sm text-muted-foreground">
                    Collega pazienti e monitora i loro referti in tempo reale con codici di collegamento sicuri
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-xl transition-all">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <FileSearch className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Note Cliniche</h3>
                  <p className="text-sm text-muted-foreground">
                    Crea note mediche per i tuoi pazienti che vengono notificate in tempo reale
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Features Overview */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Cosa Puoi Fare con CIRY
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-950 dark:hover:to-blue-900 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileSearch className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Analisi Intelligente</h3>
                    <p className="text-sm text-muted-foreground">
                      L'AI legge ed estrae automaticamente valori da PDF e immagini mediche
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 dark:hover:from-purple-950 dark:hover:to-purple-900 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Consigli Personalizzati</h3>
                    <p className="text-sm text-muted-foreground">
                      Raccomandazioni su misura basate su età, genere e storico medico
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:bg-gradient-to-br hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-950 dark:hover:to-emerald-900 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Alert Medici</h3>
                    <p className="text-sm text-muted-foreground">
                      Notifiche automatiche per valori anomali o esami urgenti
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 dark:hover:from-orange-950 dark:hover:to-orange-900 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Indice Prevenzione</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitora il tuo score di salute e segui i progressi nel tempo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:bg-gradient-to-br hover:from-pink-50 hover:to-pink-100 dark:hover:from-pink-950 dark:hover:to-pink-900 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Analisi Radiologica</h3>
                    <p className="text-sm text-muted-foreground">
                      AI Vision analizza RX, TAC, MRI e altre immagini diagnostiche
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:bg-gradient-to-br hover:from-cyan-50 hover:to-cyan-100 dark:hover:from-cyan-950 dark:hover:to-cyan-900 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Lock className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Dati Sicuri GDPR</h3>
                    <p className="text-sm text-muted-foreground">
                      Crittografia end-to-end e anonimizzazione automatica
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Practical Examples */}
        {!isDoctor && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-4">
              Esempi di Domande che Puoi Fare
            </h2>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ecco alcune domande tipiche che puoi porre all'AI dopo aver caricato i tuoi referti
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      1
                    </div>
                    <p className="text-sm pt-1">
                      "I miei valori del colesterolo sono nella norma? Cosa dovrei fare per migliorarli?"
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      2
                    </div>
                    <p className="text-sm pt-1">
                      "Ho familiarità per diabete, quali screening mi consigli di fare?"
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      3
                    </div>
                    <p className="text-sm pt-1">
                      "Quali alimenti dovrei evitare considerando i miei esami del sangue?"
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      4
                    </div>
                    <p className="text-sm pt-1">
                      "La mia radiografia del torace mostra qualcosa di preoccupante?"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Token System - Simplified */}
        {!isDoctor && (
          <Alert className="mb-12 border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <AlertDescription className="text-emerald-900 dark:text-emerald-100">
              <div className="font-bold text-lg mb-2">🎁 Token ILLIMITATI per te!</div>
              <p className="text-sm">
                Come paziente CIRY, hai accesso <strong>completamente gratuito e illimitato</strong> all'AI per la prevenzione. 
                Puoi chattare, caricare referti e ricevere analisi senza alcun limite mensile. Nessun costo nascosto!
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* FAQ Accordion */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <HelpCircle className="w-6 h-6" />
              Domande Frequenti
            </CardTitle>
            <CardDescription>Le risposte alle domande più comuni su CIRY</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {/* Security & Privacy */}
              <AccordionItem value="security">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-semibold">Come vengono protetti i miei dati sanitari?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pl-13">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">Crittografia Totale</h4>
                        <p className="text-sm text-muted-foreground">
                          Tutti i dati sono protetti con crittografia AES-256 sia durante il trasferimento che quando sono salvati
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">Anonimizzazione Automatica</h4>
                        <p className="text-sm text-muted-foreground">
                          L'AI analizza i referti in modo anonimo. Nome, cognome e dati identificativi vengono rimossi prima dell'elaborazione
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">Conformità GDPR</h4>
                        <p className="text-sm text-muted-foreground">
                          CIRY rispetta il Regolamento Europeo sulla Protezione dei Dati. Hai diritto di accedere, modificare o eliminare i tuoi dati in qualsiasi momento
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* AI Analysis */}
              <AccordionItem value="ai-analysis">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-semibold">Come funziona l'analisi AI dei referti?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pl-13">
                  <p className="text-sm text-muted-foreground mb-4">
                    CIRY utilizza <strong>Google Gemini AI</strong>, uno dei modelli più avanzati al mondo per l'analisi medica. Ecco cosa fa:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <span className="text-2xl">📄</span>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Legge Automaticamente</h4>
                        <p className="text-xs text-muted-foreground">Estrae valori e informazioni da PDF, foto e documenti scansionati</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Personalizza i Consigli</h4>
                        <p className="text-xs text-muted-foreground">Considera la tua età, genere e storico medico per suggerimenti su misura</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <span className="text-2xl">🔬</span>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Identifica Anomalie</h4>
                        <p className="text-xs text-muted-foreground">Rileva valori fuori norma e suggerisce eventuali approfondimenti</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <span className="text-2xl">💡</span>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Previene Problemi</h4>
                        <p className="text-xs text-muted-foreground">Raccomanda esami periodici e stili di vita salutari</p>
                      </div>
                    </div>
                  </div>
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Importante:</strong> L'AI è uno strumento di supporto e non sostituisce il parere del tuo medico. 
                      Consulta sempre un professionista sanitario per decisioni mediche.
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>

              {/* Document Upload */}
              <AccordionItem value="upload">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="font-semibold">Che tipo di documenti posso caricare?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pl-13">
                  <p className="text-sm text-muted-foreground mb-4">
                    CIRY accetta praticamente qualsiasi tipo di documento medico:
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Esami del sangue</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Radiografie (RX)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm">TAC e Risonanze (MRI)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/30 rounded">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">Ecografie</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-pink-50 dark:bg-pink-950/30 rounded">
                      <FileText className="w-4 h-4 text-pink-600" />
                      <span className="text-sm">Referti specialistici</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-cyan-50 dark:bg-cyan-950/30 rounded">
                      <FileText className="w-4 h-4 text-cyan-600" />
                      <span className="text-sm">Cartelle cliniche</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Formati supportati:</strong> PDF, JPEG, PNG, DICOM
                    </p>
                    <p className="text-sm mt-1">
                      <strong>Dimensione massima:</strong> 10MB per file
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Per risultati ottimali, carica documenti leggibili e ben illuminati
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Medical Alerts */}
              <AccordionItem value="alerts">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="font-semibold">Cosa sono gli Alert Medici Urgenti?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pl-13">
                  <p className="text-sm text-muted-foreground mb-4">
                    Gli Alert Urgenti sono notifiche automatiche generate dall'AI quando rileva situazioni che richiedono attenzione immediata:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">🚨</span>
                      <div>
                        <p className="text-sm font-medium">Valori critici fuori norma</p>
                        <p className="text-xs text-muted-foreground">Parametri che necessitano di intervento medico rapido</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <p className="text-sm font-medium">Combinazioni preoccupanti</p>
                        <p className="text-xs text-muted-foreground">Pattern di valori che suggeriscono problemi clinici</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xl">🔬</span>
                      <div>
                        <p className="text-sm font-medium">Esami urgenti raccomandati</p>
                        <p className="text-xs text-muted-foreground">Approfondimenti diagnostici da fare con priorità</p>
                      </div>
                    </div>
                  </div>
                  <Alert className="mt-4 border-orange-200 bg-orange-50 dark:bg-orange-950/50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-xs text-orange-900 dark:text-orange-100">
                      Riceverai una notifica via email e nell'app. Puoi confermare di aver letto l'alert e seguire le raccomandazioni.
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>

              {isDoctor && (
                <AccordionItem value="patient-linking">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="font-semibold">Come collego un paziente al mio profilo?</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pl-13">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                        <p className="text-sm pt-0.5">Genera un codice di collegamento dalla sezione "Pazienti Collegati"</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                        <p className="text-sm pt-0.5">Condividi il codice (8 caratteri) con il paziente in modo sicuro</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                        <p className="text-sm pt-0.5">Il paziente inserisce il codice nella sua area "Documenti"</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                        <p className="text-sm pt-0.5">Visualizzi tutti i suoi referti in tempo reale e puoi creare note cliniche</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </CardContent>
        </Card>

        {/* CTA Bottom */}
        <div className="text-center">
          <Card className="border-2 border-primary bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-2xl font-bold mb-3">Pronto per Iniziare?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {isDoctor 
                  ? "Inizia a usare gli strumenti AI per supportare le tue diagnosi e gestire i tuoi pazienti in modo più efficiente"
                  : "Carica il tuo primo referto e scopri cosa l'AI può fare per la tua salute"}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/prevention">
                  <a className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-xl transition-shadow font-semibold" data-testid="link-get-started">
                    Inizia Ora <ArrowRight className="w-4 h-4" />
                  </a>
                </Link>
                <Link href="/contatti">
                  <a className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary rounded-lg hover:bg-muted transition-colors font-semibold" data-testid="link-contact">
                    Hai Domande? Contattaci
                  </a>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
