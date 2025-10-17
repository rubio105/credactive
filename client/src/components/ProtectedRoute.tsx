import { Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireNonAiOnly?: boolean; // If true, blocks AI-only users from this route
}

export default function ProtectedRoute({ children, requireNonAiOnly = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return null;
  }

  // If not authenticated, redirect to login immediately
  if (!user) {
    return <Redirect to="/login" />;
  }

  // If route requires non-AI-only access and user has AI-only access, redirect
  if (requireNonAiOnly && user?.aiOnlyAccess) {
    return <Redirect to="/prevention" />;
  }

  return <>{children}</>;
}
