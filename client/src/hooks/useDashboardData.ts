import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

export interface PreventionIndexResponse {
  score: number;
  tier: 'low' | 'medium' | 'high';
  breakdown: {
    frequencyScore: number;
    depthScore: number;
    documentScore: number;
    alertScore: number;
    insightScore: number;
  };
}

export interface Appointment {
  id: number;
  doctorId: string;
  patientId: string;
  doctorName?: string;
  appointmentDate: string;
  startTime: string;
  duration: number;
  type: string;
  status: string;
  studioAddress?: string;
}

export interface Alert {
  id: string;
  patientId: string;
  urgency: string;
  status: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface DoctorStats {
  totalPatients: number;
  urgentAlerts: number;
  todayAppointments: number;
}

export interface TierMeta {
  label: string;
  suggestion: string;
  colorClass: string;
  bgClass: string;
}

export function getPreventionTierMeta(tier: 'low' | 'medium' | 'high'): TierMeta {
  const meta: Record<string, TierMeta> = {
    low: {
      label: "Basso",
      suggestion: "Inizia a interagire con CIRY! Carica i tuoi referti e fai una chat di prevenzione.",
      colorClass: "text-destructive",
      bgClass: "bg-destructive",
    },
    medium: {
      label: "Medio",
      suggestion: "Ottimo inizio! Continua così. Prova a caricare più referti per analisi complete.",
      colorClass: "text-amber-600",
      bgClass: "bg-amber-500",
    },
    high: {
      label: "Alto",
      suggestion: "Eccellente! Stai facendo un ottimo lavoro di prevenzione. Mantieni questa costanza!",
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-500",
    },
  };

  return meta[tier] || meta.low;
}

export function usePreventionIndex() {
  return useQuery<PreventionIndexResponse>({
    queryKey: ["/api/prevention/index"],
  });
}

export function useUpcomingAppointment() {
  return useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    select: (appointments) => {
      const now = new Date();
      const upcoming = appointments
        .filter(apt => {
          const aptDate = new Date(apt.appointmentDate + 'T' + apt.startTime);
          return aptDate > now && apt.status !== 'cancelled';
        })
        .sort((a, b) => {
          const dateA = new Date(a.appointmentDate + 'T' + a.startTime);
          const dateB = new Date(b.appointmentDate + 'T' + b.startTime);
          return dateA.getTime() - dateB.getTime();
        });
      
      return upcoming;
    },
  });
}

export function useDoctorStats() {
  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ["/api/doctor/patients"],
  });

  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/doctor/appointments"],
  });

  const urgentAlerts = alerts.filter(
    a => a.status === 'pending' && (a.urgency === 'EMERGENCY' || a.urgency === 'HIGH')
  ).length;

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = appointments.filter(
    apt => apt.appointmentDate === today && apt.status !== 'cancelled'
  ).length;

  return {
    totalPatients: patients.length,
    urgentAlerts,
    todayAppointments,
  };
}

export function useUrgentAlertsList() {
  return useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    select: (alerts) => {
      return alerts
        .filter(a => a.status === 'pending' && (a.urgency === 'EMERGENCY' || a.urgency === 'HIGH'))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
    },
  });
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: it });
}
