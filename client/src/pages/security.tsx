import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Key, Check, X, Smartphone, ArrowLeft, FileText, Trash2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function Security() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // MFA/2FA state
  const [mfaCode, setMfaCode] = useState("");
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [manualKey, setManualKey] = useState<string>("");

  // Account deletion state
  const [showDeletionDialog, setShowDeletionDialog] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [deletionOtp, setDeletionOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);

  // Query MFA status for all users
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

  // Setup MFA mutation for all users
  const setupMfaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/auth/mfa/enable", "POST", {});
      return response.json();
    },
    onSuccess: (data: { qrCode: string; secret: string }) => {
      setQrCodeData(data.qrCode);
      setManualKey(data.secret);
      setShowMfaSetup(true);
      toast({ title: "MFA configurato", description: "Scansiona il QR code con l'app" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore durante il setup MFA",
        variant: "destructive" 
      });
    },
  });

  // Verify and enable MFA mutation for all users
  const enableMfaMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("/api/auth/mfa/verify", "POST", { code: token });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/mfa/status"] });
      setShowMfaSetup(false);
      setMfaCode("");
      setQrCodeData("");
      setManualKey("");
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

  // Disable MFA mutation for all users
  const disableMfaMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("/api/auth/mfa/disable", "POST", { code: token });
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

  const handleSetup2FA = () => {
    setupMfaMutation.mutate();
  };

  const handleEnable2FA = () => {
    if (!mfaCode || mfaCode.length !== 6) {
      toast({ title: "Inserisci un codice a 6 cifre", variant: "destructive" });
      return;
    }
    enableMfaMutation.mutate(mfaCode);
  };

  const handleDisable2FA = () => {
    const code = prompt("Inserisci il codice 2FA per confermare la disattivazione:");
    if (!code) return;
    
    if (code.length !== 6) {
      toast({ title: "Codice non valido", variant: "destructive" });
      return;
    }
    
    disableMfaMutation.mutate(code);
  };

  // Request account deletion mutation
  const requestDeletionMutation = useMutation({
    mutationFn: async (data: { reason: string; otherReason?: string }) => {
      const response = await apiRequest("/api/user/request-account-deletion", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      setOtpRequested(true);
      toast({ 
        title: "Codice inviato!", 
        description: "Controlla la tua email per il codice di verifica" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore durante la richiesta di cancellazione",
        variant: "destructive" 
      });
    },
  });

  // Confirm account deletion mutation
  const confirmDeletionMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("/api/user/confirm-account-deletion", "POST", { code });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Account eliminato", description: "Il tuo account è stato cancellato con successo" });
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore durante la cancellazione",
        variant: "destructive" 
      });
    },
  });

  const handleRequestDeletion = () => {
    if (!deletionReason) {
      toast({ title: "Seleziona una motivazione", variant: "destructive" });
      return;
    }

    if (deletionReason === "altro" && !otherReason) {
      toast({ title: "Specifica la motivazione", variant: "destructive" });
      return;
    }

    requestDeletionMutation.mutate({ reason: deletionReason, otherReason });
  };

  const handleConfirmDeletion = () => {
    if (!deletionOtp || deletionOtp.length !== 6) {
      toast({ title: "Inserisci il codice a 6 cifre", variant: "destructive" });
      return;
    }

    confirmDeletionMutation.mutate(deletionOtp);
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

        {/* MFA Section - Available for all users */}
        <Card data-testid="card-mfa">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Autenticazione a Due Fattori (MFA)
            </CardTitle>
            <CardDescription>
              Proteggi il tuo account con un ulteriore livello di sicurezza - richiede app authenticator
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
                        Account protetto con autenticazione a due fattori
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium">MFA Non Attivo</p>
                      <p className="text-sm text-muted-foreground">
                        Configura MFA per proteggere il tuo account
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Badge variant={mfaStatus?.enabled ? "default" : "outline"} data-testid="badge-mfa-status">
                {mfaStatus?.enabled ? "Abilitato" : "Disabilitato"}
              </Badge>
            </div>

              {/* 2FA Setup Button */}
              {!mfaStatus?.enabled && !showMfaSetup && (
                <div className="space-y-4">
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      Usa Google Authenticator, Authy o app simili per generare codici TOTP.
                      Al login ti verrà richiesto il codice a 6 cifre.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={handleSetup2FA} 
                    disabled={setupMfaMutation.isPending}
                    data-testid="button-enable-mfa"
                  >
                    {setupMfaMutation.isPending ? "Configurazione..." : "Configura 2FA"}
                  </Button>
                </div>
              )}

              {/* 2FA QR Code Setup */}
              {showMfaSetup && qrCodeData && (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <strong>Passaggio 1:</strong> Scansiona il QR code con la tua app authenticator
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img 
                      src={qrCodeData} 
                      alt="2FA QR Code" 
                      className="w-48 h-48"
                      data-testid="img-mfa-qr"
                    />
                  </div>
                  {manualKey && (
                    <Alert>
                      <AlertDescription>
                        <strong>Chiave manuale:</strong> <code className="bg-muted px-2 py-1 rounded">{manualKey}</code>
                      </AlertDescription>
                    </Alert>
                  )}
                  <Alert>
                    <AlertDescription>
                      <strong>Passaggio 2:</strong> Inserisci il codice a 6 cifre dall'app per attivare
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
                      className="text-center text-2xl tracking-widest font-mono"
                      data-testid="input-mfa-code"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleEnable2FA} 
                      disabled={enableMfaMutation.isPending}
                      data-testid="button-verify-mfa"
                    >
                      {enableMfaMutation.isPending ? "Verifica..." : "Verifica e Attiva"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowMfaSetup(false);
                        setQrCodeData("");
                        setManualKey("");
                        setMfaCode("");
                      }}
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
                onClick={handleDisable2FA}
                disabled={disableMfaMutation.isPending}
                data-testid="button-disable-mfa"
              >
                {disableMfaMutation.isPending ? "Disattivazione..." : "Disattiva MFA"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Consensi Section */}
        <Card data-testid="card-consensi">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Consensi e Privacy
            </CardTitle>
            <CardDescription>
              Consulta i consensi e le informazioni sulla privacy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open('/page/privacy-policy', '_blank')}
              data-testid="button-privacy-policy"
            >
              <FileText className="w-4 h-4 mr-2" />
              Privacy Policy
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open('/page/terms-of-service', '_blank')}
              data-testid="button-terms-of-service"
            >
              <FileText className="w-4 h-4 mr-2" />
              Termini di Servizio
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open('/page/cookie-policy', '_blank')}
              data-testid="button-cookie-policy"
            >
              <FileText className="w-4 h-4 mr-2" />
              Cookie Policy
            </Button>
          </CardContent>
        </Card>

        {/* Account Deletion Section */}
        <Card data-testid="card-delete-account" className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Cancella Account
            </CardTitle>
            <CardDescription>
              Elimina permanentemente il tuo account e tutti i dati associati
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Attenzione:</strong> Questa azione è irreversibile. Tutti i tuoi dati saranno eliminati permanentemente.
              </AlertDescription>
            </Alert>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowDeletionDialog(true)}
              data-testid="button-delete-account"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cancella il mio account
            </Button>
          </CardContent>
        </Card>

        {/* Deletion Confirmation Dialog */}
        <Dialog open={showDeletionDialog} onOpenChange={(open) => {
          setShowDeletionDialog(open);
          if (!open) {
            // Reset state when closing
            setDeletionReason("");
            setOtherReason("");
            setDeletionOtp("");
            setOtpRequested(false);
          }
        }}>
          <DialogContent data-testid="dialog-delete-account">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Conferma Cancellazione Account
              </DialogTitle>
              <DialogDescription>
                Questa azione è permanente e non può essere annullata.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {!otpRequested ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="deletion-reason">Perché vuoi cancellare il tuo account?</Label>
                    <Select value={deletionReason} onValueChange={setDeletionReason}>
                      <SelectTrigger data-testid="select-deletion-reason">
                        <SelectValue placeholder="Seleziona una motivazione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non_uso_app">Non uso l'app</SelectItem>
                        <SelectItem value="non_credo_tecnologia">Non credo nella tecnologia</SelectItem>
                        <SelectItem value="preferisco_altro">Preferisco altro metodo</SelectItem>
                        <SelectItem value="costi_alti">Costi troppo alti</SelectItem>
                        <SelectItem value="altro">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {deletionReason === "altro" && (
                    <div className="space-y-2">
                      <Label htmlFor="other-reason">Specifica la motivazione</Label>
                      <Input
                        id="other-reason"
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        placeholder="Inserisci il motivo..."
                        data-testid="input-other-reason"
                      />
                    </div>
                  )}

                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      <strong>I tuoi dati saranno cancellati permanentemente:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Profilo e informazioni personali</li>
                        <li>Documenti e analisi mediche</li>
                        <li>Storico appuntamenti e conversazioni</li>
                        <li>Dati wearable e monitoraggio salute</li>
                      </ul>
                      <p className="mt-2">
                        Non sarà più possibile recuperare questi dati per la prevenzione.
                      </p>
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <>
                  <Alert>
                    <Check className="w-4 h-4" />
                    <AlertDescription>
                      Abbiamo inviato un codice di verifica a 6 cifre alla tua email. Inseriscilo qui sotto per confermare la cancellazione.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Codice di Verifica</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={deletionOtp}
                        onChange={setDeletionOtp}
                        data-testid="input-deletion-otp"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Il codice scadrà tra 10 minuti
                    </p>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeletionDialog(false)}
                data-testid="button-cancel-deletion"
              >
                Annulla
              </Button>
              {!otpRequested ? (
                <Button
                  variant="destructive"
                  onClick={handleRequestDeletion}
                  disabled={requestDeletionMutation.isPending}
                  data-testid="button-request-deletion-code"
                >
                  {requestDeletionMutation.isPending ? "Invio..." : "Invia codice di verifica"}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={handleConfirmDeletion}
                  disabled={confirmDeletionMutation.isPending || deletionOtp.length !== 6}
                  data-testid="button-confirm-deletion"
                >
                  {confirmDeletionMutation.isPending ? "Eliminazione..." : "Conferma cancellazione"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
