import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Shield, Lock, Key, CheckCircle, User, Globe, Upload, Edit2, MessageCircle, Bell, Smartphone, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '');
  const [whatsappEnabled, setWhatsappEnabled] = useState(user?.whatsappNotificationsEnabled || false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const authenticatedProfileImage = useAuthenticatedImage(user?.profileImageUrl);

  // Security tab state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [manualKey, setManualKey] = useState<string>("");

  // Query MFA status
  const { data: mfaStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/auth/mfa/status"],
    enabled: !!user,
  });

  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/user/upload-profile-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Foto caricata",
        description: "La tua foto profilo è stata aggiornata con successo",
      });
      setIsUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il caricamento della foto",
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const updateWhatsAppMutation = useMutation({
    mutationFn: async (data: { whatsappNumber: string; whatsappNotificationsEnabled: boolean }) => {
      const response = await apiRequest('/api/user/whatsapp-settings', 'PATCH', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Impostazioni WhatsApp salvate",
        description: "Le tue preferenze WhatsApp sono state aggiornate con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio delle impostazioni WhatsApp",
        variant: "destructive",
      });
    },
  });

  const requestWhatsAppVerificationMutation = useMutation({
    mutationFn: async (whatsappNumber: string) => {
      const response = await apiRequest('/api/user/whatsapp/request-verification', 'POST', { whatsappNumber });
      return response.json();
    },
    onSuccess: (data) => {
      setExpiryTime(new Date(data.expiresAt));
      setVerificationDialogOpen(true);
      toast({
        title: "Codice inviato!",
        description: "Controlla WhatsApp per il codice di verifica",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'invio del codice di verifica",
        variant: "destructive",
      });
    },
  });

  const verifyWhatsAppCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('/api/user/whatsapp/verify-code', 'POST', { code });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setVerificationDialogOpen(false);
      setVerificationCode('');
      setWhatsappEnabled(true);
      toast({
        title: "Numero verificato!",
        description: "Il tuo numero WhatsApp è stato verificato con successo. Le notifiche sono state abilitate.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la verifica del codice",
        variant: "destructive",
      });
    },
  });

  // Security mutations
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

  const handleSaveWhatsApp = () => {
    // Validate phone number format if enabled
    if (whatsappEnabled && (!whatsappNumber || whatsappNumber.trim().length === 0)) {
      toast({
        title: "Errore",
        description: "Inserisci un numero WhatsApp valido per attivare le notifiche",
        variant: "destructive",
      });
      return;
    }

    // Basic phone validation (international format)
    if (whatsappEnabled && !whatsappNumber.match(/^\+?\d{10,15}$/)) {
      toast({
        title: "Formato non valido",
        description: "Inserisci un numero nel formato internazionale (es. +393331234567)",
        variant: "destructive",
      });
      return;
    }

    // If disabling, just save without verification
    if (!whatsappEnabled) {
      updateWhatsAppMutation.mutate({
        whatsappNumber: whatsappNumber.trim(),
        whatsappNotificationsEnabled: false,
      });
      return;
    }

    // If number changed or not verified yet, request verification
    const numberChanged = user?.whatsappNumber !== whatsappNumber.trim();
    const isVerified = (user as any)?.whatsappVerified;
    
    if (numberChanged || !isVerified) {
      requestWhatsAppVerificationMutation.mutate(whatsappNumber.trim());
    } else {
      // Number already verified, just update settings
      updateWhatsAppMutation.mutate({
        whatsappNumber: whatsappNumber.trim(),
        whatsappNotificationsEnabled: whatsappEnabled,
      });
    }
  };

  const handleVerifyCode = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Codice non valido",
        description: "Inserisci il codice a 6 cifre ricevuto su WhatsApp",
        variant: "destructive",
      });
      return;
    }

    verifyWhatsAppCodeMutation.mutate(verificationCode);
  };

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

  const handleSetupMFA = () => {
    setupMfaMutation.mutate();
  };

  const handleEnableMFA = () => {
    if (!mfaCode || mfaCode.length !== 6) {
      toast({ title: "Inserisci un codice a 6 cifre", variant: "destructive" });
      return;
    }
    enableMfaMutation.mutate(mfaCode);
  };

  const handleDisableMFA = () => {
    const code = prompt("Inserisci il codice MFA per confermare la disattivazione:");
    if (!code) return;
    
    if (code.length !== 6) {
      toast({ title: "Codice non valido", variant: "destructive" });
      return;
    }
    
    disableMfaMutation.mutate(code);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "File non valido",
        description: "Per favore seleziona un file immagine",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File troppo grande",
        description: "La dimensione massima è 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    uploadProfileImageMutation.mutate(file);
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorizzato",
        description: "Devi effettuare il login",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (user?.whatsappNumber) {
      setWhatsappNumber(user.whatsappNumber);
    }
    if (user?.whatsappNotificationsEnabled !== undefined && user?.whatsappNotificationsEnabled !== null) {
      setWhatsappEnabled(user.whatsappNotificationsEnabled);
    }
  }, [user?.whatsappNumber, user?.whatsappNotificationsEnabled]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <BackButton className="mb-4" />
          <h1 className="text-4xl font-bold mb-2">Impostazioni</h1>
          <p className="text-xl text-muted-foreground">
            Gestisci il tuo profilo e la sicurezza del tuo account
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-2 font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-profile"
          >
            <User className="w-4 h-4 inline mr-2" />
            Profilo
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-2 font-semibold transition-colors ${
              activeTab === 'security'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-security"
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Sicurezza
          </button>
        </div>

        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Cambio Password
                </CardTitle>
                <CardDescription>Aggiorna la password del tuo account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Password attuale</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Inserisci password attuale"
                    data-testid="input-current-password"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">Nuova password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 8 caratteri"
                    data-testid="input-new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Conferma nuova password</Label>
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
                  className="w-full"
                  data-testid="button-change-password"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {changePasswordMutation.isPending ? 'Modifica in corso...' : 'Cambia password'}
                </Button>
              </CardContent>
            </Card>

            {/* MFA Setup */}
            <Card>
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
                {!mfaStatus?.enabled && !showMfaSetup && (
                  <div className="space-y-4">
                    <Alert>
                      <Shield className="w-4 h-4" />
                      <AlertDescription>
                        L'autenticazione a due fattori (MFA) protegge il tuo account richiedendo
                        un codice temporaneo in aggiunta alla password quando effettui il login.
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handleSetupMFA}
                      disabled={setupMfaMutation.isPending}
                      className="w-full"
                      data-testid="button-enable-mfa"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      {setupMfaMutation.isPending ? 'Generazione QR Code...' : 'Attiva MFA'}
                    </Button>
                  </div>
                )}

                {showMfaSetup && qrCodeData && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        <strong>Scansiona il QR Code</strong> con la tua app di autenticazione
                        (Google Authenticator, Microsoft Authenticator, Authy, ecc.)
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <img src={qrCodeData} alt="QR Code MFA" className="w-64 h-64" />
                    </div>

                    <div className="space-y-2">
                      <Label>Chiave manuale (se non puoi scansionare il QR code)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={manualKey}
                          readOnly
                          className="font-mono text-sm"
                          data-testid="input-mfa-secret"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mfa-code">Codice di verifica (6 cifre)</Label>
                      <Input
                        id="mfa-code"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="font-mono text-center text-lg"
                        data-testid="input-mfa-code"
                      />
                    </div>

                    <Button
                      onClick={handleEnableMFA}
                      disabled={enableMfaMutation.isPending}
                      className="w-full"
                      data-testid="button-verify-mfa"
                    >
                      {enableMfaMutation.isPending ? 'Verifica in corso...' : 'Verifica e attiva'}
                    </Button>
                  </div>
                )}

                {mfaStatus?.enabled && (
                  <div className="space-y-4">
                    <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        <strong>MFA attivo</strong> - Il tuo account è protetto con autenticazione a due fattori
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handleDisableMFA}
                      variant="destructive"
                      disabled={disableMfaMutation.isPending}
                      className="w-full"
                      data-testid="button-disable-mfa"
                    >
                      {disableMfaMutation.isPending ? 'Disattivazione...' : 'Disattiva MFA'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Foto Profilo</CardTitle>
                <CardDescription>Personalizza la tua immagine profilo che apparirà nella classifica</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-primary/20">
                      <AvatarImage 
                        src={authenticatedProfileImage || undefined} 
                        alt="Profile"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Cambia foto profilo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Carica un'immagine JPG, PNG o GIF. Dimensione massima 5MB.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="input-profile-image"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      data-testid="button-upload-profile-image"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Caricamento...' : 'Carica foto'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informazioni Profilo</CardTitle>
                <CardDescription>I tuoi dati personali</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-lg" data-testid="text-user-name">{user?.firstName || '-'} {user?.lastName || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg" data-testid="text-user-email">{user?.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lingua</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <p className="text-lg" data-testid="text-user-language">
                      {user?.language === 'it' ? 'Italiano' : 
                       user?.language === 'en' ? 'English' : 
                       user?.language === 'es' ? 'Español' : 
                       user?.language === 'fr' ? 'Français' : 'Italiano'}
                    </p>
                  </div>
                </div>
                {user?.companyName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Azienda</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <p className="text-lg" data-testid="text-user-company">{user.companyName}</p>
                      <Badge variant="secondary" className="ml-2">Accesso Corporate</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* WhatsApp Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  Notifiche WhatsApp
                  {(user as any)?.whatsappVerified && (
                    <Badge className="bg-green-600 hover:bg-green-700 ml-auto" data-testid="badge-whatsapp-verified">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verificato
                    </Badge>
                  )}
                  {user?.whatsappNumber && !(user as any)?.whatsappVerified && (
                    <Badge variant="secondary" className="ml-auto" data-testid="badge-whatsapp-not-verified">
                      Non verificato
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Ricevi notifiche importanti via WhatsApp per alert medici urgenti e appuntamenti
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-sm">Abilita notifiche WhatsApp</p>
                      <p className="text-xs text-muted-foreground">
                        Riceverai messaggi per alert EMERGENCY e conferme appuntamenti
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={whatsappEnabled}
                    onCheckedChange={setWhatsappEnabled}
                    data-testid="switch-whatsapp-enabled"
                  />
                </div>

                {whatsappEnabled && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Numero WhatsApp</label>
                    <Input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+393331234567"
                      className="font-mono"
                      data-testid="input-whatsapp-number"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formato internazionale (es. +39 per Italia, +1 per USA). Riceverai un codice di verifica via WhatsApp.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSaveWhatsApp}
                  disabled={updateWhatsAppMutation.isPending || requestWhatsAppVerificationMutation.isPending}
                  className="w-full"
                  data-testid="button-save-whatsapp"
                >
                  {requestWhatsAppVerificationMutation.isPending && 'Invio codice...'}
                  {updateWhatsAppMutation.isPending && 'Salvataggio...'}
                  {!updateWhatsAppMutation.isPending && !requestWhatsAppVerificationMutation.isPending && 
                    (whatsappEnabled && (user?.whatsappNumber !== whatsappNumber || !(user as any)?.whatsappVerified) 
                      ? 'Verifica numero WhatsApp' 
                      : 'Salva impostazioni WhatsApp')}
                </Button>

                {(user as any)?.whatsappVerified && user?.whatsappNumber && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Numero verificato: {user.whatsappNumber}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* WhatsApp Verification Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent data-testid="dialog-whatsapp-verification">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Verifica numero WhatsApp
            </DialogTitle>
            <DialogDescription>
              Abbiamo inviato un codice a 6 cifre al numero {whatsappNumber}. 
              Inserisci il codice ricevuto per completare la verifica.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Codice di verifica</Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center text-2xl font-mono tracking-widest"
                data-testid="input-verification-code"
              />
            </div>

            {expiryTime && (
              <Alert>
                <AlertDescription className="text-xs">
                  Il codice scade tra {Math.max(0, Math.floor((expiryTime.getTime() - Date.now()) / 60000))} minuti.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setVerificationDialogOpen(false);
                setVerificationCode('');
              }}
              data-testid="button-cancel-verification"
            >
              Annulla
            </Button>
            <Button
              onClick={handleVerifyCode}
              disabled={verifyWhatsAppCodeMutation.isPending || verificationCode.length !== 6}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-verify-code"
            >
              {verifyWhatsAppCodeMutation.isPending ? 'Verifica in corso...' : 'Verifica'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
