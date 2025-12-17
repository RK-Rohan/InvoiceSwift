'use client';

import { useEffect, useMemo, useState } from 'react';

export interface UseDocResult<T> {
  data: (T & { id?: string }) | null;
  isLoading: boolean;
  error: Error | null;
}

export function useDoc<T = any>(endpoint: string | null | undefined): UseDocResult<T> {
  const memoEndpoint = useMemo(() => endpoint, [endpoint]);
  const [data, setData] = useState<(T & { id?: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!memoEndpoint) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(memoEndpoint)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || 'Failed to fetch document');
        }
        return res.json();
      })
      .then((body) => {
        if (!isMounted) return;
        setData(body.data ?? null);
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setError(err);
        setData(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [memoEndpoint]);

  return { data, isLoading, error };
}
