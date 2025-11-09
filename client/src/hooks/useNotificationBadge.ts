import { useQuery } from "@tanstack/react-query";

interface Notification {
  id: string;
  isRead: boolean;
}

interface Alert {
  id: string;
  status: string;
  urgency: string;
}

export function useUnreadNotifications() {
  const { data: notifications = [], isFetching, error } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 60000,
  });

  const count = notifications.filter(n => !n.isRead).length;

  return {
    count,
    isFetching,
    error,
  };
}

export function useUrgentAlerts() {
  const { data: alerts = [], isFetching, error } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 60000,
  });

  const count = alerts.filter(
    a => a.status === 'pending' && (a.urgency === 'EMERGENCY' || a.urgency === 'HIGH')
  ).length;

  return {
    count,
    isFetching,
    error,
  };
}
