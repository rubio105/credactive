import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Send, Users, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function AdminMarketing() {
  const { toast } = useToast();
  const [profession, setProfession] = useState("");
  const [purpose, setPurpose] = useState("Promozione corsi");
  const [tone, setTone] = useState("Professionale e coinvolgente");
  const [generatedEmail, setGeneratedEmail] = useState<any>(null);
  const [targetFilters, setTargetFilters] = useState<any>({});
  const [audiencePreview, setAudiencePreview] = useState<any>(null);
  
  // Send filters
  const [sendToProfession, setSendToProfession] = useState("");
  const [sendToSubscriptionTier, setSendToSubscriptionTier] = useState("all");
  const [sendToLanguage, setSendToLanguage] = useState("all");

  // AI Generate Email
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('[AdminMarketing] Starting AI email generation with data:', data);
      const response = await apiRequest('/api/admin/marketing/ai-generate', 'POST', data, 90000); // 90s timeout
      const result = await response.json();
      console.log('[AdminMarketing] AI email generation successful:', result);
      return result;
    },
    onSuccess: (result) => {
      console.log('[AdminMarketing] onSuccess called with result:', result);
      setGeneratedEmail(result);
      toast({ title: "Email generata con successo!" });
    },
    onError: (error: any) => {
      console.error('[AdminMarketing] Generation error:', error);
      toast({ 
        title: "Errore durante la generazione", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Preview Audience
  const previewAudienceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/marketing/preview-audience', 'POST', data),
    onSuccess: (result) => {
      setAudiencePreview(result);
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore durante l'anteprima", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Send Email
  const sendMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/admin/send-marketing-email', 'POST', data);
      return await response.json();
    },
    onSuccess: (result: any) => {
      toast({ 
        title: "Email inviate con successo!", 
        description: `Inviate: ${result.sent} su ${result.totalSubscribers} iscritti newsletter`
      });
      setGeneratedEmail(null);
      setAudiencePreview(null);
      setSendToProfession("");
      setSendToSubscriptionTier("all");
      setSendToLanguage("all");
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore durante l'invio", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleGenerate = () => {
    if (!profession && !purpose) {
      toast({ 
        title: "Compila almeno un campo", 
        description: "Specifica una professione o uno scopo",
        variant: "destructive" 
      });
      return;
    }

    generateMutation.mutate({
      profession,
      purpose,
      tone,
      targetFilters
    });
  };

  const handlePreviewAudience = () => {
    const filters: any = {};
    
    if (profession) {
      filters.profession = [profession];
    }
    
    previewAudienceMutation.mutate({ targetFilters: filters });
  };

  const handlePreviewSendAudience = () => {
    const filters: any = {};
    
    if (sendToProfession) {
      filters.profession = [sendToProfession];
    }
    
    if (sendToSubscriptionTier !== "all") {
      filters.subscriptionTier = [sendToSubscriptionTier];
    }
    
    if (sendToLanguage !== "all") {
      filters.language = [sendToLanguage];
    }
    
    previewAudienceMutation.mutate({ targetFilters: filters });
  };

  const handleSend = () => {
    if (!generatedEmail) return;
    
    const filters: any = {};
    
    if (sendToProfession) {
      filters.profession = [sendToProfession];
    }
    
    if (sendToSubscriptionTier !== "all") {
      filters.subscriptionTier = [sendToSubscriptionTier];
    }
    
    if (sendToLanguage !== "all") {
      filters.language = [sendToLanguage];
    }
    
    sendMutation.mutate({
      subject: generatedEmail.subject,
      htmlContent: generatedEmail.htmlContent,
      textContent: generatedEmail.textContent,
      targetFilters: filters
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Email Marketing con AI</h2>
        <p className="text-muted-foreground">
          Genera email personalizzate per professione e invia campagne mirate
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator Section */}
        <Card data-testid="card-email-generator">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Generatore AI Email
            </CardTitle>
            <CardDescription>
              L'AI suggerirà i corsi più adatti per la professione target
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profession">Professione Target (opzionale)</Label>
              <Input
                id="profession"
                placeholder="es: Developer, Manager, CISO, Consultant..."
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                data-testid="input-profession"
              />
              <p className="text-sm text-muted-foreground">
                Lascia vuoto per target generico
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Scopo Email</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger id="purpose" data-testid="select-purpose">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Promozione corsi">Promozione corsi</SelectItem>
                  <SelectItem value="Nuovi corsi disponibili">Nuovi corsi disponibili</SelectItem>
                  <SelectItem value="Offerta speciale">Offerta speciale</SelectItem>
                  <SelectItem value="Newsletter formativa">Newsletter formativa</SelectItem>
                  <SelectItem value="Reminder completamento">Reminder completamento</SelectItem>
                  <SelectItem value="Upgrade a premium">Upgrade a premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tono Email</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone" data-testid="select-tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professionale e coinvolgente">Professionale e coinvolgente</SelectItem>
                  <SelectItem value="Formale ed elegante">Formale ed elegante</SelectItem>
                  <SelectItem value="Amichevole e motivante">Amichevole e motivante</SelectItem>
                  <SelectItem value="Urgente e persuasivo">Urgente e persuasivo</SelectItem>
                  <SelectItem value="Educativo e informativo">Educativo e informativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button 
                onClick={handleGenerate} 
                disabled={generateMutation.isPending}
                className="flex-1"
                data-testid="button-generate-email"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generateMutation.isPending ? "Generazione..." : "Genera Email AI"}
              </Button>
              
              {profession && (
                <Button 
                  variant="outline"
                  onClick={handlePreviewAudience}
                  disabled={previewAudienceMutation.isPending}
                  data-testid="button-preview-audience"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Anteprima
                </Button>
              )}
            </div>

            {audiencePreview && (
              <div className="p-4 bg-muted rounded-lg" data-testid="audience-preview">
                <p className="font-semibold mb-2">
                  Target: {audiencePreview.count} utenti
                </p>
                <p className="text-sm text-muted-foreground">
                  {profession ? `Professione: ${profession}` : 'Tutti gli iscritti alla newsletter'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card data-testid="card-email-preview">
          <CardHeader>
            <CardTitle>Anteprima Email</CardTitle>
            <CardDescription>
              Visualizza e modifica prima dell'invio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!generatedEmail ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Genera un'email con l'AI per vedere l'anteprima</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Oggetto</Label>
                  <Input 
                    value={generatedEmail.subject}
                    onChange={(e) => setGeneratedEmail({...generatedEmail, subject: e.target.value})}
                    data-testid="input-subject"
                  />
                </div>

                {generatedEmail.recommendedCourses && generatedEmail.recommendedCourses.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Corsi Raccomandati</Label>
                    <div className="flex flex-wrap gap-2">
                      {generatedEmail.recommendedCourses.map((course: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {course}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Contenuto HTML</Label>
                  <Textarea 
                    value={generatedEmail.htmlContent}
                    onChange={(e) => setGeneratedEmail({...generatedEmail, htmlContent: e.target.value})}
                    rows={12}
                    className="font-mono text-xs"
                    data-testid="textarea-html-content"
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg max-h-64 overflow-y-auto">
                  <p className="text-sm font-semibold mb-2">Anteprima Rendering:</p>
                  <div 
                    dangerouslySetInnerHTML={{ __html: generatedEmail.htmlContent }}
                    className="prose prose-sm max-w-none"
                  />
                </div>

                <Separator />

                {/* Send Filters */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Label className="font-semibold">Filtri di Invio</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="send-profession" className="text-xs">Professione</Label>
                      <Input
                        id="send-profession"
                        placeholder="es: CISO, Developer..."
                        value={sendToProfession}
                        onChange={(e) => setSendToProfession(e.target.value)}
                        data-testid="input-send-profession"
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="send-tier" className="text-xs">Subscription Tier</Label>
                      <Select value={sendToSubscriptionTier} onValueChange={setSendToSubscriptionTier}>
                        <SelectTrigger id="send-tier" data-testid="select-send-tier" className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="send-language" className="text-xs">Lingua</Label>
                      <Select value={sendToLanguage} onValueChange={setSendToLanguage}>
                        <SelectTrigger id="send-language" data-testid="select-send-language" className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutte</SelectItem>
                          <SelectItem value="it">Italiano</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    onClick={handlePreviewSendAudience}
                    disabled={previewAudienceMutation.isPending}
                    className="w-full text-sm"
                    data-testid="button-preview-send-audience"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {previewAudienceMutation.isPending ? "Caricamento..." : "Anteprima Destinatari"}
                  </Button>
                  
                  {audiencePreview && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800" data-testid="send-audience-preview">
                      <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                        📧 {audiencePreview.count} destinatari
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        L'email sarà personalizzata con nome, cognome e professione di ogni utente
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSend}
                  disabled={sendMutation.isPending}
                  className="w-full"
                  size="lg"
                  data-testid="button-send-email"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendMutation.isPending ? "Invio in corso..." : "Invia Email Personalizzate"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 Come Funziona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>1. Specifica il Target:</strong> Inserisci una professione (es: "Developer", "CISO", "Manager") per email personalizzate</p>
          <p><strong>2. L'AI Analizza:</strong> Il sistema esamina tutti i tuoi corsi/quiz/categorie e seleziona quelli più rilevanti</p>
          <p><strong>3. Genera & Personalizza:</strong> L'AI crea un'email professionale con raccomandazioni mirate che puoi modificare</p>
          <p><strong>4. Anteprima & Invio:</strong> Visualizza il pubblico target e invia la campagna agli iscritti alla newsletter</p>
          <p className="pt-2 border-t"><strong>Esempi Professioni:</strong> Developer, Security Manager, Compliance Officer, IT Manager, CISO, Consultant, Project Manager, Business Analyst</p>
        </CardContent>
      </Card>
    </div>
  );
}
