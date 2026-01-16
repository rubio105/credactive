import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireNonAiOnly?: boolean; // If true, blocks AI-only users from this route
  requireDoctor?: boolean; // If true, blocks non-doctor users from this route
  requireReportOperator?: boolean; // If true, requires report operator role
  requireReportDoctor?: boolean; // If true, requires report doctor role
  allowReportRoles?: boolean; // If true, allows report operators/doctors to access this route
}

export default function ProtectedRoute({ 
  children, 
  requireNonAiOnly = false, 
  requireDoctor = false,
  requireReportOperator = false,
  requireReportDoctor = false,
  allowReportRoles = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const typedUser = user as any;

  // Show loading while checking auth
  if (isLoading) {
    return null;
  }

  // If not authenticated, redirect to login with return URL
  if (!user) {
    const redirectUrl = encodeURIComponent(location);
    return <Redirect to={`/login?redirect=${redirectUrl}`} />;
  }

  // If route requires report operator role
  if (requireReportOperator && !typedUser?.isReportOperator) {
    return <Redirect to="/login" />;
  }

  // If route requires report doctor role
  if (requireReportDoctor && !typedUser?.isReportDoctor) {
    return <Redirect to="/login" />;
  }

  // Block report-only users from accessing general pages (unless allowReportRoles is true)
  // Report operators and report doctors should only access their specific portals
  const isReportOnlyUser = (typedUser?.isReportOperator || typedUser?.isReportDoctor) && 
                           !typedUser?.isAdmin && 
                           !typedUser?.isDoctor && 
                           !typedUser?.aiOnlyAccess;
  
  if (isReportOnlyUser && !allowReportRoles && !requireReportOperator && !requireReportDoctor) {
    // Redirect report-only users to their appropriate portal
    if (typedUser?.isReportOperator) {
      return <Redirect to="/operatore/referti" />;
    }
    if (typedUser?.isReportDoctor) {
      return <Redirect to="/refertatore/referti" />;
    }
  }

  // If route requires doctor access and user is not a doctor, redirect to dashboard
  if (requireDoctor && !typedUser?.isDoctor) {
    return <Redirect to="/dashboard" />;
  }

  // If route requires non-AI-only access and user has AI-only access, redirect
  if (requireNonAiOnly && user?.aiOnlyAccess) {
    return <Redirect to="/prevention" />;
  }

  return <>{children}</>;
}
