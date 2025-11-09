import { useAuth } from "@/hooks/useAuth";
import PatientDashboard from "@/pages/dashboard/PatientDashboard";
import DoctorDashboard from "@/pages/dashboard/DoctorDashboard";

export default function RoleDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }
  
  const isDoctor = (user as any)?.isDoctor;
  const isAdmin = (user as any)?.isAdmin;

  if (isDoctor || isAdmin) {
    return <DoctorDashboard />;
  }

  return <PatientDashboard />;
}
