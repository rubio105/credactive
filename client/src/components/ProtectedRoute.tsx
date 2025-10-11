import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireNonAiOnly?: boolean; // If true, blocks AI-only users from this route
}

export default function ProtectedRoute({ children, requireNonAiOnly = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // If route requires non-AI-only access and user has AI-only access
    if (requireNonAiOnly && user?.aiOnlyAccess) {
      // Redirect AI-only users to prevention page
      setLocation("/prevention");
    }
  }, [user, isLoading, requireNonAiOnly, setLocation]);

  // Show nothing while checking or redirecting
  if (isLoading || (requireNonAiOnly && user?.aiOnlyAccess)) {
    return null;
  }

  return <>{children}</>;
}
