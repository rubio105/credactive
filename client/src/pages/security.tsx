import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Key, Check, X, Smartphone, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function Security() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // MFA state
  const [mfaCode, setMfaCode] = useState("");
  const [showMfaSetup, setShowMfaSetup] = useState(false);

  // Query MFA status
  const { data: mfaStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/auth/mfa/status"],
    enabled: !!user,
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("/api/auth/change-password", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "✅ Password modificata con successo" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore durante il cambio password",
        variant: "destructive" 
      });
    },
  });

  // Enable MFA mutation
  const enableMfaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/auth/mfa/enable", "POST", {});
      return response.json();
    },
    onSuccess: (data) => {
      setShowMfaSetup(true);
      toast({ title: "MFA configurato", description: "Usa il QR code per configurare l'app" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore durante l'attivazione MFA",
        variant: "destructive" 
      });
    },
  });

  // Verify MFA mutation
  const verifyMfaMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("/api/auth/mfa/verify", "POST", { code });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/mfa/status"] });
      setShowMfaSetup(false);
      setMfaCode("");
      toast({ title: "✅ MFA attivato con successo!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Codice non valido", 
        description: "Verifica il codice e riprova",
        variant: "destructive" 
      });
    },
  });

  // Disable MFA mutation
  const disableMfaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/auth/mfa/disable", "POST", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/mfa/status"] });
      toast({ title: "MFA disattivato" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore durante la disattivazione MFA",
        variant: "destructive" 
      });
    },
  });

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Compila tutti i campi", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Le password non coincidono", variant: "destructive" });
      return;
    }

    if (newPassword.length < 8) {
      toast({ title: "La password deve avere almeno 8 caratteri", variant: "destructive" });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleEnableMfa = () => {
    enableMfaMutation.mutate();
  };

  const handleVerifyMfa = () => {
    if (!mfaCode || mfaCode.length !== 6) {
      toast({ title: "Inserisci un codice a 6 cifre", variant: "destructive" });
      return;
    }
    verifyMfaMutation.mutate(mfaCode);
  };

  const handleDisableMfa = () => {
    if (confirm("Sei sicuro di voler disattivare l'autenticazione a due fattori?")) {
      disableMfaMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
          data-testid="button-back-to-home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Home
        </Button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Sicurezza</h1>
            <p className="text-muted-foreground">Gestisci la sicurezza del tuo account</p>
          </div>
        </div>

        {/* Change Password Section */}
        <Card data-testid="card-change-password">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Cambia Password
            </CardTitle>
            <CardDescription>
              Aggiorna la tua password per mantenere il tuo account sicuro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Password Attuale</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Inserisci la password attuale"
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nuova Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Almeno 8 caratteri"
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Conferma Nuova Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la nuova password"
                data-testid="input-confirm-password"
              />
            </div>
            <Button 
              onClick={handleChangePassword} 
              disabled={changePasswordMutation.isPending}
              data-testid="button-change-password"
            >
              {changePasswordMutation.isPending ? "Aggiornamento..." : "Cambia Password"}
            </Button>
          </CardContent>
        </Card>

        {/* MFA Section */}
        <Card data-testid="card-mfa">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Autenticazione a Due Fattori (MFA)
            </CardTitle>
            <CardDescription>
              Aggiungi un ulteriore livello di sicurezza al tuo account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* MFA Status */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {mfaStatus?.enabled ? (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">MFA Attivo</p>
                      <p className="text-sm text-muted-foreground">
                        Il tuo account è protetto con autenticazione a due fattori
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">MFA Non Attivo</p>
                      <p className="text-sm text-muted-foreground">
                        Attiva MFA per proteggere meglio il tuo account
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Badge variant={mfaStatus?.enabled ? "default" : "outline"} data-testid="badge-mfa-status">
                {mfaStatus?.enabled ? "Abilitato" : "Disabilitato"}
              </Badge>
            </div>

            {/* MFA Setup */}
            {!mfaStatus?.enabled && !showMfaSetup && (
              <div className="space-y-4">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    L'autenticazione a due fattori richiede un'app come Google Authenticator o Authy.
                    Ogni volta che accedi, dovrai inserire un codice generato dall'app.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleEnableMfa} 
                  disabled={enableMfaMutation.isPending}
                  data-testid="button-enable-mfa"
                >
                  {enableMfaMutation.isPending ? "Configurazione..." : "Attiva MFA"}
                </Button>
              </div>
            )}

            {/* MFA QR Code Setup */}
            {showMfaSetup && enableMfaMutation.data && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>Passaggio 1:</strong> Scansiona il QR code con la tua app di autenticazione
                  </AlertDescription>
                </Alert>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img 
                    src={enableMfaMutation.data.qrCode} 
                    alt="MFA QR Code" 
                    className="w-48 h-48"
                    data-testid="img-mfa-qr"
                  />
                </div>
                <Alert>
                  <AlertDescription>
                    <strong>Secret Key (alternativa):</strong> {enableMfaMutation.data.secret}
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertDescription>
                    <strong>Passaggio 2:</strong> Inserisci il codice a 6 cifre generato dall'app
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">Codice di Verifica</Label>
                  <Input
                    id="mfa-code"
                    type="text"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest"
                    data-testid="input-mfa-code"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleVerifyMfa} 
                    disabled={verifyMfaMutation.isPending}
                    data-testid="button-verify-mfa"
                  >
                    {verifyMfaMutation.isPending ? "Verifica..." : "Verifica e Attiva"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowMfaSetup(false)}
                    data-testid="button-cancel-mfa-setup"
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            )}

            {/* Disable MFA */}
            {mfaStatus?.enabled && (
              <Button 
                variant="destructive" 
                onClick={handleDisableMfa}
                disabled={disableMfaMutation.isPending}
                data-testid="button-disable-mfa"
              >
                {disableMfaMutation.isPending ? "Disattivazione..." : "Disattiva MFA"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
