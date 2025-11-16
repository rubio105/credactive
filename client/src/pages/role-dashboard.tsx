import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import PatientDashboard from "@/pages/dashboard/PatientDashboard";
import DoctorDashboard from "@/pages/dashboard/DoctorDashboard";

export default function RoleDashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const isAdmin = (user as any)?.isAdmin;
  const isDoctor = (user as any)?.isDoctor;

  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      setLocation("/admin");
    }
  }, [isLoading, user, isAdmin, setLocation]);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (isAdmin) {
    return null;
  }

  if (isDoctor) {
    return <DoctorDashboard />;
  }

  return <PatientDashboard />;
}
