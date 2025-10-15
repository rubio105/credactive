import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Video, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Appointment = {
  id: string;
  doctorId: string;
  patientId: string | null;
  startTime: string;
  endTime: string;
  title: string;
  type: string;
  status: string;
  notes: string | null;
  videoMeetingUrl: string | null;
  cancellationReason: string | null;
  patient?: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function DoctorAppointmentsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  
  // Form state for creating appointment
  const [newAppointment, setNewAppointment] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "10:00",
    title: "Visita generale",
    type: "consultation",
  });

  // Get all appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to create appointment');
      return response.json();
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
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
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
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete appointment');
      return response.json();
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
        <div>
          <h1 className="text-3xl font-bold">Gestione Appuntamenti</h1>
          <p className="text-muted-foreground">Crea slot e gestisci le visite con i pazienti</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-slot">
          <Plus className="w-4 h-4 mr-2" />
          Crea Slot
        </Button>
      </div>

      <Tabs defaultValue="booked" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="booked" data-testid="tab-booked">
            Prenotate ({bookedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="available" data-testid="tab-available">
            Disponibili ({availableSlots.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completate ({completedAppointments.length})
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

                        {apt.notes && (
                          <div className="text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded">
                            <p className="font-medium mb-1">Note del paziente:</p>
                            <p className="text-muted-foreground">{apt.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
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
    </div>
  );
}
