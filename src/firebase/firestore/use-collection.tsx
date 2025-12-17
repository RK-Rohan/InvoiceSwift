'use client';

import { useState, useEffect, useMemo } from 'react';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCollection<T = any>(endpoint: string | null | undefined): UseCollectionResult<T> {
  const memoEndpoint = useMemo(() => endpoint, [endpoint]);
  const [data, setData] = useState<WithId<T>[] | null>(null);
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
          throw new Error(body?.error || 'Failed to fetch data');
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
