import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BackButtonProps {
  fallbackRoute?: string;
  label?: string;
  variant?: "default" | "ghost" | "outline" | "secondary";
  className?: string;
  testId?: string;
}

export function BackButton({ 
  fallbackRoute, 
  label = "Torna indietro",
  variant = "outline",
  className = "",
  testId = "button-back"
}: BackButtonProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleBack = () => {
    if (window.history.length > 2) {
      window.history.back();
    } else {
      let defaultRoute = fallbackRoute;
      
      if (!defaultRoute && user) {
        if (user.isAdmin) {
          defaultRoute = '/admin';
        } else if (user.isDoctor) {
          defaultRoute = '/doctor/appointments';
        } else {
          defaultRoute = '/dashboard';
        }
      }
      
      setLocation(defaultRoute || '/');
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleBack}
      className={className}
      data-testid={testId}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}
