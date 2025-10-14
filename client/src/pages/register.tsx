import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
const logoImage = "/images/ciry-main-logo.png";
import { Link } from "wouter";
import { CheckCircle2, XCircle, Stethoscope, User } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    accountType: "", // "doctor" or "patient"
    specialization: "", // Replaces profession/education
    company: "",
    addressStreet: "",
    addressCity: "",
    addressPostalCode: "",
    addressProvince: "",
    addressCountry: "",
    language: "it",
    promoCode: "",
    newsletterConsent: false,
  });

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return checks;
  };

  const passwordChecks = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordChecks).every(check => check);

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const res = await apiRequest("/api/auth/register", "POST", data);
        return await res.json();
      } catch (error: any) {
        let errorMessage = "Si è verificato un errore. Riprova.";
        if (error.message) {
          try {
            const match = error.message.match(/\{.*\}/);
            if (match) {
              const jsonError = JSON.parse(match[0]);
              errorMessage = jsonError.message || errorMessage;
            }
          } catch {}
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      if (data.requiresVerification) {
        toast({
          title: "Registrazione completata!",
          description: "Controlla la tua email per il codice di verifica.",
        });
        setLocation(`/verify-email?email=${encodeURIComponent(data.email)}`);
      } else if (data.message) {
        // For doctor registrations or custom messages from backend
        toast({
          title: "Richiesta inviata",
          description: data.message,
        });
        // Redirect to login after showing success message
        setTimeout(() => setLocation('/login'), 2000);
      } else {
        toast({
          title: "Registrazione completata",
          description: "Benvenuto su CIRY!",
        });
        window.location.href = "/";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Errore nella registrazione",
        description: error.message || "Si è verificato un errore. Riprova.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({
        title: "Campi obbligatori mancanti",
        description: "Compila tutti i campi obbligatori contrassegnati con *",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password non corrispondenti",
        description: "Le due password inserite non coincidono",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: "Password non valida",
        description: "La password non soddisfa tutti i requisiti di sicurezza",
        variant: "destructive",
      });
      return;
    }

    if (!formData.gender || !formData.addressCountry || !formData.accountType) {
      toast({
        title: "Selezioni mancanti",
        description: "Seleziona tutti i campi obbligatori dai menu a tendina",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      phone: formData.phone || null,
      isDoctor: formData.accountType === 'doctor',
      specialization: formData.specialization || null, // New field
      company: formData.company || null,
      addressStreet: formData.addressStreet,
      addressCity: formData.addressCity,
      addressPostalCode: formData.addressPostalCode,
      addressProvince: formData.addressProvince,
      addressCountry: formData.addressCountry,
      language: formData.language,
      promoCode: formData.promoCode || null,
      newsletterConsent: formData.newsletterConsent,
    };

    registerMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 py-8">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="CIRY" className="h-12" />
          </div>
          <CardTitle className="text-2xl">Crea il tuo account</CardTitle>
          <CardDescription>
            Compila tutti i campi per iniziare la tua preparazione professionale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dati Personali */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Dati Personali</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    placeholder="Mario"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    autoComplete="given-name"
                    required
                    data-testid="input-firstName"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome *</Label>
                  <Input
                    id="lastName"
                    placeholder="Rossi"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    autoComplete="family-name"
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
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    autoComplete="bday"
                    required
                    data-testid="input-dateOfBirth"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Sesso *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    required
                  >
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Maschio</SelectItem>
                      <SelectItem value="female">Femmina</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                      <SelectItem value="prefer_not_to_say">Preferisco non specificare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tipo di Accesso */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Tipo di Accesso *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Accesso Professionale (Doctor) */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, accountType: 'doctor' })}
                  className={`relative p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                    formData.accountType === 'doctor'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                  }`}
                  data-testid="button-account-doctor"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      formData.accountType === 'doctor'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-lg ${
                        formData.accountType === 'doctor'
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        Accesso Professionale
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Per medici e professionisti sanitari
                      </p>
                    </div>
                    {formData.accountType === 'doctor' && (
                      <CheckCircle2 className="w-6 h-6 text-blue-500 absolute top-3 right-3" />
                    )}
                  </div>
                </button>

                {/* Accesso Personale (Patient) */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, accountType: 'patient' })}
                  className={`relative p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                    formData.accountType === 'patient'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md'
                  }`}
                  data-testid="button-account-patient"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      formData.accountType === 'patient'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-lg ${
                        formData.accountType === 'patient'
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        Accesso Personale
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Per utenti e pazienti
                      </p>
                    </div>
                    {formData.accountType === 'patient' && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 absolute top-3 right-3" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Contatti */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Contatti</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@esempio.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    autoComplete="email"
                    required
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+39 123 456 7890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    autoComplete="tel"
                    data-testid="input-phone"
                  />
                </div>
              </div>
            </div>

            {/* Specializzazione (Solo per Medici) */}
            {formData.accountType === 'doctor' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Informazioni Professionali</h3>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specializzazione</Label>
                  <Select
                    value={formData.specialization}
                    onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                  >
                    <SelectTrigger data-testid="select-specialization">
                      <SelectValue placeholder="Seleziona la tua specializzazione (opzionale)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medico_base">Medico di Base</SelectItem>
                      <SelectItem value="cardiologo">Cardiologo</SelectItem>
                      <SelectItem value="dermatologo">Dermatologo</SelectItem>
                      <SelectItem value="pediatra">Pediatra</SelectItem>
                      <SelectItem value="ginecologo">Ginecologo</SelectItem>
                      <SelectItem value="ortopedico">Ortopedico</SelectItem>
                      <SelectItem value="neurologo">Neurologo</SelectItem>
                      <SelectItem value="psichiatra">Psichiatra</SelectItem>
                      <SelectItem value="oculista">Oculista</SelectItem>
                      <SelectItem value="otorinolaringoiatra">Otorinolaringoiatra</SelectItem>
                      <SelectItem value="radiologo">Radiologo</SelectItem>
                      <SelectItem value="oncologo">Oncologo</SelectItem>
                      <SelectItem value="endocrinologo">Endocrinologo</SelectItem>
                      <SelectItem value="altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Azienda/Organizzazione</Label>
                  <Input
                    id="company"
                    placeholder="Nome azienda (facoltativo)"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    autoComplete="organization"
                    data-testid="input-company"
                  />
                </div>
              </div>
            )}

            {/* Indirizzo */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Indirizzo</h3>
              <div className="space-y-2">
                <Label htmlFor="addressStreet">Via *</Label>
                <Input
                  id="addressStreet"
                  placeholder="Via Roma, 123"
                  value={formData.addressStreet}
                  onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                  autoComplete="street-address"
                  required
                  data-testid="input-addressStreet"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressCity">Città *</Label>
                  <Input
                    id="addressCity"
                    placeholder="Milano"
                    value={formData.addressCity}
                    onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                    autoComplete="address-level2"
                    required
                    data-testid="input-addressCity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressPostalCode">CAP *</Label>
                  <Input
                    id="addressPostalCode"
                    placeholder="20100"
                    value={formData.addressPostalCode}
                    onChange={(e) => setFormData({ ...formData, addressPostalCode: e.target.value })}
                    autoComplete="postal-code"
                    required
                    data-testid="input-addressPostalCode"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressProvince">Provincia *</Label>
                  <Input
                    id="addressProvince"
                    placeholder="MI"
                    value={formData.addressProvince}
                    onChange={(e) => setFormData({ ...formData, addressProvince: e.target.value })}
                    autoComplete="address-level1"
                    required
                    data-testid="input-addressProvince"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressCountry">Nazione *</Label>
                <Select
                  value={formData.addressCountry}
                  onValueChange={(value) => setFormData({ ...formData, addressCountry: value })}
                  required
                >
                  <SelectTrigger data-testid="select-addressCountry">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">Italia</SelectItem>
                    <SelectItem value="CH">Svizzera</SelectItem>
                    <SelectItem value="FR">Francia</SelectItem>
                    <SelectItem value="DE">Germania</SelectItem>
                    <SelectItem value="ES">Spagna</SelectItem>
                    <SelectItem value="UK">Regno Unito</SelectItem>
                    <SelectItem value="US">Stati Uniti</SelectItem>
                    <SelectItem value="OTHER">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preferenze Account */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Preferenze Account</h3>
              <div className="space-y-2">
                <Label htmlFor="language">Lingua preferita *</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                  required
                >
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="promoCode">Codice Promozionale (facoltativo)</Label>
                <Input
                  id="promoCode"
                  placeholder="Inserisci il codice promo aziendale"
                  value={formData.promoCode}
                  onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })}
                  data-testid="input-promo-code"
                />
                <p className="text-sm text-muted-foreground">
                  Se la tua azienda ha un accordo corporate, inserisci il codice promozionale per accedere ai benefici
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Crea una password sicura"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    autoComplete="new-password"
                    required
                    data-testid="input-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Conferma Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ripeti la password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    autoComplete="new-password"
                    required
                    data-testid="input-confirmPassword"
                  />
                </div>
              </div>
              
              {formData.password && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium mb-2">Requisiti password:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {passwordChecks.length ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={passwordChecks.length ? "text-green-600" : ""}>
                        Almeno 8 caratteri
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordChecks.uppercase ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={passwordChecks.uppercase ? "text-green-600" : ""}>
                        Una lettera maiuscola (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordChecks.lowercase ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={passwordChecks.lowercase ? "text-green-600" : ""}>
                        Una lettera minuscola (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordChecks.number ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={passwordChecks.number ? "text-green-600" : ""}>
                        Un numero (0-9)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordChecks.special ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={passwordChecks.special ? "text-green-600" : ""}>
                        Un carattere speciale (!@#$%...)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Consensi */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="newsletterConsent"
                  checked={formData.newsletterConsent}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, newsletterConsent: checked as boolean })
                  }
                  data-testid="checkbox-newsletter"
                />
                <Label htmlFor="newsletterConsent" className="text-sm font-normal leading-tight cursor-pointer">
                  Desidero ricevere aggiornamenti, offerte e contenuti esclusivi via email
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={registerMutation.isPending || !isPasswordValid}
              data-testid="button-register"
            >
              {registerMutation.isPending ? "Registrazione in corso..." : "Crea Account"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Hai già un account?{" "}
            <Link href="/login">
              <a className="text-primary font-medium hover:underline" data-testid="link-login">
                Accedi
              </a>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
