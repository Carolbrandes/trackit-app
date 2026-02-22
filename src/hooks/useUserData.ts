import { useEffect, useState, useCallback } from 'react';
import { fetchMe, type ApiUser } from '../services/api';

export function useUserData() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    setError(null);
    fetchMe()
      .then((res) => {
        setUser(res.isLoggedIn && res.user ? res.user : null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { user, isLoading, error, refetch };
}
