import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, CheckCircle2, XCircle, Info, Calendar } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface ConsentState {
  marketingConsent: boolean;
  commercialConsent: boolean;
  scientificConsent: boolean;
}

export default function ConsentsSettings() {
  const { toast } = useToast();
  const [pendingChanges, setPendingChanges] = useState<Partial<ConsentState>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ field: keyof ConsentState; value: boolean } | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  const updateConsentMutation = useMutation({
    mutationFn: async (data: Partial<ConsentState>) => {
      const res = await apiRequest("/api/user/consents", "PATCH", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Consensi aggiornati",
        description: "Le tue preferenze sono state salvate con successo",
      });
      setPendingChanges({});
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare i consensi",
        variant: "destructive",
      });
    },
  });

  const handleConsentChange = (field: keyof ConsentState, value: boolean) => {
    // If revoking consent, show confirmation
    if (!value) {
      setConfirmAction({ field, value });
      setShowConfirmDialog(true);
    } else {
      // If accepting consent, update immediately
      setPendingChanges(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleConfirmRevoke = () => {
    if (confirmAction) {
      setPendingChanges(prev => ({ ...prev, [confirmAction.field]: confirmAction.value }));
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const handleCancelRevoke = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleSave = () => {
    if (Object.keys(pendingChanges).length > 0) {
      updateConsentMutation.mutate(pendingChanges);
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Mai accettato";
    return format(new Date(date), "dd MMMM yyyy 'alle' HH:mm", { locale: it });
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const getConsentValue = (field: keyof ConsentState) => {
    return pendingChanges[field] !== undefined ? pendingChanges[field] : (user as any)?.[field] || false;
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Gestione Consensi Privacy
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestisci le tue preferenze sui consensi privacy e comunicazioni
        </p>
      </div>

      {/* Mandatory Consents (Read-only) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Consensi Obbligatori
          </CardTitle>
          <CardDescription>
            Questi consensi sono necessari per utilizzare CIRY e non possono essere revocati. Per revocare questi consensi, contatta support@ciry.app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Privacy Consent */}
          <div className="flex items-start justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label className="font-medium">Informativa sulla Privacy</Label>
                {(user as any)?.privacyAccepted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Trattamento dei dati personali secondo GDPR
              </p>
              {(user as any)?.privacyAcceptedAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Accettato il {formatDate((user as any).privacyAcceptedAt)}
                </div>
              )}
            </div>
            <Switch checked={(user as any)?.privacyAccepted || false} disabled data-testid="switch-privacy-mandatory" />
          </div>

          {/* Health Data Consent */}
          <div className="flex items-start justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label className="font-medium">Trattamento Dati Sanitari</Label>
                {(user as any)?.healthDataConsent && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Consenso al trattamento delle informazioni sanitarie (Art. 9 GDPR)
              </p>
              {(user as any)?.healthDataConsentAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Accettato il {formatDate((user as any).healthDataConsentAt)}
                </div>
              )}
            </div>
            <Switch checked={(user as any)?.healthDataConsent || false} disabled data-testid="switch-health-mandatory" />
          </div>

          {/* Terms Consent */}
          <div className="flex items-start justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label className="font-medium">Termini e Condizioni</Label>
                {(user as any)?.termsAccepted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Accettazione dei termini di servizio e EULA
              </p>
              {(user as any)?.termsAcceptedAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Accettato il {formatDate((user as any).termsAcceptedAt)}
                </div>
              )}
            </div>
            <Switch checked={(user as any)?.termsAccepted || false} disabled data-testid="switch-terms-mandatory" />
          </div>
        </CardContent>
      </Card>

      {/* Optional Consents (Editable) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Consensi Facoltativi
          </CardTitle>
          <CardDescription>
            Puoi modificare questi consensi in qualsiasi momento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Marketing Consent */}
          <div className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label className="font-medium cursor-pointer" htmlFor="marketing-consent">
                  Newsletter e Aggiornamenti
                </Label>
                {getConsentValue('marketingConsent') ? 
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-gray-400" />
                }
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Ricevi informazioni su nuove funzioni, servizi e aggiornamenti di CIRY
              </p>
              {(user as any)?.marketingConsentAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {getConsentValue('marketingConsent') ? 'Accettato' : 'Revocato'} il {formatDate((user as any).marketingConsentAt)}
                </div>
              )}
            </div>
            <Switch 
              id="marketing-consent"
              checked={getConsentValue('marketingConsent')}
              onCheckedChange={(value) => handleConsentChange('marketingConsent', value)}
              data-testid="switch-marketing"
            />
          </div>

          {/* Commercial Consent */}
          <div className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label className="font-medium cursor-pointer" htmlFor="commercial-consent">
                  Comunicazioni Commerciali
                </Label>
                {getConsentValue('commercialConsent') ? 
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-gray-400" />
                }
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Ricevi offerte e promozioni speciali
              </p>
              {(user as any)?.commercialConsentAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {getConsentValue('commercialConsent') ? 'Accettato' : 'Revocato'} il {formatDate((user as any).commercialConsentAt)}
                </div>
              )}
            </div>
            <Switch 
              id="commercial-consent"
              checked={getConsentValue('commercialConsent')}
              onCheckedChange={(value) => handleConsentChange('commercialConsent', value)}
              data-testid="switch-commercial"
            />
          </div>

          {/* Scientific Consent */}
          <div className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label className="font-medium cursor-pointer" htmlFor="scientific-consent">
                  Ricerca Scientifica
                </Label>
                {getConsentValue('scientificConsent') ? 
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-gray-400" />
                }
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Consenti l'utilizzo dei tuoi dati anonimizzati per ricerca scientifica e didattica
              </p>
              {(user as any)?.scientificConsentAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {getConsentValue('scientificConsent') ? 'Accettato' : 'Revocato'} il {formatDate((user as any).scientificConsentAt)}
                </div>
              )}
            </div>
            <Switch 
              id="scientific-consent"
              checked={getConsentValue('scientificConsent')}
              onCheckedChange={(value) => handleConsentChange('scientificConsent', value)}
              data-testid="switch-scientific"
            />
          </div>

          {hasChanges && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-medium">Hai modifiche non salvate</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPendingChanges({})}
                    disabled={updateConsentMutation.isPending}
                    data-testid="button-cancel-changes"
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateConsentMutation.isPending}
                    data-testid="button-save-consents"
                  >
                    {updateConsentMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Revoking Consent */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Revoca Consenso</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler revocare questo consenso? Non riceverai più comunicazioni relative a questo tipo di contenuto.
              Potrai riattivarlo in qualsiasi momento da questa pagina.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelRevoke} data-testid="button-cancel-revoke">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRevoke} data-testid="button-confirm-revoke">
              Conferma Revoca
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
