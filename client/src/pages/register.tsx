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
import logoImage from "@assets/image_1759605874808.png";
import { Link } from "wouter";
import { CheckCircle2, XCircle } from "lucide-react";

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
    profession: "",
    education: "",
    company: "",
    addressStreet: "",
    addressCity: "",
    addressPostalCode: "",
    addressProvince: "",
    addressCountry: "",
    language: "it",
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
    onSuccess: () => {
      toast({
        title: "Registrazione completata",
        description: "Benvenuto su CREDACTIVE!",
      });
      window.location.href = "/";
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

    if (!formData.gender || !formData.profession || !formData.education || !formData.addressCountry) {
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
      profession: formData.profession,
      education: formData.education,
      company: formData.company || null,
      addressStreet: formData.addressStreet,
      addressCity: formData.addressCity,
      addressPostalCode: formData.addressPostalCode,
      addressProvince: formData.addressProvince,
      addressCountry: formData.addressCountry,
      language: formData.language,
      newsletterConsent: formData.newsletterConsent,
    };

    registerMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 py-8">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="CREDACTIVE" className="h-12" />
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
                    data-testid="input-phone"
                  />
                </div>
              </div>
            </div>

            {/* Dati Professionali */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Dati Professionali</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profession">Professione *</Label>
                  <Select
                    value={formData.profession}
                    onValueChange={(value) => setFormData({ ...formData, profession: value })}
                    required
                  >
                    <SelectTrigger data-testid="select-profession">
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it_security">IT Security Specialist</SelectItem>
                      <SelectItem value="cybersecurity">Cybersecurity Analyst</SelectItem>
                      <SelectItem value="compliance">Compliance Officer</SelectItem>
                      <SelectItem value="risk_manager">Risk Manager</SelectItem>
                      <SelectItem value="it_manager">IT Manager</SelectItem>
                      <SelectItem value="consultant">Consulente</SelectItem>
                      <SelectItem value="developer">Sviluppatore</SelectItem>
                      <SelectItem value="system_admin">System Administrator</SelectItem>
                      <SelectItem value="data_protection">Data Protection Officer</SelectItem>
                      <SelectItem value="auditor">Auditor</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="student">Studente</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education">Livello di Istruzione *</Label>
                  <Select
                    value={formData.education}
                    onValueChange={(value) => setFormData({ ...formData, education: value })}
                    required
                  >
                    <SelectTrigger data-testid="select-education">
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">Diploma</SelectItem>
                      <SelectItem value="bachelor">Laurea Triennale</SelectItem>
                      <SelectItem value="master">Laurea Magistrale</SelectItem>
                      <SelectItem value="phd">Dottorato</SelectItem>
                      <SelectItem value="certification">Certificazioni Professionali</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Azienda/Organizzazione</Label>
                <Input
                  id="company"
                  placeholder="Nome azienda (facoltativo)"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  data-testid="input-company"
                />
              </div>
            </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Crea una password sicura"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
