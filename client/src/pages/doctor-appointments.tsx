import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Video, CheckCircle, XCircle, Plus, Trash2, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/BackButton";

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
  meetingUrl: string | null;
  cancellationReason: string | null;
  patient?: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

type DoctorAvailability = {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  slotDuration: number; // minutes: 30 or 60
  appointmentType: string; // video, in_person, both
  studioAddress: string | null; // Physical address for in-person appointments
  isActive: boolean;
  createdAt: string;
};

export default function DoctorAppointmentsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<DoctorAvailability | null>(null);
  
  // Form state for creating appointment
  const [newAppointment, setNewAppointment] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "10:00",
    title: "Visita generale",
    type: "consultation",
  });

  // Form state for creating availability slot
  const [newAvailability, setNewAvailability] = useState({
    dayOfWeek: 1, // Monday
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    appointmentType: "video",
    studioAddress: "",
  });

  // Get all appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/appointments', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Slot creato",
        description: "Lo slot per la visita è stato creato con successo",
      });
      setIsCreateDialogOpen(false);
      setNewAppointment({
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "09:00",
        endTime: "10:00",
        title: "Visita generale",
        type: "consultation",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare lo slot",
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      return await apiRequest(`/api/appointments/${id}/status`, 'PUT', { status, reason });
    },
    onSuccess: () => {
      // Invalidate all appointment queries to refresh all views
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Stato aggiornato",
        description: "Lo stato dell'appuntamento è stato aggiornato",
      });
      setIsStatusDialogOpen(false);
      setSelectedAppointment(null);
      setCancellationReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare lo stato",
        variant: "destructive",
      });
    },
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/appointments/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Slot eliminato",
        description: "Lo slot è stato eliminato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare lo slot",
        variant: "destructive",
      });
    },
  });

  // Get doctor availability slots
  const { data: availabilitySlots = [] } = useQuery<DoctorAvailability[]>({
    queryKey: ['/api/doctor/availability'],
  });

  // Create availability mutation
  const createAvailabilityMutation = useMutation({
    mutationFn: async (data: typeof newAvailability) => {
      const response = await apiRequest('/api/doctor/availability', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/availability'] });
      toast({
        title: "Disponibilità creata",
        description: "La disponibilità ricorrente è stata aggiunta con successo",
      });
      setIsAvailabilityDialogOpen(false);
      setEditingAvailability(null);
      setNewAvailability({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 30,
        appointmentType: "video",
        studioAddress: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare la disponibilità",
        variant: "destructive",
      });
    },
  });

  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof newAvailability }) => {
      const response = await apiRequest(`/api/doctor/availability/${id}`, 'PUT', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/availability'] });
      toast({
        title: "Disponibilità aggiornata",
        description: "La disponibilità ricorrente è stata modificata con successo",
      });
      setIsAvailabilityDialogOpen(false);
      setEditingAvailability(null);
      setNewAvailability({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 30,
        appointmentType: "video",
        studioAddress: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare la disponibilità",
        variant: "destructive",
      });
    },
  });

  // Delete availability mutation
  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/doctor/availability/${id}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/availability'] });
      toast({
        title: "Disponibilità eliminata",
        description: "La disponibilità ricorrente è stata rimossa",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare la disponibilità",
        variant: "destructive",
      });
    },
  });

  // Pre-fill form when editing availability
  useEffect(() => {
    if (editingAvailability) {
      setNewAvailability({
        dayOfWeek: editingAvailability.dayOfWeek,
        startTime: editingAvailability.startTime,
        endTime: editingAvailability.endTime,
        slotDuration: editingAvailability.slotDuration,
        appointmentType: editingAvailability.appointmentType,
        studioAddress: editingAvailability.studioAddress || "",
      });
      setIsAvailabilityDialogOpen(true);
    }
  }, [editingAvailability]);

  const handleCreateAppointment = () => {
    const startDateTime = new Date(`${newAppointment.date}T${newAppointment.startTime}`);
    const endDateTime = new Date(`${newAppointment.date}T${newAppointment.endTime}`);

    createAppointmentMutation.mutate({
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      title: newAppointment.title,
      type: newAppointment.type,
    });
  };

  const handleSaveAvailability = () => {
    // Validate studioAddress is required for in-person appointments
    if ((newAvailability.appointmentType === 'in_person' || newAvailability.appointmentType === 'both') && 
        (!newAvailability.studioAddress || newAvailability.studioAddress.trim() === '')) {
      toast({
        title: "Campo obbligatorio",
        description: "L'indirizzo dello studio è obbligatorio per appuntamenti in presenza",
        variant: "destructive",
      });
      return;
    }

    if (editingAvailability) {
      // Update existing
      updateAvailabilityMutation.mutate({
        id: editingAvailability.id,
        data: newAvailability,
      });
    } else {
      // Create new
      createAvailabilityMutation.mutate(newAvailability);
    }
  };

  const handleStatusUpdate = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusUpdate = (newStatus: string) => {
    if (selectedAppointment) {
      updateStatusMutation.mutate({
        id: selectedAppointment.id,
        status: newStatus,
        reason: newStatus === 'cancelled' ? cancellationReason : undefined,
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

  const availableSlots = appointments.filter(a => a.status === 'available');
  const bookedAppointments = appointments.filter(a => a.status === 'booked' || a.status === 'confirmed');
  const completedAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton
            label="Indietro"
            variant="outline"
            testId="button-back"
          />
          <div>
            <h1 className="text-3xl font-bold">Gestione Appuntamenti</h1>
            <p className="text-muted-foreground">Crea slot singoli o definisci disponibilità ricorrenti</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-slot">
          <Plus className="w-4 h-4 mr-2" />
          Crea Slot
        </Button>
      </div>

      <Tabs defaultValue="booked" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="booked" data-testid="tab-booked">
            Prenotate ({bookedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="available" data-testid="tab-available">
            Disponibili ({availableSlots.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completate ({completedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="availability" data-testid="tab-availability">
            Disponibilità
          </TabsTrigger>
        </TabsList>

        <TabsContent value="booked" className="space-y-4 mt-6">
          {bookedAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Nessun appuntamento prenotato</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {bookedAppointments.map((apt) => (
                <Card key={apt.id} data-testid={`booked-appointment-${apt.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">{apt.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(apt.startTime), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}
                            </p>
                          </div>
                          {getStatusBadge(apt.status)}
                        </div>

                        {apt.patient && (
                          <div className="flex items-center gap-2 text-sm bg-muted p-3 rounded">
                            <User className="w-4 h-4" />
                            <div>
                              <p className="font-medium">{apt.patient.firstName} {apt.patient.lastName}</p>
                              <p className="text-muted-foreground">{apt.patient.email}</p>
                            </div>
                          </div>
                        )}

                        {apt.description && (
                          <div className="text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded">
                            <p className="font-medium mb-1">Note del paziente:</p>
                            <p className="text-muted-foreground">{apt.description}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {apt.meetingUrl && (apt.status === 'confirmed' || apt.status === 'booked') && (
                          <Button size="sm" variant="outline" asChild data-testid={`button-video-${apt.id}`}>
                            <a href={apt.meetingUrl} target="_blank" rel="noopener noreferrer">
                              <Video className="w-4 h-4 mr-2" />
                              Entra in Chiamata
                            </a>
                          </Button>
                        )}
                        {apt.status === 'booked' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => confirmStatusUpdate('confirmed')}
                              data-testid={`button-confirm-${apt.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Conferma
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleStatusUpdate(apt)}
                              data-testid={`button-cancel-${apt.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Rifiuta
                            </Button>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            onClick={() => confirmStatusUpdate('completed')}
                            data-testid={`button-complete-${apt.id}`}
                          >
                            Segna Completata
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4 mt-6">
          {availableSlots.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Nessuno slot disponibile</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {availableSlots.map((apt) => (
                <Card key={apt.id} data-testid={`available-slot-${apt.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{apt.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(apt.startTime), "dd MMMM yyyy 'alle' HH:mm", { locale: it })} 
                            {' - '}
                            {format(new Date(apt.endTime), "HH:mm")}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => deleteAppointmentMutation.mutate(apt.id)}
                        data-testid={`button-delete-${apt.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Nessun appuntamento completato</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedAppointments.map((apt) => (
                <Card key={apt.id} data-testid={`completed-appointment-${apt.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{apt.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(apt.startTime), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}
                          </p>
                          {apt.patient && (
                            <p className="text-sm text-muted-foreground">
                              {apt.patient.firstName} {apt.patient.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="availability" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestione Disponibilità Settimanale</CardTitle>
                <CardDescription>
                  Configura i tuoi orari ricorrenti per i teleconsulti. I pazienti vedranno questi slot disponibili.
                </CardDescription>
              </div>
              <Button onClick={() => setIsAvailabilityDialogOpen(true)} data-testid="button-add-availability">
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Disponibilità
              </Button>
            </CardHeader>
            <CardContent>
              {availabilitySlots.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessuna disponibilità configurata. Clicca su "Aggiungi Disponibilità" per iniziare.
                </p>
              ) : (
                <div className="space-y-4">
                  {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'].map((dayName, dayIndex) => {
                    const daySlots = availabilitySlots.filter(slot => slot.dayOfWeek === (dayIndex + 1) % 7);
                    if (daySlots.length === 0) return null;
                    
                    return (
                      <div key={dayIndex} className="space-y-2">
                        <h3 className="font-semibold text-sm">{dayName}</h3>
                        <div className="grid gap-2">
                          {daySlots.map(slot => (
                            <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`availability-slot-${slot.id}`}>
                              <div className="flex items-center gap-4">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{slot.startTime} - {slot.endTime}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Slot: {slot.slotDuration} min • Tipo: {slot.appointmentType === 'video' ? 'Video' : slot.appointmentType === 'in_person' ? 'In presenza' : 'Entrambi'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingAvailability(slot)}
                                  data-testid={`button-edit-availability-${slot.id}`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteAvailabilityMutation.mutate(slot.id)}
                                  disabled={deleteAvailabilityMutation.isPending}
                                  data-testid={`button-delete-availability-${slot.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Appointment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-slot">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Slot</DialogTitle>
            <DialogDescription>
              Crea uno slot disponibile per le prenotazioni dei pazienti
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  data-testid="input-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={newAppointment.type} onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value })}>
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Visita generale</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                    <SelectItem value="video">Videocall</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Ora inizio</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newAppointment.startTime}
                  onChange={(e) => setNewAppointment({ ...newAppointment, startTime: e.target.value })}
                  data-testid="input-start-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Ora fine</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newAppointment.endTime}
                  onChange={(e) => setNewAppointment({ ...newAppointment, endTime: e.target.value })}
                  data-testid="input-end-time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titolo</Label>
              <Input
                id="title"
                value={newAppointment.title}
                onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                placeholder="Es: Visita di controllo"
                data-testid="input-title"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                className="flex-1"
                data-testid="button-cancel-create"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleCreateAppointment}
                disabled={createAppointmentMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-create"
              >
                {createAppointmentMutation.isPending ? "Creazione..." : "Crea Slot"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent data-testid="dialog-cancel-appointment">
          <DialogHeader>
            <DialogTitle>Rifiuta Appuntamento</DialogTitle>
            <DialogDescription>
              Indica il motivo del rifiuto (verrà comunicato al paziente)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Es: Impegno imprevisto, cambio di orario disponibile..."
              rows={4}
              data-testid="textarea-cancel-reason"
            />

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsStatusDialogOpen(false)}
                className="flex-1"
                data-testid="button-cancel-dialog"
              >
                Annulla
              </Button>
              <Button 
                variant="destructive"
                onClick={() => confirmStatusUpdate('cancelled')}
                disabled={updateStatusMutation.isPending || !cancellationReason}
                className="flex-1"
                data-testid="button-confirm-cancel"
              >
                {updateStatusMutation.isPending ? "Rifiuto..." : "Conferma Rifiuto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Availability Dialog */}
      <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
        <DialogContent data-testid="dialog-add-availability">
          <DialogHeader>
            <DialogTitle>{editingAvailability ? "Modifica Disponibilità" : "Aggiungi Disponibilità Ricorrente"}</DialogTitle>
            <DialogDescription>
              {editingAvailability ? "Modifica lo slot ricorrente settimanale" : "Crea uno slot ricorrente settimanale per i teleconsulti"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Giorno della settimana</Label>
              <Select 
                value={String(newAvailability.dayOfWeek)} 
                onValueChange={(value) => setNewAvailability({ ...newAvailability, dayOfWeek: parseInt(value) })}
              >
                <SelectTrigger data-testid="select-day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Lunedì</SelectItem>
                  <SelectItem value="2">Martedì</SelectItem>
                  <SelectItem value="3">Mercoledì</SelectItem>
                  <SelectItem value="4">Giovedì</SelectItem>
                  <SelectItem value="5">Venerdì</SelectItem>
                  <SelectItem value="6">Sabato</SelectItem>
                  <SelectItem value="0">Domenica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availStartTime">Ora inizio</Label>
                <Input
                  id="availStartTime"
                  type="time"
                  value={newAvailability.startTime}
                  onChange={(e) => setNewAvailability({ ...newAvailability, startTime: e.target.value })}
                  data-testid="input-avail-start-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availEndTime">Ora fine</Label>
                <Input
                  id="availEndTime"
                  type="time"
                  value={newAvailability.endTime}
                  onChange={(e) => setNewAvailability({ ...newAvailability, endTime: e.target.value })}
                  data-testid="input-avail-end-time"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slotDuration">Durata slot</Label>
                <Select 
                  value={String(newAvailability.slotDuration)} 
                  onValueChange={(value) => setNewAvailability({ ...newAvailability, slotDuration: parseInt(value) })}
                >
                  <SelectTrigger data-testid="select-slot-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minuti</SelectItem>
                    <SelectItem value="60">60 minuti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentType">Tipo appuntamento</Label>
                <Select 
                  value={newAvailability.appointmentType} 
                  onValueChange={(value) => setNewAvailability({ ...newAvailability, appointmentType: value })}
                >
                  <SelectTrigger data-testid="select-appointment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Solo Video</SelectItem>
                    <SelectItem value="in_person">Solo In presenza</SelectItem>
                    <SelectItem value="both">Entrambi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(newAvailability.appointmentType === 'in_person' || newAvailability.appointmentType === 'both') && (
              <div className="space-y-2">
                <Label htmlFor="studioAddress">Indirizzo Studio *</Label>
                <Textarea
                  id="studioAddress"
                  placeholder="Via Roma 123, 20121 Milano (MI)"
                  value={newAvailability.studioAddress}
                  onChange={(e) => setNewAvailability({ ...newAvailability, studioAddress: e.target.value })}
                  className="min-h-[80px]"
                  data-testid="textarea-studio-address"
                />
                <p className="text-xs text-muted-foreground">
                  Questo indirizzo sarà comunicato ai pazienti via email quando prenotano un appuntamento in presenza.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsAvailabilityDialogOpen(false)}
                className="flex-1"
                data-testid="button-cancel-availability"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleSaveAvailability}
                disabled={createAvailabilityMutation.isPending || updateAvailabilityMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-availability"
              >
                {editingAvailability 
                  ? (updateAvailabilityMutation.isPending ? "Salvataggio..." : "Salva Modifiche")
                  : (createAvailabilityMutation.isPending ? "Creazione..." : "Crea Disponibilità")
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
