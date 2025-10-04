import { useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Logout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await apiRequest("/api/auth/logout", "POST");
        toast({
          title: "Logout effettuato",
          description: "A presto!",
        });
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        window.location.href = "/login";
      }
    };

    performLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Logout in corso...</p>
      </div>
    </div>
  );
}
