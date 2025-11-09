import { queryClient } from "@/lib/queryClient";

export function useLogout() {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  return handleLogout;
}
