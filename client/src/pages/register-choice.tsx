import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Stethoscope, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const logoImage = "/images/ciry-main-logo.png";

export default function RegisterChoice() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Doctor registration form state
  const [doctorFirstName, setDoctorFirstName] = useState("");
  const [doctorLastName, setDoctorLastName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [doctorSpecialization, setDoctorSpecialization] = useState("");
  const [doctorCity, setDoctorCity] = useState("");
  const [doctorProvince, setDoctorProvince] = useState("");
  const [doctorPostalCode, setDoctorPostalCode] = useState("");

  const doctorRegisterMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/auth/register", "POST", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Richiesta inviata!",
        description: "Ti contatteremo presto per completare la registrazione.",
      });
      // Reset form
      setDoctorFirstName("");
      setDoctorLastName("");
      setDoctorEmail("");
      setDoctorPhone("");
      setDoctorSpecialization("");
      setDoctorCity("");
      setDoctorProvince("");
      setDoctorPostalCode("");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'invio della richiesta",
        variant: "destructive",
      });
    },
  });

  const handleDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Trim inputs
    const trimmedFirstName = doctorFirstName.trim();
    const trimmedLastName = doctorLastName.trim();
    const trimmedEmail = doctorEmail.trim().toLowerCase();
    const trimmedPhone = doctorPhone.trim();
    const trimmedSpecialization = doctorSpecialization.trim();
    const trimmedCity = doctorCity.trim();
    const trimmedProvince = doctorProvince.trim().toUpperCase();
    const trimmedPostalCode = doctorPostalCode.trim();

    // Validation
    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !trimmedPhone || 
        !trimmedSpecialization || !trimmedCity || !trimmedProvince || !trimmedPostalCode) {
      toast({
        title: "Campi obbligatori mancanti",
        description: "Compila tutti i campi per continuare",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Email non valida",
        description: "Inserisci un indirizzo email valido",
        variant: "destructive",
      });
      return;
    }

    doctorRegisterMutation.mutate({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: trimmedEmail,
      password: "temp_password_" + Math.random().toString(36), // Temporary password
      phone: trimmedPhone,
      specialization: trimmedSpecialization,
      addressCity: trimmedCity,
      addressProvince: trimmedProvince,
      addressPostalCode: trimmedPostalCode,
      isDoctor: true,
      dateOfBirth: "1980-01-01", // Dummy data for required field
      gender: "male", // Dummy data for required field
      addressStreet: "N/A", // Dummy data for required field
      addressCountry: "Italia",
      privacyAccepted: true,
      healthDataConsent: true,
      termsAccepted: true,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 py-8">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="CIRY Logo" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-3xl font-bold">
            Registrazione
          </CardTitle>
          <CardDescription className="text-base">
            Scegli il tipo di account che desideri creare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="patient" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8" data-testid="tabs-registration">
              <TabsTrigger 
                value="patient" 
                className="flex items-center gap-2"
                data-testid="tab-patient"
              >
                <User className="w-4 h-4" />
                Paziente
              </TabsTrigger>
              <TabsTrigger 
                value="doctor" 
                className="flex items-center gap-2"
                data-testid="tab-doctor"
              >
                <Stethoscope className="w-4 h-4" />
                Medico
              </TabsTrigger>
            </TabsList>

            {/* Patient Tab */}
            <TabsContent value="patient" className="space-y-6" data-testid="content-patient">
              <div className="text-center py-8 space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <User className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-3">Registrazione Paziente</h3>
                  <p className="text-muted-foreground mb-4">
                    La registrazione paziente è disponibile solo tramite invito del tuo medico.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 max-w-md mx-auto">
                  <div className="flex items-start gap-3 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200 text-left">
                      Chiedi al tuo medico di condividere il link di invito personale per registrarti alla piattaforma CIRY.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200 text-left">
                      Oppure inserisci manualmente il codice medico che hai ricevuto nella pagina di registrazione.
                    </p>
                  </div>
                </div>

                <Button 
                  size="lg"
                  onClick={() => setLocation("/register")}
                  data-testid="button-go-to-patient-register"
                >
                  Vai alla Registrazione Paziente
                </Button>
              </div>
            </TabsContent>

            {/* Doctor Tab */}
            <TabsContent value="doctor" className="space-y-6" data-testid="content-doctor">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                      <Stethoscope className="w-16 h-16 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Richiesta Registrazione Medico</h3>
                  <p className="text-muted-foreground">
                    Compila il modulo sottostante e ti contatteremo a breve
                  </p>
                </div>

                <form onSubmit={handleDoctorSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="doctorFirstName">Nome *</Label>
                      <Input
                        id="doctorFirstName"
                        value={doctorFirstName}
                        onChange={(e) => setDoctorFirstName(e.target.value)}
                        placeholder="Mario"
                        required
                        data-testid="input-doctor-firstName"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctorLastName">Cognome *</Label>
                      <Input
                        id="doctorLastName"
                        value={doctorLastName}
                        onChange={(e) => setDoctorLastName(e.target.value)}
                        placeholder="Rossi"
                        required
                        data-testid="input-doctor-lastName"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doctorEmail">Email *</Label>
                    <Input
                      id="doctorEmail"
                      type="email"
                      value={doctorEmail}
                      onChange={(e) => setDoctorEmail(e.target.value)}
                      placeholder="dott.rossi@email.com"
                      required
                      data-testid="input-doctor-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doctorPhone">Telefono *</Label>
                    <Input
                      id="doctorPhone"
                      type="tel"
                      value={doctorPhone}
                      onChange={(e) => setDoctorPhone(e.target.value)}
                      placeholder="+39 333 1234567"
                      required
                      data-testid="input-doctor-phone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doctorSpecialization">Specializzazione *</Label>
                    <Input
                      id="doctorSpecialization"
                      value={doctorSpecialization}
                      onChange={(e) => setDoctorSpecialization(e.target.value)}
                      placeholder="Cardiologia, Medicina Generale, etc."
                      required
                      data-testid="input-doctor-specialization"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="doctorCity">Città *</Label>
                      <Input
                        id="doctorCity"
                        value={doctorCity}
                        onChange={(e) => setDoctorCity(e.target.value)}
                        placeholder="Milano"
                        required
                        data-testid="input-doctor-city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctorProvince">Provincia *</Label>
                      <Input
                        id="doctorProvince"
                        value={doctorProvince}
                        onChange={(e) => setDoctorProvince(e.target.value)}
                        placeholder="MI"
                        required
                        maxLength={2}
                        data-testid="input-doctor-province"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctorPostalCode">CAP *</Label>
                      <Input
                        id="doctorPostalCode"
                        value={doctorPostalCode}
                        onChange={(e) => setDoctorPostalCode(e.target.value)}
                        placeholder="20100"
                        required
                        data-testid="input-doctor-postalCode"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={doctorRegisterMutation.isPending}
                    data-testid="button-doctor-submit"
                  >
                    {doctorRegisterMutation.isPending ? "Invio in corso..." : "Invia Richiesta"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Riceverai una email di conferma all'indirizzo fornito dopo l'approvazione del team CIRY
                  </p>
                </form>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 pt-6 border-t text-center">
            <Link href="/login">
              <Button variant="ghost" className="gap-2" data-testid="button-back-to-login">
                <ArrowLeft className="w-4 h-4" />
                Torna al Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
