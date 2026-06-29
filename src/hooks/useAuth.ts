import { useEffect, useState } from 'react';
import type { AuthSession } from '../types/domain';
import { listenToAuthSession } from '../services/authService';

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToAuthSession((nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    session,
    loading,
  };
}
