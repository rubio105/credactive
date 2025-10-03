import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Award, Users, Target, BookOpen, TrendingUp } from "lucide-react";

export default function ChiSiamo() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <Badge className="mb-4" data-testid="badge-about">
            Chi siamo
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            IBI ACADEMY
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            La piattaforma leader per la preparazione alle certificazioni professionali in Cybersecurity, Compliance, Business Innovation e Leadership
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                La Nostra Missione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                IBI ACADEMY nasce con l'obiettivo di rendere accessibile e di qualità la formazione professionale. 
                Aiutiamo professionisti e aziende a raggiungere le certificazioni più importanti del settore attraverso 
                un metodo di apprendimento interattivo, pratico e sempre aggiornato.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-6 h-6 text-primary" />
                I Nostri Valori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ <strong>Eccellenza</strong> - Contenuti di altissima qualità</li>
                <li>✓ <strong>Innovazione</strong> - Metodologie all'avanguardia</li>
                <li>✓ <strong>Accessibilità</strong> - Formazione per tutti</li>
                <li>✓ <strong>Risultati</strong> - Focus sul successo certificativo</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Cosa Offriamo</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">2.000+ Domande</h3>
              <p className="text-sm text-muted-foreground">
                Database completo e costantemente aggiornato per tutte le certificazioni
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">10 Categorie</h3>
              <p className="text-sm text-muted-foreground">
                Cybersecurity, Compliance, Business, Leadership e molto altro
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Certificati Riconosciuti</h3>
              <p className="text-sm text-muted-foreground">
                Preparazione per CISSP, CISM, OSCP, ISO 27001, GDPR e altri
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Il Nostro Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              IBI ACADEMY è composta da un team di esperti certificati nei diversi domini di competenza. 
              I nostri autori hanno esperienza diretta nelle certificazioni che insegnano e lavorano quotidianamente 
              per mantenere i contenuti aggiornati con le ultime evoluzioni del settore.
            </p>
            <p className="text-muted-foreground">
              Ogni domanda, ogni quiz, ogni percorso formativo è stato progettato con cura per massimizzare 
              le possibilità di successo dei nostri studenti.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
