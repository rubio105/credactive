import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Lock, Eye, FileCheck, UserCheck, Bell } from "lucide-react";

export function VisualSecurityPolicy() {
  return (
    <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/50">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          Riepilogo Privacy e Sicurezza
        </h3>
      </div>
      
      <Accordion type="multiple" className="w-full space-y-2" defaultValue={["item-1"]}>
        <AccordionItem value="item-1" className="border rounded-lg px-3 bg-white dark:bg-gray-900">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-600" />
              <span>Come proteggiamo i tuoi dati</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2 pt-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>Cifratura end-to-end per tutti i dati sanitari</li>
              <li>Server sicuri con certificazioni ISO 27001</li>
              <li>Backup giornalieri automatici</li>
              <li>Accesso limitato solo a personale autorizzato</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border rounded-lg px-3 bg-white dark:bg-gray-900">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span>Chi può vedere i tuoi dati</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2 pt-2">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Solo tu</strong> e i medici che autorizzi esplicitamente</li>
              <li>I medici vedono solo i dati dei loro pazienti collegati</li>
              <li>Nessuna condivisione con terze parti senza consenso</li>
              <li>Dati anonimizzati per ricerca scientifica (solo se acconsenti)</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="border rounded-lg px-3 bg-white dark:bg-gray-900">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-600" />
              <span>I tuoi diritti GDPR</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2 pt-2">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Accesso:</strong> Puoi scaricare tutti i tuoi dati in qualsiasi momento</li>
              <li><strong>Rettifica:</strong> Puoi modificare o correggere i dati inesatti</li>
              <li><strong>Cancellazione:</strong> Puoi eliminare il tuo account e tutti i dati</li>
              <li><strong>Portabilità:</strong> Puoi trasferire i dati ad altro servizio</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="border rounded-lg px-3 bg-white dark:bg-gray-900">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span>Consensi obbligatori e opzionali</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2">
            <div>
              <p className="font-medium text-foreground mb-1">✓ Obbligatori (necessari per usare CIRY):</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Trattamento dati personali e sanitari</li>
                <li>Comunicazione con i medici collegati</li>
                <li>Analisi AI per prevenzione salute</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">⊙ Opzionali (puoi scegliere):</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Newsletter e aggiornamenti prodotto</li>
                <li>Comunicazioni commerciali</li>
                <li>Ricerca scientifica anonimizzata</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5" className="border rounded-lg px-3 bg-white dark:bg-gray-900">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <span>Limitazioni mediche importanti</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2 pt-2">
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3">
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">⚠️ ATTENZIONE:</p>
              <ul className="list-disc pl-5 space-y-1 text-amber-800 dark:text-amber-200">
                <li>CIRY <strong>NON sostituisce</strong> la visita medica</li>
                <li>Le analisi AI sono <strong>indicative</strong>, non diagnostiche</li>
                <li>In emergenza chiama subito il <strong>118</strong></li>
                <li>Consulta sempre il tuo medico per decisioni sulla salute</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-4 text-xs text-center text-blue-700 dark:text-blue-300">
        <p>🔒 I tuoi dati sono protetti secondo GDPR e normative sanitarie vigenti</p>
      </div>
    </div>
  );
}
