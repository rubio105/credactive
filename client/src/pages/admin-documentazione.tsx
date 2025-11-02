import { useAuth } from "@/hooks/useAuth";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminLayout } from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  Server, 
  Database, 
  Shield, 
  Zap, 
  Globe, 
  Brain,
  Mail,
  CreditCard,
  Bell,
  FileText
} from "lucide-react";

export default function AdminDocumentazionePage() {
  const { user, isLoading } = useAuth();
  
  // Fetch documentazione ProhMed completa
  const { data: prohmedDocs, isLoading: isLoadingDocs, error: docsError } = useQuery<string>({
    queryKey: ['/api/admin/prohmed-docs'],
    enabled: !!(user as any)?.isAdmin,
    retry: 1,
    queryFn: async () => {
      const response = await fetch('/api/admin/prohmed-docs');
      if (!response.ok) {
        throw new Error('Failed to load documentation');
      }
      return response.text(); // Return as text, not JSON
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!(user as any)?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>
              Non hai i permessi necessari per accedere alla documentazione.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documentazione Piattaforma</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Architettura, servizi e specifiche tecniche CIRY</p>
        </div>

        <Tabs defaultValue="api-prohmed" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="api-prohmed" data-testid="tab-api-prohmed">API ProhMed</TabsTrigger>
            <TabsTrigger value="architettura" data-testid="tab-architettura">Architettura</TabsTrigger>
            <TabsTrigger value="servizi" data-testid="tab-servizi">Servizi Esterni</TabsTrigger>
            <TabsTrigger value="api" data-testid="tab-api">API Interne</TabsTrigger>
            <TabsTrigger value="database" data-testid="tab-database">Database</TabsTrigger>
          </TabsList>

          <TabsContent value="api-prohmed" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <CardTitle>API Triage ProhMed - Integrazione Esterna</CardTitle>
                </div>
                <CardDescription>
                  API REST v1 per integrazione app mobile ProhMed (Android/iOS) con motore AI triage CIRY
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🔑 Production API Key</h3>
                  <code className="text-sm bg-white dark:bg-gray-800 px-3 py-2 rounded block overflow-x-auto">
                    ciry_Ldv1ZgklZhJq9AERbZfuf0ic-14U1-DTLYNmwBq4tuM
                  </code>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Rate Limit: 120 req/min | Scopes: triage:read, triage:write
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">🌍 Supporto Multilingua</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    L'API supporta 5 lingue tramite parametro opzionale <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">language</code>:
                  </p>
                  <div className="grid grid-cols-5 gap-2 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                      <div className="font-semibold">🇮🇹 it</div>
                      <div className="text-xs text-muted-foreground">Italiano</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                      <div className="font-semibold">🇬🇧 en</div>
                      <div className="text-xs text-muted-foreground">English</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                      <div className="font-semibold">🇫🇷 fr</div>
                      <div className="text-xs text-muted-foreground">Français</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                      <div className="font-semibold">🇩🇪 de</div>
                      <div className="text-xs text-muted-foreground">Deutsch</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-center">
                      <div className="font-semibold">🇪🇸 es</div>
                      <div className="text-xs text-muted-foreground">Español</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    ℹ️ Se non specificato, default a Italiano (it)
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">📡 Base URL</h3>
                  <code className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded block">
                    https://ciry.app/api/v1
                  </code>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">🔐 Autenticazione</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Tutte le richieste richiedono header:
                  </p>
                  <code className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded block">
                    X-API-Key: ciry_Ldv1ZgklZhJq9AERbZfuf0ic-14U1-DTLYNmwBq4tuM
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📋 Endpoint Disponibili</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">
                    <span className="text-green-600">POST</span> /api/v1/triage/sessions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Crea una nuova sessione di triage AI con storia medica opzionale
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Request Body (JSON):</p>
                    <pre className="text-xs overflow-x-auto"><code>{`{
  "userId": "prohmed_user_12345",
  "initialSymptoms": "Severe headache for 3 days",
  "language": "en",
  "medicalHistory": {
    "age": 35,
    "gender": "female",
    "allergies": ["penicillin"],
    "chronicConditions": ["migraine"],
    "currentMedications": ["sumatriptan 50mg"],
    "previousSurgeries": []
  }
}`}</code></pre>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Response 201 (Created):</p>
                    <pre className="text-xs overflow-x-auto"><code>{`{
  "sessionId": "uuid-session-id",
  "userId": "prohmed_user_12345",
  "status": "active",
  "createdAt": "2025-11-02T22:00:00Z",
  "firstResponse": {
    "role": "assistant",
    "content": "I'm sorry to hear you've been...",
    "urgency": "medium",
    "requiresDoctorContact": false
  }
}`}</code></pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    <span className="text-green-600">POST</span> /api/v1/triage/sessions/:sessionId/messages
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Continua conversazione in sessione esistente
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Request Body (JSON):</p>
                    <pre className="text-xs overflow-x-auto"><code>{`{
  "message": "The pain is getting worse even after medication"
}`}</code></pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    <span className="text-blue-600">GET</span> /api/v1/triage/sessions/:sessionId/messages
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Recupera storico completo conversazione
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    <span className="text-blue-600">GET</span> /api/v1/triage/sessions?userId=:userId
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Lista tutte le sessioni di un utente
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    <span className="text-blue-600">GET</span> /api/v1/docs
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Specifica API completa in formato JSON
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🧪 Test Esempi - Diverse Lingue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">🇬🇧 Esempio Inglese</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <pre className="text-xs overflow-x-auto"><code>{`curl -X POST 'https://ciry.app/api/v1/triage/sessions' \\
  -H "X-API-Key: ciry_Ldv1ZgklZhJq9AERbZfuf0ic-14U1-DTLYNmwBq4tuM" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "userId": "prohmed_en_001",
    "initialSymptoms": "Severe chest pain and shortness of breath",
    "language": "en"
  }'`}</code></pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🇫🇷 Esempio Francese</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <pre className="text-xs overflow-x-auto"><code>{`curl -X POST 'https://ciry.app/api/v1/triage/sessions' \\
  -H "X-API-Key: ciry_Ldv1ZgklZhJq9AERbZfuf0ic-14U1-DTLYNmwBq4tuM" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "userId": "prohmed_fr_001",
    "initialSymptoms": "Douleur thoracique sévère et essoufflement",
    "language": "fr"
  }'`}</code></pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🇩🇪 Esempio Tedesco</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <pre className="text-xs overflow-x-auto"><code>{`curl -X POST 'https://ciry.app/api/v1/triage/sessions' \\
  -H "X-API-Key: ciry_Ldv1ZgklZhJq9AERbZfuf0ic-14U1-DTLYNmwBq4tuM" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "userId": "prohmed_de_001",
    "initialSymptoms": "Starke Brustschmerzen und Atemnot",
    "language": "de"
  }'`}</code></pre>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Flag requiresDoctorContact</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Quando <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">requiresDoctorContact: true</code>, 
                    l'app ProhMed dovrebbe mostrare un alert e offrire il pulsante "Prenota Visita" per reindirizzare 
                    al sistema di booking interno.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📚 Documentazione Completa (1503 righe)</CardTitle>
                <CardDescription>
                  Documentazione tecnica completa con esempi React Native, Flutter, TypeScript types, testing multilingua e FAQ
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDocs ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Caricamento documentazione...</p>
                    </div>
                  </div>
                ) : prohmedDocs ? (
                  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        📄 API_INTEGRATION_PROHMED.md - Documentazione Completa
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Scroll per navigare • 1503 righe • Aggiornato: 2 Novembre 2025
                      </p>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                      <pre className="p-6 text-xs leading-relaxed whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200">
                        {prohmedDocs}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                      Errore nel caricamento della documentazione
                    </p>
                    {docsError && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {(docsError as any)?.message || 'Verifica di essere autenticato come admin'}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="architettura" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Server className="w-6 h-6 text-blue-600" />
                  <CardTitle>Stack Tecnologico</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Frontend</h3>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li>• <strong>Framework:</strong> React 18 + TypeScript</li>
                    <li>• <strong>Build Tool:</strong> Vite</li>
                    <li>• <strong>Routing:</strong> Wouter (client-side)</li>
                    <li>• <strong>State Management:</strong> TanStack Query v5</li>
                    <li>• <strong>UI Components:</strong> shadcn/ui (Radix UI + Tailwind CSS)</li>
                    <li>• <strong>Forms:</strong> React Hook Form + Zod validation</li>
                    <li>• <strong>PWA:</strong> Service Worker per funzionalità offline</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Backend</h3>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li>• <strong>Runtime:</strong> Node.js + TypeScript</li>
                    <li>• <strong>Framework:</strong> Express.js (API RESTful)</li>
                    <li>• <strong>Build:</strong> esbuild</li>
                    <li>• <strong>Authentication:</strong> Passport.js (Local + Google OAuth)</li>
                    <li>• <strong>Session:</strong> express-session + PostgreSQL store</li>
                    <li>• <strong>Security:</strong> Helmet.js, CORS, Rate Limiting, bcrypt</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Database & ORM</h3>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li>• <strong>Database:</strong> PostgreSQL (Neon Serverless)</li>
                    <li>• <strong>ORM:</strong> Drizzle ORM (type-safe)</li>
                    <li>• <strong>Vector Search:</strong> pgvector (embeddings RAG)</li>
                    <li>• <strong>Migrations:</strong> <code>npm run db:push</code></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Deployment</h3>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li>• <strong>Produzione:</strong> ciry.app (Hetzner VPS)</li>
                    <li>• <strong>Process Manager:</strong> PM2</li>
                    <li>• <strong>Version Control:</strong> GitHub</li>
                    <li>• <strong>Server:</strong> Express (porta 5000)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-green-600" />
                  <CardTitle>Sicurezza & Compliance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• <strong>GDPR Compliant:</strong> Audit log per tracciamento accessi</li>
                  <li>• <strong>Password Hashing:</strong> bcrypt (10 rounds)</li>
                  <li>• <strong>XSS Protection:</strong> DOMPurify sanitization</li>
                  <li>• <strong>SQL Injection:</strong> Drizzle ORM parametrized queries</li>
                  <li>• <strong>Rate Limiting:</strong> express-rate-limit</li>
                  <li>• <strong>MFA:</strong> TOTP (speakeasy) per autenticazione a due fattori</li>
                  <li>• <strong>Session Security:</strong> HttpOnly cookies, secure flags</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servizi" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-purple-600" />
                  <CardTitle>Servizi AI</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">OpenAI GPT-4o</h3>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <li>• Generazione domande quiz bulk (AI Question Generation)</li>
                      <li>• Assistente conversazionale AI (scenario-based learning)</li>
                      <li>• Email marketing intelligente (AI Email Marketing)</li>
                      <li>• Text-to-Speech (TTS) per accessibilità</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Google Gemini AI</h3>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <li>• <strong>gemini-2.5-pro:</strong> Analisi documenti medici avanzata</li>
                      <li>• <strong>gemini-2.5-flash:</strong> Triage conversazionale rapido</li>
                      <li>• <strong>text-embedding-004:</strong> Generazione embeddings per RAG</li>
                      <li>• Analisi immagini radiologiche con AI confidence scoring</li>
                      <li>• Generazione cruciverba medici interattivi</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <CardTitle>Stripe - Pagamenti & Subscription</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• <strong>Subscription Plans:</strong> Free, Premium, Premium Plus</li>
                  <li>• <strong>Token Limits:</strong> 30, 1000, 5000 token/mese</li>
                  <li>• <strong>Webhook:</strong> /api/stripe/webhook (gestione eventi)</li>
                  <li>• <strong>Customer Portal:</strong> Gestione self-service abbonamenti</li>
                  <li>• <strong>Corporate B2B:</strong> License bulk per organizzazioni</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-red-600" />
                  <CardTitle>Brevo (Sendinblue) - Email Service</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• <strong>Transactional Email:</strong> Reset password, verifiche, notifiche</li>
                  <li>• <strong>Email Marketing:</strong> Campagne intelligenti AI-powered</li>
                  <li>• <strong>Templates:</strong> Sistema gestione template dinamici</li>
                  <li>• <strong>API Key:</strong> BREVO_API_KEY (env secret)</li>
                  <li>• <strong>Email Queue:</strong> Scheduling intelligente notifiche</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-yellow-600" />
                  <CardTitle>Web Push Notifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• <strong>Protocol:</strong> Web Push API + VAPID</li>
                  <li>• <strong>Features:</strong> Browser notifications real-time</li>
                  <li>• <strong>Admin Broadcast:</strong> Invio massivo notifiche</li>
                  <li>• <strong>User Consent:</strong> Opt-in gestito dal frontend</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-orange-600" />
                  <CardTitle>Endpoint Principali</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Autenticazione</h3>
                  <div className="space-y-1 text-sm font-mono text-gray-600 dark:text-gray-300">
                    <div><span className="text-green-600">POST</span> /api/auth/login</div>
                    <div><span className="text-green-600">POST</span> /api/auth/logout</div>
                    <div><span className="text-green-600">POST</span> /api/auth/register</div>
                    <div><span className="text-blue-600">GET</span> /api/auth/user</div>
                    <div><span className="text-green-600">POST</span> /api/auth/google</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Medical Prevention (AI)</h3>
                  <div className="space-y-1 text-sm font-mono text-gray-600 dark:text-gray-300">
                    <div><span className="text-green-600">POST</span> /api/prevention/upload</div>
                    <div><span className="text-green-600">POST</span> /api/prevention/chat</div>
                    <div><span className="text-blue-600">GET</span> /api/prevention/reports</div>
                    <div><span className="text-green-600">POST</span> /api/prevention/alert</div>
                    <div><span className="text-blue-600">GET</span> /api/alerts</div>
                    <div><span className="text-green-600">POST</span> /api/alerts/:id/confirm</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Quiz & Corsi</h3>
                  <div className="space-y-1 text-sm font-mono text-gray-600 dark:text-gray-300">
                    <div><span className="text-blue-600">GET</span> /api/categories</div>
                    <div><span className="text-blue-600">GET</span> /api/quizzes/:categoryId</div>
                    <div><span className="text-green-600">POST</span> /api/quizzes/:id/submit</div>
                    <div><span className="text-blue-600">GET</span> /api/courses</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Doctor Features</h3>
                  <div className="space-y-1 text-sm font-mono text-gray-600 dark:text-gray-300">
                    <div><span className="text-blue-600">GET</span> /api/doctor/linking-code</div>
                    <div><span className="text-blue-600">GET</span> /api/doctor/linked-patients</div>
                    <div><span className="text-green-600">POST</span> /api/doctor/link-patient</div>
                    <div><span className="text-blue-600">GET</span> /api/doctor/alerts</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Subscription & Payments</h3>
                  <div className="space-y-1 text-sm font-mono text-gray-600 dark:text-gray-300">
                    <div><span className="text-GREEN-600">POST</span> /api/create-checkout-session</div>
                    <div><span className="text-green-600">POST</span> /api/stripe/webhook</div>
                    <div><span className="text-blue-600">GET</span> /api/subscription-plans</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Admin Management</h3>
                  <div className="space-y-1 text-sm font-mono text-gray-600 dark:text-gray-300">
                    <div><span className="text-blue-600">GET</span> /api/admin/stats</div>
                    <div><span className="text-blue-600">GET</span> /api/admin/users</div>
                    <div><span className="text-green-600">POST</span> /api/admin/users</div>
                    <div><span className="text-green-600">POST</span> /api/admin/broadcast-notification</div>
                    <div><span className="text-blue-600">GET</span> /api/admin/feedback</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-indigo-600" />
                  <CardTitle>Schema Database Principale</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Core Tables</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• <strong>users:</strong> Utenti, ruoli, subscription, token, MFA</li>
                    <li>• <strong>subscription_plans:</strong> Piani dinamici (Free/Premium/Plus)</li>
                    <li>• <strong>corporate_agreements:</strong> Contratti B2B enterprise</li>
                    <li>• <strong>corporate_licenses:</strong> Licenze bulk aziendali</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Quiz System</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• <strong>categories:</strong> Categorie quiz gerarchiche</li>
                    <li>• <strong>quizzes:</strong> Quiz con timer e randomization</li>
                    <li>• <strong>questions:</strong> Domande con multi-lingua</li>
                    <li>• <strong>user_quiz_progress:</strong> Tracking progressi utente</li>
                    <li>• <strong>personality_reports:</strong> Report 72 personalità</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Medical Prevention</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• <strong>prevention_documents:</strong> Documenti medici + analisi AI</li>
                    <li>• <strong>medical_alerts:</strong> Sistema Alert Medici (triage)</li>
                    <li>• <strong>doctor_patient_links:</strong> Collegamenti medico-paziente</li>
                    <li>• <strong>medical_notes:</strong> Note cliniche strutturate</li>
                    <li>• <strong>rag_knowledge_base:</strong> Knowledge base + pgvector embeddings</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Content & Communication</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• <strong>courses:</strong> Corsi live + streaming</li>
                    <li>• <strong>static_pages:</strong> CMS pagine statiche</li>
                    <li>• <strong>email_templates:</strong> Template email dinamici</li>
                    <li>• <strong>webinars:</strong> Webinar prevention education</li>
                    <li>• <strong>push_subscriptions:</strong> Web Push VAPID subscriptions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Gamification & Engagement</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• <strong>leaderboard_entries:</strong> Classifiche globali/corporate</li>
                    <li>• <strong>user_feedback:</strong> Feedback utenti categorizzato</li>
                    <li>• <strong>appointments:</strong> Prenotazioni medico-paziente</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Security & Compliance</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• <strong>audit_logs:</strong> GDPR-compliant access tracking</li>
                    <li>• <strong>sessions:</strong> PostgreSQL session store (connect-pg-simple)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-teal-600" />
                  <CardTitle>Relazioni Chiave</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• <strong>User → Prevention Documents:</strong> 1:N (userId foreign key)</li>
                  <li>• <strong>User → Medical Alerts:</strong> 1:N (userId + severity triage)</li>
                  <li>• <strong>Doctor → Patient Links:</strong> N:M (doctor_patient_links junction)</li>
                  <li>• <strong>User → Corporate License:</strong> N:1 (corporate B2B hierarchy)</li>
                  <li>• <strong>Quiz → Questions:</strong> 1:N (quizId foreign key)</li>
                  <li>• <strong>RAG Knowledge → Embeddings:</strong> 1:1 (pgvector semantic search)</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
