import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  HelpCircle
} from "lucide-react";
import { SEO } from "@/components/SEO";

export default function GuidaPage() {
  const { user } = useAuth();
  const isDoctor = (user as any)?.isDoctor;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Guida all'uso - CIRY"
        description="Scopri come utilizzare CIRY per la prevenzione sanitaria e il supporto diagnostico. Guida completa su sicurezza, privacy e anonimizzazione dei dati."
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Guida all'uso di CIRY</h1>
          <p className="text-xl text-muted-foreground">
            {isDoctor 
              ? "Strumenti AI per supporto diagnostico e gestione pazienti"
              : "La tua piattaforma intelligente per la prevenzione sanitaria"}
          </p>
        </div>

        {/* Security Notice */}
        <Alert className="mb-8 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <Shield className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Privacy e Sicurezza Garantite:</strong> Tutti i tuoi dati sono crittografati end-to-end, 
            anonimizzati e conformi al GDPR. L'AI non memorizza informazioni personali identificabili.
          </AlertDescription>
        </Alert>

        {/* Role-specific Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              {isDoctor ? "Guida Rapida per Medici" : "Guida Rapida per Pazienti"}
            </CardTitle>
            <CardDescription>
              {isDoctor 
                ? "Come utilizzare CIRY per supporto diagnostico e gestione pazienti"
                : "Come sfruttare al meglio gli strumenti di prevenzione AI"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDoctor ? (
              <>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">1. Accedi al Supporto Diagnostico</h3>
                    <p className="text-sm text-muted-foreground">
                      Vai su "AI Prevention" per analizzare referti medici e ricevere assistenza diagnostica AI
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">2. Carica Documenti Medici</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload referti PDF, immagini radiologiche o esami del sangue per analisi AI approfondita
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">3. Gestisci Pazienti</h3>
                    <p className="text-sm text-muted-foreground">
                      Collega pazienti tramite codice univoco e monitora i loro referti medici in tempo reale
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">1. Carica i Tuoi Referti</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload esami del sangue, radiografie o altri documenti medici per ricevere analisi AI
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">2. Parla con l'AI Prevention</h3>
                    <p className="text-sm text-muted-foreground">
                      Fai domande sulla tua salute e ricevi consigli personalizzati basati sui tuoi referti
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">3. Monitora il Tuo Indice di Prevenzione</h3>
                    <p className="text-sm text-muted-foreground">
                      Visualizza il tuo score di salute e segui i suggerimenti per migliorarlo
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Detailed FAQ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Domande Frequenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {/* Security & Privacy */}
              <AccordionItem value="security">
                <AccordionTrigger className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Come vengono protetti i miei dati sanitari?</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">🔐 Crittografia End-to-End</h4>
                    <p className="text-muted-foreground">
                      Tutti i dati vengono crittografati sia durante il trasferimento che a riposo. 
                      Utilizziamo AES-256 per la protezione dei dati sensibili.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">👤 Anonimizzazione Automatica</h4>
                    <p className="text-muted-foreground">
                      L'AI analizza i tuoi referti in modo anonimo. Nome, cognome e dati identificativi 
                      vengono rimossi automaticamente prima dell'elaborazione.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">🇪🇺 Conformità GDPR</h4>
                    <p className="text-muted-foreground">
                      CIRY è completamente conforme al Regolamento Europeo sulla Protezione dei Dati (GDPR). 
                      Hai diritto di accesso, rettifica e cancellazione dei tuoi dati in ogni momento.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">🏥 Audit Log Completo</h4>
                    <p className="text-muted-foreground">
                      Ogni accesso ai tuoi dati viene registrato e puoi visualizzare chi ha consultato 
                      le tue informazioni sanitarie.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* AI Analysis */}
              <AccordionItem value="ai-analysis">
                <AccordionTrigger className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>Come funziona l'analisi AI dei referti?</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    CIRY utilizza Google Gemini AI, uno dei modelli più avanzati per analisi medica:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>
                      <strong>Estrazione automatica:</strong> L'AI legge ed estrae valori da PDF, immagini e testo
                    </li>
                    <li>
                      <strong>Analisi contestuale:</strong> Considera età, genere e storico medico per consigli personalizzati
                    </li>
                    <li>
                      <strong>Diagnosi differenziale:</strong> {isDoctor ? "Suggerisce possibili diagnosi basate su evidenze scientifiche" : "Identifica potenziali anomalie e suggerisce approfondimenti"}
                    </li>
                    <li>
                      <strong>Prevenzione personalizzata:</strong> Raccomanda esami periodici e stili di vita salutari
                    </li>
                  </ul>
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      L'AI è uno strumento di supporto e non sostituisce il parere medico. 
                      Consulta sempre il tuo medico per decisioni cliniche.
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>

              {/* Document Upload */}
              <AccordionItem value="upload">
                <AccordionTrigger className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Che tipo di documenti posso caricare?</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                  <p>CIRY accetta diversi formati di documenti medici:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Esami del sangue:</strong> PDF o foto di referti laboratorio</li>
                    <li><strong>Radiografie:</strong> Immagini DICOM, JPEG, PNG</li>
                    <li><strong>Referti medici:</strong> PDF di visite specialistiche</li>
                    <li><strong>Ecografie e TAC:</strong> Report in formato PDF o immagini</li>
                    <li><strong>Cartelle cliniche:</strong> Documenti sanitari in formato testo</li>
                  </ul>
                  <p className="mt-3">
                    <strong>Dimensione massima:</strong> 10MB per file. 
                    Per risultati ottimali, carica documenti leggibili e ben illuminati.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Token System */}
              <AccordionItem value="tokens">
                <AccordionTrigger className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Come funzionano i token AI?</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    I token misurano l'utilizzo dell'AI. Ogni interazione (domanda, analisi referto) consuma token.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>Piano Free</span>
                      <span className="font-semibold">30 token/mese</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>Piano Premium</span>
                      <span className="font-semibold">1000 token/mese</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-950 dark:to-amber-950 rounded">
                      <span className="font-semibold">Piano Premium Plus</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">Token Illimitati</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-3">
                    <strong>Consumo approssimativo:</strong> Domanda semplice (2-5 token), 
                    Analisi referto (10-20 token), Conversazione complessa (20-50 token)
                  </p>
                </AccordionContent>
              </AccordionItem>

              {isDoctor && (
                <AccordionItem value="patient-linking">
                  <AccordionTrigger className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Come collego un paziente al mio profilo?</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>Genera un codice di collegamento univoco dalla sezione "Pazienti Collegati"</li>
                      <li>Condividi il codice (8 caratteri) con il paziente in modo sicuro</li>
                      <li>Il paziente inserisce il codice nella sua area personale</li>
                      <li>Una volta collegato, visualizzi tutti i suoi referti medici in tempo reale</li>
                      <li>Puoi aggiungere note cliniche visibili solo a te e al paziente</li>
                    </ol>
                    <Alert className="mt-3">
                      <Shield className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Il paziente può disconnettere il collegamento in qualsiasi momento. 
                        Ogni accesso ai dati del paziente viene registrato per trasparenza.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Medical Alerts */}
              <AccordionItem value="alerts">
                <AccordionTrigger className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Cosa sono gli Alert Medici?</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Gli Alert Medici sono notifiche automatiche generate dall'AI quando rileva:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Valori fuori range che richiedono attenzione</li>
                    <li>Combinazioni di parametri che suggeriscono anomalie</li>
                    <li>Necessità di esami di approfondimento urgenti</li>
                    <li>Scadenza di esami periodici consigliati</li>
                  </ul>
                  <p className="mt-3">
                    Riceverai una notifica email e in-app. {isDoctor ? "Puoi gestire gli alert dalla dashboard medici." : "Puoi confermare di aver letto l'alert e agire di conseguenza."}
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Data Export */}
              <AccordionItem value="export">
                <AccordionTrigger className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Posso esportare i miei dati?</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Sì! In conformità al GDPR, hai pieno controllo sui tuoi dati:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Scarica tutti i tuoi referti medici in formato PDF</li>
                    <li>Esporta lo storico delle conversazioni AI in formato JSON</li>
                    <li>Richiedi un export completo di tutti i dati personali</li>
                    <li>Elimina permanentemente il tuo account e tutti i dati associati</li>
                  </ul>
                  <p className="mt-3">
                    Vai su <strong>Impostazioni → Privacy e Dati</strong> per gestire le tue informazioni.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Support Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Hai ancora domande?</CardTitle>
            <CardDescription>Il nostro team di supporto è qui per aiutarti</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Per assistenza tecnica o domande sulla piattaforma, contattaci:
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <div>📧 Email: <a href="mailto:support@ciry.app" className="text-primary hover:underline">support@ciry.app</a></div>
              <div>💬 Chat: Disponibile dal menu in basso a destra</div>
              <div>⏰ Orari: Lun-Ven 9:00-18:00</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
