import { queryClient } from "@/lib/queryClient";

export function useLogout() {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      // Logout uses full page reload for complete session cleanup
      window.location.assign('/login');
    } catch (error) {
      console.error('Logout error:', error);
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      window.location.assign('/login');
    }
  };

  return handleLogout;
}
