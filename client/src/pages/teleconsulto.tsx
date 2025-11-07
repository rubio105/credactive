import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Video, Mic, StopCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
};

type Appointment = {
  id: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  status: string;
  appointmentType?: string;
  videoMeetingUrl?: string | null;
  notes?: string;
  doctor?: Doctor;
};

export default function TeleconsultoPage() {
  const { toast } = useToast();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [bookingNotes, setBookingNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Get patient's appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/my-appointments'],
  });

  // Get patient's linked doctors
  const { data: linkedDoctors = [] } = useQuery<Doctor[]>({
    queryKey: ['/api/patient/doctors'],
  });

  // ProhMed default doctor option
  const prohmedDoctor: Doctor = {
    id: '7903dae2-2de6-48c0-8a9a-b7e9fca071ca',
    email: 'info@prohmed.ai',
    firstName: 'Team',
    lastName: 'Prohmed',
    specialization: 'Medicina Generale',
  };

  // Combine linked doctors + ProhMed
  const doctors = [...linkedDoctors, prohmedDoctor];

  // Cleanup on unmount or dialog close
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isBookingDialogOpen && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
    }
  }, [isBookingDialogOpen]);

  // Voice recording for notes
  const toggleVoiceRecording = () => {
    // Feature detection
    if (!(window as any).webkitSpeechRecognition) {
      toast({
        title: "Funzione non disponibile",
        description: "Il riconoscimento vocale non è supportato su questo browser",
        variant: "destructive",
      });
      return;
    }

    if (!isRecording) {
      // Start recording
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setBookingNotes(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        recognitionRef.current = null;
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, 30000);
    } else {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsRecording(false);
    }
  };

  // Book teleconsult mutation
  const bookTeleconsultMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/appointments/book-teleconsult', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/my-appointments'] });
      toast({
        title: "✅ Teleconsulto prenotato!",
        description: "Riceverai email di conferma con il link per la videochiamata",
      });
      setIsBookingDialogOpen(false);
      setSelectedDoctor("");
      setBookingDate("");
      setBookingTime("09:00");
      setBookingNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Errore prenotazione",
        description: error.message || "Impossibile prenotare il teleconsulto",
        variant: "destructive",
      });
    },
  });

  const handleBookTeleconsult = () => {
    if (!selectedDoctor || !bookingDate || !bookingTime) {
      toast({
        title: "Campi mancanti",
        description: "Seleziona medico, data e orario",
        variant: "destructive",
      });
      return;
    }

    const startTime = new Date(`${bookingDate}T${bookingTime}:00`);
    const endTime = new Date(startTime.getTime() + 30 * 60000); // +30 min

    bookTeleconsultMutation.mutate({
      doctorId: selectedDoctor,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes: bookingNotes,
      voiceNotes: isRecording ? bookingNotes : undefined,
      appointmentType: 'video',
    });
  };

  const upcomingAppointments = appointments.filter(a => 
    ['booked', 'confirmed', 'pending'].includes(a.status) && 
    new Date(a.startTime) > new Date()
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teleconsulto</h1>
          <p className="text-muted-foreground">Prenota una videochiamata con il tuo medico</p>
        </div>
        <Button onClick={() => setIsBookingDialogOpen(true)} data-testid="button-book-teleconsult">
          <Video className="w-4 h-4 mr-2" />
          Prenota Teleconsulto
        </Button>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Prossimi Appuntamenti</CardTitle>
          <CardDescription>
            I tuoi teleconsulti programmati
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Caricamento...</p>
          ) : upcomingAppointments.length === 0 ? (
            <p className="text-muted-foreground">Nessun appuntamento programmato</p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <Card key={apt.id} data-testid={`appointment-${apt.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <p className="font-medium">
                            {format(new Date(apt.startTime), "EEEE dd MMMM yyyy", { locale: it })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(apt.startTime), "HH:mm")} - {format(new Date(apt.endTime), "HH:mm")}
                          </p>
                        </div>
                        {apt.doctor && (
                          <p className="text-sm">
                            Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                            {apt.doctor.specialization && ` - ${apt.doctor.specialization}`}
                          </p>
                        )}
                        {apt.notes && (
                          <p className="text-sm text-muted-foreground">{apt.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                          {apt.status === 'confirmed' ? 'Confermato' : 'In attesa'}
                        </Badge>
                        {apt.videoMeetingUrl && apt.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            asChild
                            data-testid={`button-join-video-${apt.id}`}
                          >
                            <a href={apt.videoMeetingUrl} target="_blank" rel="noopener noreferrer">
                              <Video className="w-4 h-4 mr-2" />
                              Entra in Chiamata
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-book-teleconsult">
          <DialogHeader>
            <DialogTitle>Prenota Teleconsulto</DialogTitle>
            <DialogDescription>
              Scegli medico, data e orario per la tua videochiamata
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctor">Medico</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger data-testid="select-doctor">
                  <SelectValue placeholder="Seleziona medico" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map(doctor => {
                    const isProhmed = doctor.id === prohmedDoctor.id;
                    return (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div className="flex items-center gap-2">
                          <span>
                            Dr. {doctor.firstName} {doctor.lastName}
                            {doctor.specialization && ` - ${doctor.specialization}`}
                          </span>
                          {!isProhmed && (
                            <Badge variant="outline" className="text-xs">
                              Collegato
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  data-testid="input-booking-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Orario</Label>
                <Input
                  id="time"
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  data-testid="input-booking-time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="notes">Note (opzionale)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleVoiceRecording}
                  data-testid="button-voice-input"
                >
                  {isRecording ? (
                    <>
                      <StopCircle className="w-4 h-4 mr-2 text-red-500 animate-pulse" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Voce
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="notes"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Descrivi brevemente il motivo della visita..."
                rows={4}
                data-testid="textarea-booking-notes"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsBookingDialogOpen(false)}
                className="flex-1"
                data-testid="button-cancel-booking"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleBookTeleconsult}
                disabled={bookTeleconsultMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-booking"
              >
                {bookTeleconsultMutation.isPending ? "Prenotazione..." : "Prenota"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
