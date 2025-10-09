import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileText, Terminal, BookOpen } from "lucide-react";

export function AdminDocumentation() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="technical" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="technical" data-testid="tab-technical-docs">
            <FileText className="w-4 h-4 mr-2" />
            Documentazione Tecnica
          </TabsTrigger>
          <TabsTrigger value="commands" data-testid="tab-server-commands">
            <Terminal className="w-4 h-4 mr-2" />
            Comandi Server
          </TabsTrigger>
          <TabsTrigger value="user" data-testid="tab-user-docs">
            <BookOpen className="w-4 h-4 mr-2" />
            Guida Utente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="technical" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Architettura del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <h3>Stack Tecnologico</h3>
              <ul>
                <li><strong>Frontend:</strong> React + TypeScript + Vite + Wouter + shadcn/ui</li>
                <li><strong>Backend:</strong> Express.js + Node.js + TypeScript</li>
                <li><strong>Database:</strong> PostgreSQL (Neon Serverless) + Drizzle ORM</li>
                <li><strong>Autenticazione:</strong> Passport.js (Local + Google OAuth 2.0)</li>
                <li><strong>Pagamenti:</strong> Stripe + webhook per subscription sync</li>
                <li><strong>Email:</strong> Brevo (Sendinblue) per transazionali</li>
                <li><strong>AI:</strong> OpenAI GPT-4o (question generation, TTS, translations)</li>
                <li><strong>Real-time:</strong> WebSocket (ws) per live streaming chat</li>
              </ul>

              <h3>Deployment</h3>
              <ul>
                <li><strong>Sviluppo:</strong> Replit (auto-reload, hot module replacement)</li>
                <li><strong>Repository:</strong> GitHub (https://github.com/rubio105/credactive.git)</li>
                <li><strong>Produzione:</strong> Hetzner VPS (IP: 157.180.21.147, porta 5000)</li>
                <li><strong>Process Manager:</strong> PM2 per gestione processi Node.js</li>
                <li><strong>Build System:</strong> esbuild (backend) + Vite (frontend)</li>
              </ul>

              <h3>Database Schema</h3>
              <p>Il database è gestito tramite <strong>Drizzle ORM</strong> con schema-first design in <code>shared/schema.ts</code>.</p>
              <p><strong>Tabelle principali:</strong></p>
              <ul>
                <li><code>users</code> - Utenti (con dati Stripe, subscription status)</li>
                <li><code>categories</code> - Categorie quiz (con immagini)</li>
                <li><code>quizzes</code> - Quiz con timer e rotation control</li>
                <li><code>questions</code> - Domande (JSONB options, immagini, audio)</li>
                <li><code>user_progress</code> - Avanzamento quiz utenti</li>
                <li><code>reports</code> - Report personalità (JSONB data)</li>
                <li><code>quiz_generation_jobs</code> - Job AI generation tracking</li>
                <li><code>live_courses</code> - Corsi live acquistabili</li>
                <li><code>live_sessions</code> - Sessioni streaming WebSocket</li>
                <li><code>content_pages</code> - CMS pagine statiche</li>
                <li><code>email_templates</code> - Template email customizzabili</li>
                <li><code>settings</code> - Configurazione app (API keys, ecc.)</li>
                <li><code>corporate_agreements</code> - Contratti B2B</li>
                <li><code>corporate_licenses</code> - Licenze aziendali</li>
              </ul>

              <h3>API Endpoints Principali</h3>
              <ul>
                <li><code>POST /api/auth/login</code> - Login locale</li>
                <li><code>GET /api/auth/google</code> - OAuth Google</li>
                <li><code>GET /api/categories-with-quizzes</code> - Categorie + quiz</li>
                <li><code>POST /api/quizzes/:id/start</code> - Inizia quiz</li>
                <li><code>POST /api/quizzes/:id/submit</code> - Submit risposte</li>
                <li><code>POST /api/checkout</code> - Checkout Stripe</li>
                <li><code>POST /api/webhook</code> - Webhook Stripe</li>
                <li><code>POST /api/admin/questions/generate</code> - AI generation</li>
                <li><code>POST /api/admin/marketing/send-campaign</code> - Email marketing</li>
                <li><code>WebSocket /v2</code> - Live streaming chat</li>
              </ul>

              <h3>Variabili d'Ambiente (.env)</h3>
              <pre className="bg-muted p-4 rounded-md text-sm">
{`DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
BREVO_API_KEY=xkeysib-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...
NODE_ENV=production`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commands" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow di Deployment (Replit → GitHub → Hetzner)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">📝 STEP 1: Sviluppo su Replit</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Modifica il codice su Replit. L'applicazione si riavvia automaticamente.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">🔄 STEP 2: Push su GitHub (Shell di Replit)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Dopo aver salvato le modifiche, esegui questi comandi nella <strong>Shell di Replit</strong>:
                </p>
                <div className="space-y-2">
                  {[
                    { id: 'git-add', cmd: 'git add .' },
                    { id: 'git-commit', cmd: 'git commit -m "Descrizione modifiche"' },
                    { id: 'git-push', cmd: 'git push origin main' }
                  ].map(({ id, cmd }) => (
                    <div key={id} className="flex items-center gap-2 bg-muted p-3 rounded-md">
                      <code className="flex-1 text-sm font-mono">{cmd}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(cmd, id)}
                        data-testid={`copy-${id}`}
                      >
                        {copiedCommand === id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 <strong>Tip:</strong> Puoi anche usare il pannello Git nella barra laterale di Replit
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">🚀 STEP 3: Deploy su Hetzner (SSH dal tuo PC)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Apri il <strong>terminale del tuo computer</strong> e connettiti al server di produzione:
                </p>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">3.1 - Connessione SSH:</p>
                    <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
                      <code className="flex-1 text-sm font-mono">ssh root@157.180.21.147</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('ssh root@157.180.21.147', 'ssh')}
                        data-testid="copy-ssh"
                      >
                        {copiedCommand === 'ssh' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">3.2 - Aggiornamento codice:</p>
                    {[
                      { id: 'cd', cmd: 'cd /var/www/credactive' },
                      { id: 'pull', cmd: 'git pull origin main' },
                      { id: 'install', cmd: 'npm install' },
                      { id: 'build', cmd: 'npm run build' },
                      { id: 'restart', cmd: 'pm2 restart all' }
                    ].map(({ id, cmd }) => (
                      <div key={id} className="flex items-center gap-2 bg-muted p-3 rounded-md mb-2">
                        <code className="flex-1 text-sm font-mono">{cmd}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(cmd, id)}
                          data-testid={`copy-${id}`}
                        >
                          {copiedCommand === id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">3.3 - Verifica deployment:</p>
                    <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
                      <code className="flex-1 text-sm font-mono">pm2 logs credactive --lines 20 --nostream</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('pm2 logs credactive --lines 20 --nostream', 'logs')}
                        data-testid="copy-logs"
                      >
                        {copiedCommand === 'logs' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">✅ Log di successo:</p>
                  <pre className="text-xs font-mono bg-muted p-2 rounded">
{`10:30:05 AM [express] GET /api/content-pages 200 in 15ms
10:30:05 AM [express] GET /api/categories-with-quizzes 200 in 20ms`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">🔧 Comandi Utili PM2</h3>
                <div className="space-y-2">
                  {[
                    { id: 'status', cmd: 'pm2 status', desc: 'Verifica status applicazione' },
                    { id: 'restart-pm2', cmd: 'pm2 restart all', desc: 'Riavvia applicazione' },
                    { id: 'stop', cmd: 'pm2 stop all', desc: 'Ferma applicazione' },
                    { id: 'logs-pm2', cmd: 'pm2 logs credactive', desc: 'Log in tempo reale' },
                    { id: 'monit', cmd: 'pm2 monit', desc: 'Monitor CPU/memoria' }
                  ].map(({ id, cmd, desc }) => (
                    <div key={id} className="flex items-center gap-2">
                      <div className="flex-1 bg-muted p-3 rounded-md">
                        <code className="text-sm font-mono">{cmd}</code>
                        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(cmd, id)}
                        data-testid={`copy-${id}`}
                      >
                        {copiedCommand === id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">🔄 Sincronizzazione Database (se necessario)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Se modifichi lo schema in <code>shared/schema.ts</code>, sincronizza il database:
                </p>
                <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
                  <code className="flex-1 text-sm font-mono">npm run db:push</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('npm run db:push', 'db-push')}
                    data-testid="copy-db-push"
                  >
                    {copiedCommand === 'db-push' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Se ci sono warning di data loss, usa: <code className="bg-muted px-1 py-0.5 rounded">npm run db:push --force</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Guida per gli Amministratori</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <h3>Funzionalità Principali della Piattaforma</h3>

              <h4>📊 Analytics Dashboard</h4>
              <p>Visualizza metriche chiave in tempo reale: onboarding, revenue, coupon usage, user verification, engagement, newsletter subscription, e autenticazione.</p>

              <h4>💬 Feedback Utenti</h4>
              <p>Raccogli e gestisci feedback dagli utenti per migliorare continuamente la piattaforma.</p>

              <h4>📧 Email Marketing</h4>
              <p>Sistema AI-powered per campagne email personalizzate con segmentazione audience, raccomandazioni corsi intelligenti, preview HTML in tempo reale e integrazione Brevo.</p>

              <h4>👥 Gestione Utenti</h4>
              <p>Amministra utenti, subscription Stripe, ruoli admin, export/import CSV per operazioni bulk.</p>

              <h4>📚 Gestione Contenuti</h4>
              <ul>
                <li><strong>Categorie:</strong> Organizza quiz per argomento con immagini</li>
                <li><strong>Quiz:</strong> Crea quiz con timer, controllo rotazione domande, visibilità (public/corporate)</li>
                <li><strong>Domande:</strong> Supporto immagini, audio AI (TTS), spiegazioni dettagliate</li>
                <li><strong>Pagine CMS:</strong> Editor rich text per contenuti statici, navigazione dinamica</li>
              </ul>

              <h4>🎯 Quiz & Assessment</h4>
              <ul>
                <li>Quiz multiple-choice con spiegazioni</li>
                <li>Insight Discovery: assessment personalità 72-tipi</li>
                <li>Report professionali con color wheel visualization</li>
                <li>AI Conversational Assistant per coaching post-quiz</li>
              </ul>

              <h4>🤖 AI Question Generation</h4>
              <p>Genera domande bulk con OpenAI GPT-4o, supporto upload PDF, tracking job in tempo reale, generazione context-aware.</p>

              <h4>🏢 Corporate B2B Features</h4>
              <ul>
                <li>Contratti aziendali con bulk licensing</li>
                <li>Inviti email (singoli e CSV bulk)</li>
                <li>Dashboard company admin dedicata</li>
                <li>Assegnazione corsi company-wide (automatica per nuovi dipendenti)</li>
                <li>Leaderboard corporate-exclusive</li>
                <li>Content visibility control (public vs corporate_exclusive)</li>
              </ul>

              <h4>📺 Live Streaming & Courses</h4>
              <ul>
                <li>Corsi live acquistabili (one-time payment)</li>
                <li>Sessioni streaming con WebSocket real-time</li>
                <li>Chat persistente con moderazione</li>
                <li>Poll interattivi</li>
                <li>Embed video esterni (YouTube, Zoom, Google Meet)</li>
              </ul>

              <h4>💳 Subscription Management</h4>
              <ul>
                <li>Piani Stripe customizzabili con AI-powered descriptions</li>
                <li>Webhook sync automatico per subscription status</li>
                <li>Content gating basato su subscription attiva</li>
              </ul>

              <h4>🌍 Internazionalizzazione</h4>
              <p>Multi-lingua (IT/EN/ES) con AI real-time translation in-quiz via OpenAI GPT-4o.</p>

              <h4>🎮 Gamification</h4>
              <ul>
                <li>Nickname utenti opzionali</li>
                <li>Leaderboard globali e corporate</li>
                <li>Credit system con preservazione</li>
              </ul>

              <h4>🔧 Configurazione Avanzata</h4>
              <ul>
                <li><strong>API Keys:</strong> Gestione sicura con caching, auto-instance reset</li>
                <li><strong>Email Templates:</strong> Customizzazione con dynamic variables, preview, fallback</li>
                <li><strong>Settings:</strong> Configurazione globale app</li>
              </ul>

              <h3>Sicurezza</h3>
              <ul>
                <li>Rate limiting su API sensibili</li>
                <li>Helmet.js per headers security</li>
                <li>CORS configuration</li>
                <li>XSS protection con DOMPurify</li>
                <li>SQL injection prevention (Drizzle ORM parametrizzato)</li>
                <li>Session management con connect-pg-simple</li>
                <li>Password hashing con bcrypt</li>
              </ul>

              <h3>Support & Troubleshooting</h3>
              <p>Per problemi tecnici, controlla:</p>
              <ul>
                <li>Logs PM2: <code>pm2 logs credactive</code></li>
                <li>Status server: <code>pm2 status</code></li>
                <li>Database connectivity: verifica DATABASE_URL in .env</li>
                <li>API keys: controlla tab "API Keys" nel pannello admin</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
