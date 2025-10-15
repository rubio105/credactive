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
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {isDoctor ? "Guida Rapida per Medici" : "Primi Passi"}
          </h2>
          
          {isDoctor ? (
            <div className="grid gap-4 md:gap-6 sm:grid-cols-1 md:grid-cols-3">
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Supporto Diagnostico</h3>
                  <p className="text-sm text-muted-foreground">
                    Analizza referti medici e ricevi assistenza diagnostica AI
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Carica Documenti</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload referti PDF e immagini radiologiche per analisi AI
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Gestisci Pazienti</h3>
                  <p className="text-sm text-muted-foreground">
                    Collega pazienti e monitora i loro referti in tempo reale
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:gap-6 sm:grid-cols-1 md:grid-cols-3">
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Carica Referti</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload esami del sangue e radiografie per analisi AI
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">AI Prevention</h3>
                  <p className="text-sm text-muted-foreground">
                    Fai domande e ricevi consigli personalizzati sui tuoi referti
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Indice Prevenzione</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitora il tuo score di salute e segui i suggerimenti
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Practical Examples */}
        {!isDoctor && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Esempi di casi pratici</h2>
            <div className="space-y-3">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <p className="text-sm">Paziente con familiarità per diabete tipo 2, quali protocolli preventivi?</p>
                </CardContent>
              </Card>
              
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <p className="text-sm">Gestione prevenzione secondaria post-IMA in paziente 55 anni</p>
                </CardContent>
              </Card>
              
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <p className="text-sm">Screening oncologico raccomandato per fascia 40-50 anni secondo linee guida</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

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
                  <span>Come funziona il sistema dei token AI?</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 text-sm">
                  <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                      <strong>Buone notizie!</strong> Se sei un paziente normale che usa la prevenzione AI, 
                      hai <strong>token ILLIMITATI</strong> – nessun limite, nessun costo aggiuntivo!
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h4 className="font-semibold mb-2">🎯 Chi ha token illimitati?</h4>
                    <p className="text-muted-foreground">
                      Tutti i <strong>pazienti normali</strong> che usano l'AI per prevenzione sanitaria hanno accesso 
                      illimitato. Puoi chattare con l'AI, analizzare referti e ricevere consigli senza alcun limite mensile.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">📊 Limiti token (solo per utenti specializzati)</h4>
                    <p className="text-muted-foreground mb-2">
                      I limiti si applicano SOLO agli utenti con accesso specializzato (es. formazione cybersecurity/quiz):
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>Piano Free (accesso quiz)</span>
                        <span className="font-semibold">120 token/mese</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>Piano Premium (accesso quiz)</span>
                        <span className="font-semibold">1000 token/mese</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-950 dark:to-amber-950 rounded">
                        <span className="font-semibold">Piano Premium Plus</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">Token Illimitati</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">💡 Come funzionano i token?</h4>
                    <p className="text-muted-foreground">
                      I token misurano l'utilizzo dell'AI per garantire un servizio di qualità. 
                      Ogni interazione (domanda, analisi referto, conversazione) consuma una certa quantità di token.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">📈 Consumo approssimativo</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                      <li>Domanda semplice: 2-5 token</li>
                      <li>Analisi referto medico: 10-20 token</li>
                      <li>Conversazione complessa: 20-50 token</li>
                    </ul>
                  </div>

                  <Alert className="mt-3">
                    <HelpCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Non vedi il contatore token?</strong> Significa che hai accesso illimitato! 
                      Solo gli utenti con limiti vedono il contatore nella loro interfaccia.
                    </AlertDescription>
                  </Alert>
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

        {/* DLP Implementation Guide for Admins */}
        {(user as any)?.isAdmin && (
          <Card className="mb-8 border-2 border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-orange-50 dark:bg-orange-950/50">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <Shield className="w-5 h-5" />
                Guida DLP (Data Loss Prevention) per Admin
              </CardTitle>
              <CardDescription>
                Best practices e implementazione per prevenire la perdita di dati sensibili
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-3">📋 Cos'è DLP?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Data Loss Prevention (DLP) è un insieme di strategie e tecnologie per prevenire la fuga o perdita 
                  di dati sensibili. In CIRY, questo è critico poiché gestiamo informazioni sanitarie personali.
                </p>
              </div>

              {/* Core Principles */}
              <div>
                <h3 className="text-lg font-semibold mb-3">🔐 Principi Fondamentali DLP</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">1. Classificazione dei Dati</h4>
                    <p className="text-xs text-muted-foreground">
                      Tutti i dati sono classificati in 3 livelli:
                      <ul className="list-disc list-inside mt-1 ml-2">
                        <li><strong>Critici:</strong> Referti medici, diagnosi, dati biometrici</li>
                        <li><strong>Sensibili:</strong> Email, nome, cognome, data di nascita</li>
                        <li><strong>Pubblici:</strong> Statistiche aggregate, contenuti educativi</li>
                      </ul>
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">2. Anonimizzazione Automatica</h4>
                    <p className="text-xs text-muted-foreground">
                      Prima di inviare dati all'AI, vengono rimossi:
                      <ul className="list-disc list-inside mt-1 ml-2">
                        <li>Nomi e cognomi (sostituiti con ID anonimi)</li>
                        <li>Numeri di telefono e indirizzi</li>
                        <li>Codici fiscali e identificativi personali</li>
                      </ul>
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">3. Controllo degli Accessi</h4>
                    <p className="text-xs text-muted-foreground">
                      Sistema di permessi a 3 livelli:
                      <ul className="list-disc list-inside mt-1 ml-2">
                        <li><strong>Admin:</strong> Accesso completo con audit log</li>
                        <li><strong>Medici:</strong> Solo dati pazienti collegati</li>
                        <li><strong>Pazienti:</strong> Solo i propri dati sanitari</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

              {/* Implementation Steps */}
              <div>
                <h3 className="text-lg font-semibold mb-3">⚙️ Come Implementare DLP</h3>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="step1">
                    <AccordionTrigger className="text-sm">
                      Step 1: Audit dei Dati Sensibili
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                      <p>Identifica tutti i punti dove vengono gestiti dati sensibili:</p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Upload documenti medici (Prevention page)</li>
                        <li>Conversazioni AI (chat history)</li>
                        <li>Database PostgreSQL (tabelle users, health_reports)</li>
                        <li>Email transazionali (Brevo)</li>
                        <li>Export dati admin (CSV, JSON)</li>
                      </ul>
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs font-semibold">✅ Azione Admin:</p>
                        <p className="text-xs">Vai su <code className="bg-muted px-1 py-0.5 rounded">Dashboard Admin → Audit Log</code> per vedere tutti gli accessi ai dati</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="step2">
                    <AccordionTrigger className="text-sm">
                      Step 2: Configurare Encryption at Rest
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                      <p>Tutti i dati sensibili devono essere crittografati nel database:</p>
                      <div className="mt-2 p-3 bg-muted rounded">
                        <p className="font-mono text-xs mb-2">// Esempio: Crittografia campo sensibile</p>
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`// In shared/schema.ts
import crypto from 'crypto';

// Funzione per crittografare
function encrypt(text: string): string {
  const cipher = crypto.createCipheriv(
    'aes-256-gcm', 
    Buffer.from(process.env.ENCRYPTION_KEY!), 
    Buffer.from(process.env.ENCRYPTION_IV!)
  );
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}

// Prima di salvare referti medici
const encryptedReport = encrypt(reportContent);`}
                        </pre>
                      </div>
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs font-semibold">🔑 Setup Richiesto:</p>
                        <p className="text-xs">Aggiungi <code className="bg-muted px-1 py-0.5 rounded">ENCRYPTION_KEY</code> e <code className="bg-muted px-1 py-0.5 rounded">ENCRYPTION_IV</code> alle variabili d'ambiente di sistema</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="step3">
                    <AccordionTrigger className="text-sm">
                      Step 3: Monitoraggio e Alerting
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                      <p>Configura alert automatici per attività sospette:</p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Export massivo di dati (&gt;100 record)</li>
                        <li>Accessi ripetuti falliti (&gt;5 tentativi)</li>
                        <li>Download documenti da IP sconosciuti</li>
                        <li>Modifiche ai permessi utente</li>
                      </ul>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-semibold">📊 Dashboard Consigliata:</p>
                        <p className="text-xs">Usa <code className="bg-muted px-1 py-0.5 rounded">Admin → Analytics</code> per visualizzare metriche di sicurezza in tempo reale</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="step4">
                    <AccordionTrigger className="text-sm">
                      Step 4: Data Retention Policy
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                      <p>Definisci quanto tempo conservare i dati:</p>
                      <div className="space-y-2 mt-2">
                        <div className="p-2 bg-muted rounded">
                          <p className="font-semibold text-xs">Referti Medici:</p>
                          <p className="text-xs">10 anni (obbligatorio per legge)</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="font-semibold text-xs">Chat AI:</p>
                          <p className="text-xs">2 anni, poi archiviazione anonima</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="font-semibold text-xs">Audit Logs:</p>
                          <p className="text-xs">5 anni (GDPR compliance)</p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800">
                        <p className="text-xs font-semibold">⚠️ Importante:</p>
                        <p className="text-xs">Configura job automatici per cancellare dati scaduti ogni mese</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="step5">
                    <AccordionTrigger className="text-sm">
                      Step 5: Backup e Disaster Recovery
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                      <p>Piano di backup per prevenire perdita dati:</p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li><strong>Backup giornaliero:</strong> Database completo (Neon auto-backup)</li>
                        <li><strong>Backup settimanale:</strong> File allegati (AWS S3)</li>
                        <li><strong>Test recovery:</strong> Mensile, verificare ripristino</li>
                        <li><strong>Geo-redundancy:</strong> Replica in 3 data center EU</li>
                      </ul>
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800">
                        <p className="text-xs font-semibold">✨ Best Practice:</p>
                        <p className="text-xs">Testa il ripristino ogni mese con dati di test per verificare l'integrità dei backup</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Compliance Checklist */}
              <div>
                <h3 className="text-lg font-semibold mb-3">✅ Checklist Conformità GDPR</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Consenso esplicito per raccolta dati sanitari</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Diritto all'oblio (cancellazione account)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Portabilità dati (export JSON/PDF)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Notifica breach entro 72h</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">DPO (Data Protection Officer) designato</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Audit log completo degli accessi</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Azioni Rapide Admin:</strong>
                  <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                    <li>Visualizza audit log: <code className="bg-muted px-1 py-0.5 rounded">/admin/audit</code></li>
                    <li>Export sicuro dati: <code className="bg-muted px-1 py-0.5 rounded">/admin/users → Export CSV</code></li>
                    <li>Gestisci permessi: <code className="bg-muted px-1 py-0.5 rounded">/admin/users</code></li>
                    <li>Monitor alert medici: <code className="bg-muted px-1 py-0.5 rounded">/admin/alerts</code></li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

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
