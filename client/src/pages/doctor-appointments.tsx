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
import { Calendar, Clock, User, Video, CheckCircle, XCircle, Plus, Trash2, Edit2, MapPin, FileText, Download, ClipboardList, AlertTriangle, CalendarDays, ArrowLeft, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCallRoom } from "@/components/VideoCallRoom";
import { CalendarView } from "@/components/CalendarView";
import type { Appointment } from "@shared/schema";

type AppointmentAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
};

type AppointmentWithRelations = Appointment & {
  attachments?: AppointmentAttachment[];
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
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<DoctorAvailability | null>(null);
  const [reportAppointmentId, setReportAppointmentId] = useState<string | null>(null);
  const [preventionReportAppointmentId, setPreventionReportAppointmentId] = useState<string | null>(null);
  const [preventionReportContent, setPreventionReportContent] = useState<string>("");
  const [preventionReportAttachments, setPreventionReportAttachments] = useState<File[]>([]);
  const [activeVideoCall, setActiveVideoCall] = useState<string | null>(null);
  
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
  const { data: appointments = [], isLoading } = useQuery<AppointmentWithRelations[]>({
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

  // Generate prevention report mutation
  const generatePreventionReportMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return await apiRequest(`/api/appointments/${appointmentId}/generate-prevention-report`, 'POST');
    },
    onSuccess: (data: any) => {
      setPreventionReportContent(data.reportText);
      toast({
        title: "Report generato",
        description: "Il report di prevenzione è stato generato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile generare il report",
        variant: "destructive",
      });
      setPreventionReportAppointmentId(null);
    },
  });

  // Get doctor availability slots
  const { data: availabilitySlots = [] } = useQuery<DoctorAvailability[]>({
    queryKey: ['/api/doctor/availability'],
  });

  // Get pre-visit report for selected appointment
  const { data: preVisitReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ['/api/appointments', reportAppointmentId, 'pre-visit-report'],
    queryFn: async () => {
      const response = await fetch(`/api/appointments/${reportAppointmentId}/pre-visit-report`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!reportAppointmentId,
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

  const confirmStatusUpdate = (newStatus: string, appointment?: Appointment) => {
    const apt = appointment || selectedAppointment;
    if (apt) {
      updateStatusMutation.mutate({
        id: apt.id,
        status: newStatus,
        reason: newStatus === 'cancelled' ? cancellationReason : undefined,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      available: { label: "Disponibile", variant: "secondary" },
      pending: { label: "In attesa", variant: "outline" },
      booked: { label: "Prenotata", variant: "default" },
      confirmed: { label: "Confermata", variant: "default" },
      completed: { label: "Completata", variant: "outline" },
      cancelled: { label: "Annullata", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const availableSlots = appointments.filter(a => a.status === 'available');
  const bookedAppointments = appointments.filter(a => a.status === 'pending' || a.status === 'booked' || a.status === 'confirmed');
  const completedAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  // If in active video call, show full-screen video component
  if (activeVideoCall) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setActiveVideoCall(null)} 
            data-testid="button-back-from-video"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Videochiamata in Corso</h1>
            <p className="text-muted-foreground">Appuntamento #{activeVideoCall.substring(0, 8)}</p>
          </div>
        </div>
        <VideoCallRoom 
          appointmentId={activeVideoCall}
          onLeave={() => setActiveVideoCall(null)}
          isDoctorView={true}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestione Appuntamenti</h1>
          <p className="text-muted-foreground">Crea slot singoli o definisci disponibilità ricorrenti</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-slot">
          <Plus className="w-4 h-4 mr-2" />
          Crea Slot
        </Button>
      </div>

      <Tabs defaultValue="booked" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="booked" data-testid="tab-booked">
            Prenotate ({bookedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="available" data-testid="tab-available">
            Disponibili ({availableSlots.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completate ({completedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            <CalendarDays className="w-4 h-4 mr-1" />
            Calendario
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
                            <p className="font-semibold">{apt.title || 'Visita'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(apt.startTime), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}
                            </p>
                          </div>
                          {getStatusBadge(apt.status || 'available')}
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

                        {apt.studioAddress && (
                          <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                            <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium mb-1 text-amber-900 dark:text-amber-100">Indirizzo Studio:</p>
                              <p className="text-amber-700 dark:text-amber-300">{apt.studioAddress}</p>
                            </div>
                          </div>
                        )}

                        {apt.attachments && apt.attachments.length > 0 && (
                          <div className="bg-secondary p-3 rounded">
                            <p className="font-medium mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Documenti allegati ({apt.attachments.length})
                            </p>
                            <div className="space-y-2">
                              {apt.attachments.map((attachment: AppointmentAttachment) => (
                                <a
                                  key={attachment.id}
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 bg-background hover:bg-muted rounded transition-colors"
                                  data-testid={`attachment-${attachment.id}`}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-sm truncate">{attachment.fileName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {(attachment.fileSize / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {apt.patient && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setReportAppointmentId(apt.id)}
                            data-testid={`button-pre-visit-report-${apt.id}`}
                          >
                            <ClipboardList className="w-4 h-4 mr-2" />
                            Report Pre-Visita
                          </Button>
                        )}
                        {(apt.status === 'confirmed' || apt.status === 'booked') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveVideoCall(apt.id)}
                            data-testid={`button-video-${apt.id}`}
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Entra in Chiamata
                          </Button>
                        )}
                        {(apt.status === 'pending' || apt.status === 'booked') && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => confirmStatusUpdate('confirmed', apt)}
                              disabled={updateStatusMutation.isPending}
                              data-testid={`button-confirm-${apt.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {updateStatusMutation.isPending ? 'Confermando...' : 'Conferma'}
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
                        {apt.status === 'completed' && apt.patient && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setPreventionReportAppointmentId(apt.id);
                                generatePreventionReportMutation.mutate(apt.id);
                              }}
                              disabled={generatePreventionReportMutation.isPending}
                              data-testid={`button-prevention-report-${apt.id}`}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              {generatePreventionReportMutation.isPending ? 'Generando...' : 'Report Prevenzione'}
                            </Button>

                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            onClick={() => confirmStatusUpdate('completed', apt)}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-complete-${apt.id}`}
                          >
                            {updateStatusMutation.isPending ? 'Completando...' : 'Segna Completata'}
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
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">{apt.title || 'Visita'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(apt.startTime), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}
                            </p>
                          </div>
                          {getStatusBadge(apt.status || 'available')}
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

                        {apt.attachments && apt.attachments.length > 0 && (
                          <div className="bg-secondary p-3 rounded">
                            <p className="font-medium mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Documenti allegati ({apt.attachments.length})
                            </p>
                            <div className="space-y-2">
                              {apt.attachments.map((attachment: AppointmentAttachment) => (
                                <a
                                  key={attachment.id}
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 bg-background hover:bg-muted rounded transition-colors"
                                  data-testid={`attachment-${attachment.id}`}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-sm truncate">{attachment.fileName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {(attachment.fileSize / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {apt.patient && apt.status === 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setPreventionReportAppointmentId(apt.id);
                                generatePreventionReportMutation.mutate(apt.id);
                              }}
                              disabled={generatePreventionReportMutation.isPending}
                              data-testid={`button-prevention-report-${apt.id}`}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              {generatePreventionReportMutation.isPending ? 'Generando...' : 'Report Prevenzione'}
                            </Button>

                          </>
                        )}
                      </div>
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
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {slot.slotDuration} min
                                    </Badge>
                                    {slot.appointmentType === 'video' && (
                                      <Badge variant="secondary" className="text-xs">
                                        🎥 Teleconsulto
                                      </Badge>
                                    )}
                                    {slot.appointmentType === 'in_person' && (
                                      <Badge variant="secondary" className="text-xs">
                                        🏥 In Presenza
                                      </Badge>
                                    )}
                                    {slot.appointmentType === 'both' && (
                                      <Badge variant="secondary" className="text-xs">
                                        🔄 Entrambi
                                      </Badge>
                                    )}
                                  </div>
                                  {slot.studioAddress && (
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {slot.studioAddress}
                                    </p>
                                  )}
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

        <TabsContent value="calendar" className="mt-6">
          <CalendarView
            appointments={appointments as any}
            onAppointmentClick={(apt) => {
              setSelectedAppointment(apt as AppointmentWithRelations);
              setIsStatusDialogOpen(true);
            }}
            isDoctor={true}
            isLoading={isLoading}
            emptyMessage="Nessun appuntamento trovato. Crea nuovi slot dalla sezione Disponibilità."
          />
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
        <DialogContent className="max-w-2xl" data-testid="dialog-add-availability">
          <DialogHeader>
            <DialogTitle>{editingAvailability ? "Modifica Disponibilità" : "Aggiungi Slot Ricorrente"}</DialogTitle>
            <DialogDescription>
              {editingAvailability 
                ? "Modifica lo slot ricorrente settimanale" 
                : "Configura un orario che si ripete ogni settimana. I pazienti potranno prenotare appuntamenti in questi slot."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* STEP 1: Giorno e Orario */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-sm">1. Quando sei disponibile?</h3>
              
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

              <div className="space-y-2">
                <Label htmlFor="slotDuration">Durata di ogni appuntamento</Label>
                <Select 
                  value={String(newAvailability.slotDuration)} 
                  onValueChange={(value) => setNewAvailability({ ...newAvailability, slotDuration: parseInt(value) })}
                >
                  <SelectTrigger data-testid="select-slot-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minuti</SelectItem>
                    <SelectItem value="60">60 minuti (1 ora)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Il sistema dividerà automaticamente il tuo orario in slot di questa durata
                </p>
              </div>
            </div>

            {/* STEP 2: Tipo Appuntamento */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-sm">2. Come vuoi ricevere i pazienti?</h3>
              
              <div className="space-y-2">
                <Label htmlFor="appointmentType">Modalità appuntamento</Label>
                <Select 
                  value={newAvailability.appointmentType} 
                  onValueChange={(value) => setNewAvailability({ ...newAvailability, appointmentType: value })}
                >
                  <SelectTrigger data-testid="select-appointment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">🎥 Solo Teleconsulto (Videocall)</SelectItem>
                    <SelectItem value="in_person">🏥 Solo In Presenza (Studio medico)</SelectItem>
                    <SelectItem value="both">🔄 Entrambi (Paziente sceglie)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newAvailability.appointmentType === 'video' && "I pazienti riceveranno un link per la videocall"}
                  {newAvailability.appointmentType === 'in_person' && "I pazienti verranno nel tuo studio medico"}
                  {newAvailability.appointmentType === 'both' && "Il paziente potrà scegliere se teleconsulto o visita in presenza"}
                </p>
              </div>

              {(newAvailability.appointmentType === 'in_person' || newAvailability.appointmentType === 'both') && (
                <div className="space-y-2 mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                  <Label htmlFor="studioAddress" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Indirizzo Studio Medico *
                  </Label>
                  <Textarea
                    id="studioAddress"
                    placeholder="Es: Via Roma 123, 20121 Milano (MI)"
                    value={newAvailability.studioAddress}
                    onChange={(e) => setNewAvailability({ ...newAvailability, studioAddress: e.target.value })}
                    className="min-h-[80px]"
                    data-testid="textarea-studio-address"
                  />
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    Questo indirizzo verrà inviato ai pazienti via email e WhatsApp quando confermano l'appuntamento.
                  </p>
                </div>
              )}
            </div>

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

      {/* Pre-Visit Report Dialog */}
      <Dialog open={!!reportAppointmentId} onOpenChange={() => setReportAppointmentId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="dialog-pre-visit-report">
          <DialogHeader>
            <DialogTitle>Report Pre-Visita Paziente</DialogTitle>
            <DialogDescription>
              Riassunto dei dati del paziente per prepararsi alla visita
            </DialogDescription>
          </DialogHeader>

          {isLoadingReport ? (
            <div className="py-12 text-center text-muted-foreground">
              Caricamento report...
            </div>
          ) : preVisitReport?.reportData ? (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informazioni Paziente
                </h3>
                <div className="grid grid-cols-2 gap-3 p-4 bg-secondary rounded-lg text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-medium">{preVisitReport.reportData.patient.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{preVisitReport.reportData.patient.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Età</p>
                    <p className="font-medium">{preVisitReport.reportData.patient.age ? `${preVisitReport.reportData.patient.age} anni` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Genere</p>
                    <p className="font-medium">{preVisitReport.reportData.patient.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peso</p>
                    <p className="font-medium">{preVisitReport.reportData.patient.weightKg ? `${preVisitReport.reportData.patient.weightKg} kg` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Altezza</p>
                    <p className="font-medium">{preVisitReport.reportData.patient.heightCm ? `${preVisitReport.reportData.patient.heightCm} cm` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fumo</p>
                    <p className="font-medium">{preVisitReport.reportData.patient.smokingStatus || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Attività Fisica</p>
                    <p className="font-medium">{preVisitReport.reportData.patient.physicalActivity || 'N/A'}</p>
                  </div>
                </div>
                {preVisitReport.reportData.patient.userBio && (
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Note Anamnestiche</p>
                    <p className="text-sm">{preVisitReport.reportData.patient.userBio}</p>
                  </div>
                )}
              </div>

              {/* Recent Medical Reports */}
              {preVisitReport.reportData.recentReports.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Ultimi Referti Caricati ({preVisitReport.reportData.recentReports.length})
                  </h3>
                  <div className="space-y-2">
                    {preVisitReport.reportData.recentReports.map((report: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg space-y-1">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-sm">{report.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(report.date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        {report.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {report.summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relevant Conversations */}
              {preVisitReport.reportData.relevantConversations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Conversazioni Rilevanti ({preVisitReport.reportData.relevantConversations.length})
                  </h3>
                  <div className="space-y-2">
                    {preVisitReport.reportData.relevantConversations.map((conv: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{conv.title || 'Conversazione senza titolo'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={
                                conv.urgencyLevel === 'emergency' ? 'bg-red-600' :
                                conv.urgencyLevel === 'high' ? 'bg-orange-600' :
                                'bg-yellow-600'
                              }>
                                {conv.urgencyLevel}
                              </Badge>
                              {conv.alertCount > 0 && (
                                <Badge variant="outline">
                                  {conv.alertCount} alert
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(conv.date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointment Attachments */}
              {preVisitReport.reportData.appointmentAttachments.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documenti Allegati All'Appuntamento ({preVisitReport.reportData.appointmentAttachments.length})
                  </h3>
                  <div className="space-y-2">
                    {preVisitReport.reportData.appointmentAttachments.map((att: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{att.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(att.fileSize / 1024).toFixed(1)} KB • Caricato il {format(new Date(att.uploadedAt), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              Nessun dato disponibile per questo appuntamento
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button onClick={() => setReportAppointmentId(null)} data-testid="button-close-report">
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prevention Report Dialog */}
      <Dialog open={!!preventionReportAppointmentId} onOpenChange={() => {
        setPreventionReportAppointmentId(null);
        setPreventionReportContent("");
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-prevention-report">
          <DialogHeader>
            <DialogTitle>Report di Prevenzione Post-Visita</DialogTitle>
            <DialogDescription>
              Raccomandazioni preventive personalizzate generate dall'AI
            </DialogDescription>
          </DialogHeader>

          {generatePreventionReportMutation.isPending ? (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground">Generazione report in corso...</p>
              </div>
            </div>
          ) : preventionReportContent ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="prevention-report">Modifica il Referto</Label>
                <Textarea
                  id="prevention-report"
                  value={preventionReportContent}
                  onChange={(e) => setPreventionReportContent(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  data-testid="textarea-prevention-report"
                />
              </div>
              <div>
                <Label htmlFor="attachments">Allega Documenti (opzionale)</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
                    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
                    
                    const validFiles = files.filter(file => {
                      if (file.size > MAX_SIZE) {
                        toast({
                          title: "File troppo grande",
                          description: `${file.name} supera i 10MB`,
                          variant: "destructive",
                        });
                        return false;
                      }
                      if (!ALLOWED_TYPES.includes(file.type)) {
                        toast({
                          title: "Tipo file non valido",
                          description: `${file.name} deve essere PDF o immagine`,
                          variant: "destructive",
                        });
                        return false;
                      }
                      return true;
                    });
                    
                    setPreventionReportAttachments(validFiles);
                  }}
                  data-testid="input-attachments"
                />
                {preventionReportAttachments.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {preventionReportAttachments.length} file selezionati
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              Nessun report disponibile
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setPreventionReportAppointmentId(null);
              setPreventionReportContent("");
              setPreventionReportAttachments([]);
            }} data-testid="button-close-prevention-report">
              Annulla
            </Button>
            {preventionReportContent && (
              <Button onClick={async () => {
                try {
                  const apptId = preventionReportAppointmentId!;
                  
                  // Upload attachments first
                  for (const file of preventionReportAttachments) {
                    const formData = new FormData();
                    formData.append('attachment', file);
                    formData.append('description', 'Allegato al referto prevenzione');
                    
                    await fetch(`/api/appointments/${apptId}/attachments`, {
                      method: 'POST',
                      body: formData,
                      credentials: 'include',
                    });
                  }
                  
                  // Get patient ID from appointment
                  const appointment = appointments.find(a => a.id === apptId);
                  if (!appointment?.patientId) {
                    throw new Error('Paziente non trovato');
                  }
                  
                  // Save report as doctor note with correct category
                  await apiRequest(`/api/doctor/notes`, 'POST', {
                    patientId: appointment.patientId,
                    noteText: preventionReportContent,
                    noteTitle: `Report Prevenzione - ${format(new Date(), 'dd/MM/yyyy')}`,
                    category: 'Report Prevenzione',
                    isReport: true,
                  });
                  
                  toast({
                    title: "✅ Referto salvato",
                    description: `Referto salvato con ${preventionReportAttachments.length} allegati`,
                  });
                  queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
                  setPreventionReportAppointmentId(null);
                  setPreventionReportContent("");
                  setPreventionReportAttachments([]);
                } catch (error: any) {
                  toast({
                    title: "Errore",
                    description: error.message || "Impossibile salvare il referto",
                    variant: "destructive",
                  });
                }
              }} data-testid="button-save-prevention-report">
                Salva e Condividi
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
