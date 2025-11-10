import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, UserPlus, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const logoImage = "/images/ciry-main-logo.png";

export default function Register() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Referral code state (derived from URL params)
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  // Extract referral code from URL dynamically
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('referral')?.trim().toUpperCase() || null;
    setReferralCode(code);
  }, [location]); // Re-run when location changes
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressProvince, setAddressProvince] = useState("");
  const [addressCountry, setAddressCountry] = useState("Italia");
  
  // Privacy consents
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [healthDataConsent, setHealthDataConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [commercialConsent, setCommercialConsent] = useState(false);
  const [scientificConsent, setScientificConsent] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const res = await apiRequest("/api/auth/register", "POST", data);
        return await res.json();
      } catch (error: any) {
        // Extract backend error message if available
        let errorMessage = "Si è verificato un errore durante la registrazione";
        if (error.message) {
          try {
            const match = error.message.match(/\{.*\}/);
            if (match) {
              const jsonError = JSON.parse(match[0]);
              errorMessage = jsonError.message || errorMessage;
            }
          } catch {
            errorMessage = error.message;
          }
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      if (data.requiresVerification) {
        toast({
          title: "Registrazione completata!",
          description: "Controlla la tua email per verificare l'account",
        });
        setLocation("/verify-email");
      } else {
        toast({
          title: "Successo!",
          description: data.message || "Registrazione completata",
        });
        setLocation("/login");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Errore registrazione",
        description: error.message || "Si è verificato un errore durante la registrazione",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Trim all inputs
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddressStreet = addressStreet.trim();
    const trimmedAddressCity = addressCity.trim();
    const trimmedAddressPostalCode = addressPostalCode.trim();
    const trimmedAddressProvince = addressProvince.trim().toUpperCase();
    const trimmedAddressCountry = addressCountry.trim();

    // Validation
    if (!trimmedEmail || !password || !trimmedFirstName || !trimmedLastName || !dateOfBirth || 
        !gender || !trimmedAddressStreet || !trimmedAddressCity || !trimmedAddressPostalCode || 
        !trimmedAddressProvince || !trimmedAddressCountry) {
      toast({
        title: "Campi obbligatori mancanti",
        description: "Compila tutti i campi obbligatori per continuare",
        variant: "destructive",
      });
      return;
    }

    // Email validation with regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Email non valida",
        description: "Inserisci un indirizzo email valido (es. nome@dominio.com)",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password troppo corta",
        description: "La password deve essere di almeno 8 caratteri",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password non corrispondenti",
        description: "Le password inserite non coincidono",
        variant: "destructive",
      });
      return;
    }

    // Ensure referralCode is valid before submitting
    if (!referralCode || referralCode.length === 0) {
      toast({
        title: "Codice invito mancante",
        description: "Codice di invito medico non valido. Verifica il link ricevuto.",
        variant: "destructive",
      });
      return;
    }

    // Privacy consent validation
    if (!privacyAccepted || !healthDataConsent || !termsAccepted) {
      toast({
        title: "Consensi obbligatori mancanti",
        description: "Devi accettare l'informativa sulla privacy, il trattamento dati sanitari e i termini e condizioni per registrarti.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      email: trimmedEmail,
      password,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      dateOfBirth,
      gender,
      phone: trimmedPhone || undefined,
      addressStreet: trimmedAddressStreet,
      addressCity: trimmedAddressCity,
      addressPostalCode: trimmedAddressPostalCode,
      addressProvince: trimmedAddressProvince,
      addressCountry: trimmedAddressCountry,
      isDoctor: false,
      doctorCode: referralCode,
      privacyAccepted,
      healthDataConsent,
      termsAccepted,
      marketingConsent,
      commercialConsent,
      scientificConsent,
    });
  };

  // Show blocked message if no referral code
  if (!referralCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <img 
                src={logoImage} 
                alt="CIRY Logo" 
                className="h-16 w-auto"
              />
            </div>
            <div className="flex justify-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Registrazione Solo su Invito
            </CardTitle>
            <CardDescription className="text-base">
              La registrazione è disponibile solo tramite invito del tuo medico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                Chiedi al tuo medico di condividere il link di invito personale per registrarti alla piattaforma CIRY.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full" size="lg" data-testid="button-go-to-login">
                  Vai al Login
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-center text-muted-foreground">
                Hai domande? Contatta:{" "}
                <a 
                  href="mailto:support@ciry.app" 
                  className="text-primary hover:underline font-medium"
                >
                  support@ciry.app
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show registration form if referral code is present
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 py-8">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="CIRY Logo" 
              className="h-16 w-auto"
            />
          </div>
          <div className="flex justify-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <UserPlus className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Registrazione Paziente
          </CardTitle>
          <CardDescription className="text-base">
            Sei stato invitato dal tuo medico. Completa i dati per creare il tuo account.
          </CardDescription>
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Codice medico valido: {referralCode}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Informazioni Personali</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Mario"
                    required
                    data-testid="input-firstName"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Rossi"
                    required
                    data-testid="input-lastName"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Data di Nascita *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    data-testid="input-dateOfBirth"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Genere *</Label>
                  <Select value={gender} onValueChange={setGender} required>
                    <SelectTrigger id="gender" data-testid="select-gender">
                      <SelectValue placeholder="Seleziona genere" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Uomo</SelectItem>
                      <SelectItem value="female">Donna</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Contatti</h3>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario.rossi@email.com"
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefono (opzionale)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 333 1234567"
                  data-testid="input-phone"
                />
                <p className="text-xs text-muted-foreground">
                  Consigliato per ricevere notifiche WhatsApp sugli appuntamenti
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Indirizzo</h3>
              
              <div className="space-y-2">
                <Label htmlFor="addressStreet">Via/Piazza *</Label>
                <Input
                  id="addressStreet"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  placeholder="Via Roma, 123"
                  required
                  data-testid="input-addressStreet"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressCity">Città *</Label>
                  <Input
                    id="addressCity"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    placeholder="Milano"
                    required
                    data-testid="input-addressCity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressPostalCode">CAP *</Label>
                  <Input
                    id="addressPostalCode"
                    value={addressPostalCode}
                    onChange={(e) => setAddressPostalCode(e.target.value)}
                    placeholder="20100"
                    required
                    data-testid="input-addressPostalCode"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressProvince">Provincia *</Label>
                  <Input
                    id="addressProvince"
                    value={addressProvince}
                    onChange={(e) => setAddressProvince(e.target.value)}
                    placeholder="MI"
                    required
                    maxLength={2}
                    data-testid="input-addressProvince"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressCountry">Paese *</Label>
                <Input
                  id="addressCountry"
                  value={addressCountry}
                  onChange={(e) => setAddressCountry(e.target.value)}
                  required
                  data-testid="input-addressCountry"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Sicurezza</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimo 8 caratteri"
                    required
                    data-testid="input-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Conferma Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ripeti password"
                    required
                    data-testid="input-confirmPassword"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Consents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Consensi Privacy</h3>
              
              {/* Mandatory consents */}
              <div className="space-y-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Consensi obbligatori *</p>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacyAccepted"
                    checked={privacyAccepted}
                    onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                    data-testid="checkbox-privacy"
                  />
                  <label
                    htmlFor="privacyAccepted"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Confermo di aver ricevuto, letto e accettato l'<a href="https://app.prohmed.com/page/3/privacy/lang:it" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">informativa sulla privacy</a> *
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="healthDataConsent"
                    checked={healthDataConsent}
                    onCheckedChange={(checked) => setHealthDataConsent(checked as boolean)}
                    data-testid="checkbox-health-data"
                  />
                  <label
                    htmlFor="healthDataConsent"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Presto il consenso al trattamento delle informazioni sanitarie ai sensi dell'<a href="https://app.prohmed.com/page/3/privacy/lang:it" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">informativa sulla privacy</a> *
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="termsAccepted"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    data-testid="checkbox-terms"
                  />
                  <label
                    htmlFor="termsAccepted"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Accetto i <a href="https://app.prohmed.com/page/2/terms/lang:it" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">termini e condizioni generali e EULA</a> *
                  </label>
                </div>
              </div>

              {/* Optional consents */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Consensi opzionali</p>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="marketingConsent"
                    checked={marketingConsent}
                    onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                    data-testid="checkbox-marketing"
                  />
                  <label
                    htmlFor="marketingConsent"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Presto il consenso a ricevere informazioni da parte di CIRY by prohmed sulle nuove funzioni o servizi
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="commercialConsent"
                    checked={commercialConsent}
                    onCheckedChange={(checked) => setCommercialConsent(checked as boolean)}
                    data-testid="checkbox-commercial"
                  />
                  <label
                    htmlFor="commercialConsent"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Presto il consenso a ricevere informazioni commerciali
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="scientificConsent"
                    checked={scientificConsent}
                    onCheckedChange={(checked) => setScientificConsent(checked as boolean)}
                    data-testid="checkbox-scientific"
                  />
                  <label
                    htmlFor="scientificConsent"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Presto il consenso per attività scientifiche e didattiche
                  </label>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "Registrazione in corso..." : "Crea Account"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Hai già un account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Accedi qui
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
