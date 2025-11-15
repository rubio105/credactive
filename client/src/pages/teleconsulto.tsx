import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Video, Mic, StopCircle, ArrowLeft, FileText, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { VideoPermissionAlert } from "@/components/VideoPermissionAlert";

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
  studioAddress?: string | null;
  meetingUrl?: string | null;
  notes?: string;
  doctor?: Doctor;
};

type AvailableSlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  date: string; // Full date: YYYY-MM-DD
  doctorId: string;
  appointmentType?: string;
  studioAddress?: string | null;
};

export default function TeleconsultoPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get patient's appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  // Get patient's linked doctors
  const { data: linkedDoctors = [] } = useQuery<Doctor[]>({
    queryKey: ['/api/patient/doctors'],
  });

  // ProhMed default doctor option
  const prohmedDoctor: Doctor = {
    id: '747509dc-dd2a-40e6-91d9-23c7b4f85972',
    firstName: 'Team',
    lastName: 'Prohmed',
    specialization: 'Medicina Generale',
  };

  // Combine linked doctors + ProhMed
  const doctors = [...linkedDoctors, prohmedDoctor];

  // Get available slots for selected doctor (for next 14 days)
  const { data: availableSlots = [], isLoading: isSlotsLoading } = useQuery<AvailableSlot[]>({
    queryKey: ['/api/appointments/available-slots', selectedDoctor],
    enabled: !!selectedDoctor,
  });

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

  // Reset selected slot when doctor changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDoctor]);

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
      const response = await apiRequest('/api/appointments/book-teleconsult', 'POST', data);
      return response.json();
    },
    onSuccess: async (appointmentData) => {
      let uploadSuccess = true;
      let uploadError = '';
      
      // Upload files if any were selected
      if (selectedFiles.length > 0 && appointmentData.appointment?.id) {
        try {
          const formData = new FormData();
          selectedFiles.forEach(file => {
            formData.append('files', file);
          });
          formData.append('appointmentId', appointmentData.appointment.id);
          
          const uploadResponse = await fetch('/api/appointments/upload-attachments', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          
          if (!uploadResponse.ok) {
            uploadSuccess = false;
            const errorData = await uploadResponse.json().catch(() => ({ message: 'Upload failed' }));
            uploadError = errorData.message || 'Errore caricamento documenti';
          }
        } catch (error) {
          console.error('Error uploading attachments:', error);
          uploadSuccess = false;
          uploadError = 'Errore di rete durante caricamento documenti';
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      if (uploadSuccess) {
        toast({
          title: "✅ Teleconsulto prenotato!",
          description: selectedFiles.length > 0 
            ? `Appuntamento confermato con ${selectedFiles.length} documento/i allegato/i`
            : "Riceverai email di conferma con il link per la videochiamata",
        });
      } else {
        toast({
          title: "⚠️ Teleconsulto prenotato con avviso",
          description: `Appuntamento creato ma ${uploadError}. Puoi allegare documenti successivamente.`,
          variant: "destructive",
        });
      }
      
      setIsBookingDialogOpen(false);
      setSelectedDoctor("");
      setSelectedSlot(null);
      setBookingNotes("");
      setSelectedFiles([]);
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
    if (!selectedDoctor || !selectedSlot) {
      toast({
        title: "Campi mancanti",
        description: "Seleziona medico e slot orario",
        variant: "destructive",
      });
      return;
    }

    // selectedSlot.date is now a full ISO datetime (e.g., "2025-11-15T09:00:00.000Z")
    const startTime = new Date(selectedSlot.date);
    
    // Calculate slot duration in minutes and add to startTime (timezone-safe)
    const [startHours, startMinutes] = selectedSlot.startTime.split(':');
    const [endHours, endMinutes] = selectedSlot.endTime.split(':');
    const startMinutesTotal = parseInt(startHours) * 60 + parseInt(startMinutes);
    const endMinutesTotal = parseInt(endHours) * 60 + parseInt(endMinutes);
    const durationMinutes = endMinutesTotal - startMinutesTotal;
    
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    bookTeleconsultMutation.mutate({
      doctorId: selectedDoctor,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes: bookingNotes,
      voiceNotes: isRecording ? bookingNotes : undefined,
      appointmentType: selectedSlot.appointmentType || 'video',
      studioAddress: selectedSlot.studioAddress || undefined,
    });
  };

  const upcomingAppointments = appointments.filter(a => {
    if (!['booked', 'confirmed', 'pending'].includes(a.status)) return false;
    if (!a.startTime) return false;
    const startDate = new Date(a.startTime);
    return !isNaN(startDate.getTime()) && startDate > new Date();
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/prevention')} 
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Teleconsulto</h1>
            <p className="text-muted-foreground">Prenota una videochiamata con il tuo medico</p>
          </div>
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
              {upcomingAppointments.map((apt) => {
                const startDate = apt.startTime ? new Date(apt.startTime) : null;
                const endDate = apt.endTime ? new Date(apt.endTime) : null;
                const isValidStart = startDate && !isNaN(startDate.getTime());
                const isValidEnd = endDate && !isNaN(endDate.getTime());
                
                return (
                <Card key={apt.id} data-testid={`appointment-${apt.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        {isValidStart && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium">
                              {format(startDate, "EEEE dd MMMM yyyy", { locale: it })}
                            </p>
                          </div>
                        )}
                        {isValidStart && isValidEnd && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                            </p>
                          </div>
                        )}
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
                        {apt.meetingUrl && apt.status === 'confirmed' && (
                          <VideoPermissionAlert
                            meetingUrl={apt.meetingUrl}
                            buttonText="Entra in Chiamata"
                            buttonSize="sm"
                            buttonTestId={`button-join-video-${apt.id}`}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0" data-testid="dialog-book-teleconsult">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Prenota Teleconsulto</DialogTitle>
            <DialogDescription>
              Scegli medico, data e orario per la tua videochiamata
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 overflow-y-auto flex-1">
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

            {/* Available Slots Section */}
            {selectedDoctor && (
              <div className="space-y-2">
                <Label>Slot Disponibili</Label>
                {isSlotsLoading ? (
                  <p className="text-sm text-muted-foreground">Caricamento slot disponibili...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessuno slot disponibile per questo medico nei prossimi giorni.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {availableSlots.map((slot, index) => {
                      const slotDate = slot.date ? new Date(slot.date) : null;
                      const isValidDate = slotDate && !isNaN(slotDate.getTime());
                      
                      return (
                      <Button
                        key={index}
                        variant={selectedSlot?.date === slot.date && selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedSlot(slot)}
                        data-testid={`button-slot-${index}`}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {isValidDate ? format(slotDate, "EEEE dd MMMM", { locale: it }) : 'Data non disponibile'} - {slot.startTime} / {slot.endTime}
                      </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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

            {/* File Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Allegati (opzionale)</Label>
              <p className="text-sm text-muted-foreground">
                Carica referti, esami o documenti medici (PDF, immagini)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files);
                    setSelectedFiles(prev => [...prev, ...newFiles]);
                  }
                }}
                data-testid="input-file-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                data-testid="button-upload-files"
              >
                <Upload className="w-4 h-4 mr-2" />
                Seleziona File
              </Button>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-secondary rounded-lg"
                      data-testid={`file-item-${index}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                        data-testid={`button-remove-file-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky buttons at bottom */}
          <div className="border-t bg-background px-6 py-4 flex gap-3">
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
