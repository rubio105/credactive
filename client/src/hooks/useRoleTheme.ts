import { useEffect } from 'react';
import { useAuth } from './useAuth';

export function useRoleTheme() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      document.body.removeAttribute('data-role');
      return;
    }

    const isDoctor = (user as any)?.isDoctor;
    const isAdmin = (user as any)?.isAdmin;

    if (isAdmin) {
      document.body.setAttribute('data-role', 'admin');
    } else if (isDoctor) {
      document.body.setAttribute('data-role', 'doctor');
    } else {
      document.body.setAttribute('data-role', 'patient');
    }

    return () => {
      document.body.removeAttribute('data-role');
    };
  }, [user, isAuthenticated]);
}
