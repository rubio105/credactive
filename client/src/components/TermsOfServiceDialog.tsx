import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsOfServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsOfServiceDialog({ open, onOpenChange }: TermsOfServiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Termini e Condizioni Generali - EULA</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Oggetto del Contratto</h3>
              <p>
                I presenti Termini e Condizioni (di seguito "Contratto") disciplinano l'utilizzo 
                della piattaforma CIRY (di seguito "Servizio"), fornita da ProhMed S.r.l. 
                (di seguito "Fornitore"). L'accettazione dei presenti termini è condizione 
                necessaria per l'utilizzo del Servizio.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Definizioni</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Utente:</strong> Persona fisica che si registra e utilizza il Servizio</li>
                <li><strong>Paziente:</strong> Utente che accede ai servizi di prevenzione sanitaria</li>
                <li><strong>Medico:</strong> Professionista sanitario autorizzato ad utilizzare la piattaforma</li>
                <li><strong>Account:</strong> Area personale accessibile mediante credenziali</li>
                <li><strong>Contenuti:</strong> Documenti, dati, informazioni caricate sulla piattaforma</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Requisiti di Accesso</h3>
              <p className="mb-2">Per utilizzare il Servizio è necessario:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Essere maggiorenni (18+ anni)</li>
                <li>Possedere capacità di agire</li>
                <li>Fornire dati veritieri e aggiornati</li>
                <li>Accettare integralmente questi Termini</li>
                <li>Per pazienti: possedere un codice di invito valido da un medico autorizzato</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Natura del Servizio</h3>
              <p className="mb-2">
                <strong className="text-amber-600">⚠️ IMPORTANTE - LIMITAZIONI MEDICHE:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 border-l-4 border-amber-500 pl-4 py-2 bg-amber-50 dark:bg-amber-950">
                <li>
                  <strong>Il Servizio NON sostituisce</strong> la visita medica, la diagnosi o 
                  la prescrizione di un professionista sanitario
                </li>
                <li>
                  <strong>Le analisi AI sono indicative</strong> e non costituiscono parere medico
                </li>
                <li>
                  <strong>In caso di emergenza</strong> contattare immediatamente il 118 o il 
                  proprio medico
                </li>
                <li>
                  Il Servizio ha finalità di <strong>prevenzione e supporto informativo</strong>, 
                  non diagnostico-terapeutico
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Obblighi dell'Utente</h3>
              <p className="mb-2">L'Utente si impegna a:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Custodire le proprie credenziali di accesso</li>
                <li>Non cedere il proprio account a terzi</li>
                <li>Fornire informazioni accurate e aggiornate</li>
                <li>Non utilizzare il Servizio per scopi illeciti</li>
                <li>Non caricare contenuti offensivi, diffamatori o illegali</li>
                <li>Rispettare i diritti di proprietà intellettuale</li>
                <li>Seguire le raccomandazioni del proprio medico curante</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Proprietà Intellettuale</h3>
              <p>
                Tutti i diritti di proprietà intellettuale relativi alla piattaforma CIRY 
                (software, grafica, contenuti, marchi, loghi) sono di esclusiva proprietà 
                del Fornitore. È vietata qualsiasi riproduzione, modificazione o distribuzione 
                non autorizzata.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Limitazioni di Responsabilità</h3>
              <p className="mb-2">Il Fornitore non è responsabile per:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Decisioni mediche prese sulla base delle analisi AI</li>
                <li>Interruzioni del servizio dovute a cause di forza maggiore</li>
                <li>Perdita di dati causata da malfunzionamenti del dispositivo dell'utente</li>
                <li>Danni indiretti, lucro cessante o mancato guadagno</li>
                <li>Contenuti caricati dagli utenti</li>
              </ul>
              <p className="mt-2">
                La responsabilità massima del Fornitore è limitata all'importo pagato 
                dall'Utente negli ultimi 12 mesi.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Sospensione e Risoluzione</h3>
              <p className="mb-2">Il Fornitore può sospendere o risolvere il Contratto in caso di:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Violazione dei presenti Termini</li>
                <li>Utilizzo fraudolento o illecito del Servizio</li>
                <li>Mancato pagamento (per servizi a pagamento)</li>
                <li>Comportamenti dannosi per altri utenti</li>
              </ul>
              <p className="mt-2">
                L'Utente può cancellare il proprio account in qualsiasi momento dalle 
                impostazioni della piattaforma.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Modifiche ai Termini</h3>
              <p>
                Il Fornitore si riserva il diritto di modificare i presenti Termini in 
                qualsiasi momento. Le modifiche saranno comunicate via email e pubblicate 
                sulla piattaforma. Il proseguimento dell'utilizzo del Servizio dopo le 
                modifiche costituisce accettazione delle stesse.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. Servizi a Pagamento</h3>
              <p className="mb-2">
                Alcuni servizi avanzati potrebbero richiedere un abbonamento a pagamento. 
                Le condizioni specifiche (prezzo, durata, modalità di pagamento, recesso) 
                saranno indicate al momento della sottoscrizione.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">11. Legge Applicabile e Foro</h3>
              <p>
                Il presente Contratto è regolato dalla legge italiana. Per qualsiasi 
                controversia sarà competente il Foro di [Città], salvo norme imperative 
                diverse. Il consumatore può ricorrere agli organismi di risoluzione 
                alternativa delle controversie (ADR).
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">12. Contatti</h3>
              <p>
                Per informazioni o assistenza: <br />
                Email: support@ciry.app <br />
                PEC: [pec@domain.it] <br />
                Tel: [numero telefono]
              </p>
            </section>

            <section className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                ✓ Accettando questi Termini, l'Utente dichiara di averli letti integralmente 
                e di accettarli senza riserve, riconoscendo espressamente le limitazioni 
                mediche del Servizio descritte all'art. 4.
              </p>
            </section>

            <section className="mt-6 text-xs text-muted-foreground">
              <p>Ultimo aggiornamento: Novembre 2025</p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
