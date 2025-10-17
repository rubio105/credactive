import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Lightbulb, Activity, Calendar, User, Stethoscope, Target, CheckCircle2, AlertCircle, Heart, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PreventionPathDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preventionPathData: any;
  onReset: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function PreventionPathDialog({
  open,
  onOpenChange,
  preventionPathData,
  onReset,
  onGenerate,
  isGenerating
}: PreventionPathDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isDoctor = (user as any)?.isDoctor;

  // Contact doctor mutation
  const contactDoctorMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/prevention/contact-doctor", "POST", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Richiesta inviata!",
        description: "Un medico Prohmed ti contatterà al più presto.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile inviare la richiesta. Riprova più tardi.",
      });
    },
  });

  if (!preventionPathData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              {isDoctor ? "Supporto al Paziente" : "Percorso di Prevenzione"}
            </DialogTitle>
            <DialogDescription>
              {isDoctor 
                ? "Genera un piano di supporto personalizzato per il tuo paziente"
                : "Un piano di prevenzione su misura basato sul tuo profilo e le tue conversazioni"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <Button
              size="lg"
              disabled={isGenerating}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={onGenerate}
              data-testid="button-generate-path"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {isGenerating ? "Generazione in corso..." : isDoctor ? "Genera Piano Supporto" : "Genera Percorso"}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              {isDoctor
                ? "L'AI analizzerà il profilo del paziente per creare un piano di supporto personalizzato"
                : "L'AI analizzerà il tuo profilo per creare un percorso di prevenzione personalizzato"
              }
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Parse prevention path data
  const text = preventionPathData.preventionPath;
  const sections = text.split(/\n(?=\d+\.\s\*\*)/).filter((s: string) => /^\d+\.\s\*\*/.test(s.trim()));

  const parseSection = (section: string) => {
    const titleMatch = section.match(/\d+\.\s\*\*(.+?)\*\*/);
    const title = titleMatch ? titleMatch[1] : '';
    const content = section.replace(/\d+\.\s\*\*.+?\*\*/, '').trim();
    return { title, content };
  };

  // Patient-focused tabs
  const renderPatientTabs = () => {
    // Extract specific sections or create synthetic ones
    const suggestions = sections.slice(0, 2).map(parseSection);
    const currentSituation = sections.slice(2, 3).map(parseSection);
    const weeklyPlan = sections.slice(3).map(parseSection);

    return (
      <>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suggestions" data-testid="tab-suggestions">
            <Lightbulb className="w-4 h-4 mr-2" />
            Suggerimenti
          </TabsTrigger>
          <TabsTrigger value="current" data-testid="tab-current">
            <Activity className="w-4 h-4 mr-2" />
            Situazione Attuale
          </TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly">
            <Calendar className="w-4 h-4 mr-2" />
            Piano Settimanale
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4 mt-4" data-testid="content-suggestions">
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Lightbulb className="w-5 h-5" />
                Consigli Personalizzati per Te
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestions.length > 0 ? (
                suggestions.map((section: { title: string; content: string }, idx: number) => (
                  <div key={idx} className="space-y-2">
                    {section.title && (
                      <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                        {section.title.replace(/([\u1F300-\u1F9FF])/g, '').trim()}
                      </h4>
                    )}
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {section.content.split('\n').map((line: string, i: number) => {
                        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                          return (
                            <div key={i} className="flex items-start gap-2 my-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{line.replace(/^[-•]\s*/, '')}</span>
                            </div>
                          );
                        }
                        return line && <p key={i} className="text-gray-700 dark:text-gray-300 mb-2">{line}</p>;
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">Continua a usare l'AI per ricevere suggerimenti personalizzati</p>
              )}
            </CardContent>
          </Card>

          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <Heart className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium mb-1">Vuoi parlare con un medico?</p>
                  <p className="text-sm mb-3">Consulta gratuitamente un medico Prohmed per approfondire il tuo percorso di prevenzione personalizzato.</p>
                </div>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                  onClick={() => contactDoctorMutation.mutate()}
                  disabled={contactDoctorMutation.isPending}
                  data-testid="button-contact-doctor"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {contactDoctorMutation.isPending ? "Invio..." : "Richiedi Contatto"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="current" className="space-y-4 mt-4" data-testid="content-current">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Activity className="w-5 h-5" />
                La Tua Situazione di Salute
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentSituation.length > 0 ? (
                currentSituation.map((section: { title: string; content: string }, idx: number) => (
                  <div key={idx} className="space-y-2">
                    {section.title && (
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                        {section.title.replace(/([\u1F300-\u1F9FF])/g, '').trim()}
                      </h4>
                    )}
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {section.content.split('\n').map((line: string, i: number) => {
                        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                          return (
                            <div key={i} className="flex items-start gap-2 my-1">
                              <span className="text-blue-600 mt-1">▪</span>
                              <span className="text-gray-700 dark:text-gray-300">{line.replace(/^[-•]\s*/, '')}</span>
                            </div>
                          );
                        }
                        return line && <p key={i} className="text-gray-700 dark:text-gray-300 mb-2">{line}</p>;
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-500 dark:text-gray-400 italic">Carica referti medici e parla con l'AI per avere una valutazione completa</p>
                  <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                    <Target className="w-4 h-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                      <p className="font-medium text-sm">Suggerimento</p>
                      <p className="text-sm mt-1">Carica i tuoi ultimi referti per avere una visione completa della tua salute</p>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4 mt-4" data-testid="content-weekly">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Calendar className="w-5 h-5" />
                Piano Settimanale di Prevenzione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklyPlan.length > 0 ? (
                weeklyPlan.map((section: { title: string; content: string }, idx: number) => (
                  <div key={idx} className="space-y-2">
                    {section.title && (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          {section.title.replace(/([\u1F300-\u1F9FF])/g, '').trim()}
                        </Badge>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {section.content.split('\n').map((line: string, i: number) => {
                        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                          return (
                            <div key={i} className="flex items-start gap-2 my-1 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                              <CheckCircle2 className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{line.replace(/^[-•]\s*/, '')}</span>
                            </div>
                          );
                        }
                        return line && <p key={i} className="text-gray-700 dark:text-gray-300 mb-2">{line}</p>;
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">Il tuo piano settimanale apparirà qui dopo la generazione</p>
              )}
            </CardContent>
          </Card>

          <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
            <Target className="w-4 h-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800 dark:text-emerald-200">
              <p className="font-medium mb-1">Obiettivo Settimanale</p>
              <p className="text-sm">Concentrati su piccoli passi quotidiani. La costanza è la chiave per una prevenzione efficace!</p>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </>
    );
  };

  // Doctor-focused tabs
  const renderDoctorTabs = () => (
    <>
      <TabsList className="grid w-full grid-cols-1">
        <TabsTrigger value="support" data-testid="tab-doctor-support">
          <Stethoscope className="w-4 h-4 mr-2" />
          Supporto al Paziente
        </TabsTrigger>
      </TabsList>

      <TabsContent value="support" className="space-y-4 mt-4" data-testid="content-doctor-support">
        {sections.map((section: string, index: number) => {
          const { title, content } = parseSection(section);
          const cleanTitle = title.replace(/([\u1F300-\u1F9FF])/g, '').trim();
          
          const colors = [
            'border-purple-200 dark:border-purple-800',
            'border-blue-200 dark:border-blue-800',
            'border-emerald-200 dark:border-emerald-800',
            'border-orange-200 dark:border-orange-800',
            'border-indigo-200 dark:border-indigo-800',
          ];

          return (
            <Card key={index} className={`${colors[index % colors.length]} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {cleanTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {content.split('\n').map((line: string, i: number) => {
                    if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                      return (
                        <div key={i} className="flex items-start gap-2 my-1">
                          <span className="text-primary mt-1">▪</span>
                          <span className="font-mono text-sm">{line.replace(/^[-•]\s*/, '')}</span>
                        </div>
                      );
                    }
                    return line && <p key={i} className="font-mono text-sm mb-2">{line}</p>;
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </TabsContent>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDoctor ? (
              <>
                <Stethoscope className="w-5 h-5 text-purple-600" />
                Piano di Supporto al Paziente
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 text-emerald-600" />
                Il Tuo Percorso di Prevenzione
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isDoctor
              ? "Piano personalizzato per supportare il paziente nella prevenzione"
              : "Piano personalizzato basato sul tuo profilo e conversazioni con l'AI"
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={isDoctor ? "support" : "suggestions"} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-1">
            {isDoctor ? renderDoctorTabs() : renderPatientTabs()}
          </div>
        </Tabs>

        <div className="flex justify-between gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onReset();
              onOpenChange(false);
            }}
            data-testid="button-reset-path"
          >
            Rigenera
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-path"
          >
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
