import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireNonAiOnly?: boolean; // If true, blocks AI-only users from this route
  requireDoctor?: boolean; // If true, blocks non-doctor users from this route
}

export default function ProtectedRoute({ children, requireNonAiOnly = false, requireDoctor = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return null;
  }

  // If not authenticated, redirect to login with return URL
  if (!user) {
    const redirectUrl = encodeURIComponent(location);
    return <Redirect to={`/login?redirect=${redirectUrl}`} />;
  }

  // If route requires doctor access and user is not a doctor, redirect to dashboard
  if (requireDoctor && !(user as any)?.isDoctor) {
    return <Redirect to="/dashboard" />;
  }

  // If route requires non-AI-only access and user has AI-only access, redirect
  if (requireNonAiOnly && user?.aiOnlyAccess) {
    return <Redirect to="/prevention" />;
  }

  return <>{children}</>;
}
