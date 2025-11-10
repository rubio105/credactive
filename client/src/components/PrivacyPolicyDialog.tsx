import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyDialog({ open, onOpenChange }: PrivacyPolicyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Informativa sulla Privacy</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Titolare del Trattamento</h3>
              <p>
                CIRY by ProhMed S.r.l., con sede legale in [indirizzo], in persona del legale rappresentante 
                pro tempore, è il Titolare del trattamento dei dati personali.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Finalità del Trattamento</h3>
              <p className="mb-2">I dati personali raccolti saranno trattati per le seguenti finalità:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Gestione della registrazione e dell'account utente</li>
                <li>Erogazione dei servizi di prevenzione sanitaria e analisi medica tramite AI</li>
                <li>Comunicazione con medici e professionisti sanitari collegati</li>
                <li>Invio di notifiche e alert relativi alla salute</li>
                <li>Miglioramento dei servizi attraverso analisi anonimizzate</li>
                <li>Adempimento degli obblighi di legge</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Dati Sanitari</h3>
              <p>
                Il trattamento dei dati relativi alla salute (art. 9 GDPR) avviene unicamente previo 
                specifico consenso dell'interessato e nel rispetto delle normative vigenti in materia 
                sanitaria. I dati sanitari includono: documenti medici caricati, conversazioni con l'AI, 
                alert medici, misurazioni da dispositivi indossabili.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Base Giuridica</h3>
              <p className="mb-2">Il trattamento si fonda su:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Consenso esplicito dell'interessato (art. 6.1.a e 9.2.a GDPR)</li>
                <li>Esecuzione di un contratto (art. 6.1.b GDPR)</li>
                <li>Obblighi di legge (art. 6.1.c GDPR)</li>
                <li>Legittimo interesse del titolare (art. 6.1.f GDPR)</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Modalità del Trattamento</h3>
              <p>
                I dati sono trattati con strumenti elettronici e manuali, con logiche strettamente 
                correlate alle finalità e mediante l'adozione di misure di sicurezza tecniche e 
                organizzative adeguate (cifratura, controlli accesso, backup regolari, firewall).
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Conservazione dei Dati</h3>
              <p>
                I dati personali saranno conservati per il tempo strettamente necessario al 
                conseguimento delle finalità per cui sono stati raccolti, nel rispetto delle 
                normative vigenti. I dati sanitari saranno conservati per 10 anni dalla 
                cessazione del servizio, salvo diversi obblighi di legge.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Comunicazione e Diffusione</h3>
              <p className="mb-2">I dati potranno essere comunicati a:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Medici e professionisti sanitari autorizzati dal paziente</li>
                <li>Fornitori di servizi tecnici (hosting, cloud storage, analytics)</li>
                <li>Autorità competenti per obblighi di legge</li>
                <li>Soggetti terzi solo previo consenso esplicito</li>
              </ul>
              <p className="mt-2">I dati non saranno oggetto di diffusione.</p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Diritti dell'Interessato</h3>
              <p className="mb-2">L'interessato ha diritto di:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Accedere ai propri dati personali (art. 15 GDPR)</li>
                <li>Rettificare dati inesatti (art. 16 GDPR)</li>
                <li>Cancellare i dati (diritto all'oblio, art. 17 GDPR)</li>
                <li>Limitare il trattamento (art. 18 GDPR)</li>
                <li>Opporsi al trattamento (art. 21 GDPR)</li>
                <li>Portabilità dei dati (art. 20 GDPR)</li>
                <li>Revocare il consenso in qualsiasi momento</li>
                <li>Proporre reclamo all'Autorità Garante</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Trasferimento Dati Extra-UE</h3>
              <p>
                I dati potrebbero essere trasferiti in paesi extra-UE solo previa adozione di 
                adeguate garanzie (clausole contrattuali standard, Privacy Shield, ecc.) e 
                previo specifico consenso dell'interessato.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. Contatti</h3>
              <p>
                Per esercitare i propri diritti o per informazioni: <br />
                Email: privacy@ciry.app <br />
                PEC: [pec@domain.it] <br />
                Tel: [numero telefono]
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
