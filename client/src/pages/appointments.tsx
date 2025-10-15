import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, User, Video, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Appointment = {
  id: string;
  doctorId: string;
  patientId: string | null;
  startTime: string;
  endTime: string;
  title: string;
  type: string;
  status: string;
  description: string | null;
  videoMeetingUrl: string | null;
  cancellationReason: string | null;
  doctor?: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  // Check if appointments feature is enabled
  const { data: featureStatus } = useQuery({
    queryKey: ['/api/settings/appointments-enabled'],
  });

  // Get user's appointments
  const { data: myAppointments = [], isLoading: isLoadingMy } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  // Get available appointments for selected date
  const { data: availableAppointments = [], isLoading: isLoadingAvailable } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', 'available', selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedDate) return [];
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      
      const response = await fetch(
        `/api/appointments?status=available&startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    },
    enabled: !!selectedDate,
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, notes }: { appointmentId: string; notes: string }) => {
      const response = await fetch(`/api/appointments/${appointmentId}/book`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to book appointment');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both patient appointments and available slots queries
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Prenotazione confermata",
        description: "La tua visita è stata prenotata con successo",
      });
      setIsBookingDialogOpen(false);
      setBookingNotes("");
      setSelectedAppointment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile prenotare la visita",
        variant: "destructive",
      });
    },
  });

  const handleBookAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsBookingDialogOpen(true);
  };

  const confirmBooking = () => {
    if (selectedAppointment) {
      bookAppointmentMutation.mutate({
        appointmentId: selectedAppointment.id,
        notes: bookingNotes,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      available: { label: "Disponibile", variant: "secondary" },
      booked: { label: "Prenotata", variant: "default" },
      confirmed: { label: "Confermata", variant: "default" },
      completed: { label: "Completata", variant: "outline" },
      cancelled: { label: "Annullata", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!(featureStatus as any)?.enabled) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Funzionalità non disponibile</h2>
            <p className="text-muted-foreground">
              Il sistema di prenotazione visite non è attualmente attivo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prenota Visita</h1>
          <p className="text-muted-foreground">Gestisci i tuoi appuntamenti medici</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar and Available Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Scegli Data e Orario
            </CardTitle>
            <CardDescription>Seleziona una data per vedere le visite disponibili</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={it}
              className="rounded-md border"
              data-testid="calendar-appointments"
            />

            {selectedDate && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">
                  Visite disponibili per {format(selectedDate, "dd MMMM yyyy", { locale: it })}
                </h3>
                {isLoadingAvailable ? (
                  <p className="text-sm text-muted-foreground">Caricamento...</p>
                ) : availableAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessuna visita disponibile in questa data</p>
                ) : (
                  <div className="space-y-2">
                    {availableAppointments.map((apt) => (
                      <Card key={apt.id} className="p-3" data-testid={`available-appointment-${apt.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">
                                {format(new Date(apt.startTime), "HH:mm")} - {format(new Date(apt.endTime), "HH:mm")}
                              </p>
                              <p className="text-xs text-muted-foreground">{apt.title}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleBookAppointment(apt)}
                            data-testid={`button-book-${apt.id}`}
                          >
                            Prenota
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              I Miei Appuntamenti
            </CardTitle>
            <CardDescription>Visite prenotate e confermate</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMy ? (
              <p className="text-sm text-muted-foreground">Caricamento...</p>
            ) : myAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun appuntamento prenotato</p>
            ) : (
              <div className="space-y-3">
                {myAppointments.map((apt) => (
                  <Card key={apt.id} className="p-4" data-testid={`my-appointment-${apt.id}`}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{apt.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(apt.startTime), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}
                          </p>
                        </div>
                        {getStatusBadge(apt.status)}
                      </div>
                      
                      {apt.doctor && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>Dr. {apt.doctor.firstName} {apt.doctor.lastName}</span>
                        </div>
                      )}

                      {apt.videoMeetingUrl && (
                        <Button size="sm" variant="outline" className="w-full" asChild>
                          <a href={apt.videoMeetingUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-video-${apt.id}`}>
                            <Video className="w-4 h-4 mr-2" />
                            Accedi alla Videocall
                          </a>
                        </Button>
                      )}

                      {apt.description && (
                        <p className="text-sm bg-muted p-2 rounded">{apt.description}</p>
                      )}

                      {apt.status === 'cancelled' && apt.cancellationReason && (
                        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                          <XCircle className="w-4 h-4 mt-0.5" />
                          <span>{apt.cancellationReason}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Confirmation Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent data-testid="dialog-booking-confirm">
          <DialogHeader>
            <DialogTitle>Conferma Prenotazione</DialogTitle>
            <DialogDescription>
              Stai per prenotare una visita. Aggiungi eventuali note per il medico.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">{selectedAppointment.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedAppointment.startTime), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Durata: {Math.round((new Date(selectedAppointment.endTime).getTime() - new Date(selectedAppointment.startTime).getTime()) / 60000)} minuti
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking-notes">Note per il medico (opzionale)</Label>
                <Textarea
                  id="booking-notes"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Es: Sintomi, domande specifiche, allergie..."
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
                  onClick={confirmBooking}
                  disabled={bookAppointmentMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-booking"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {bookAppointmentMutation.isPending ? "Prenotazione..." : "Conferma Prenotazione"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
