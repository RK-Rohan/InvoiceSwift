'use client';

import { useSession } from 'next-auth/react';

export interface AuthUser {
  id: string;
  uid: string;
  email?: string | null;
}

export function useUser() {
  const { data: session, status } = useSession();
  const sessionUser = session?.user;
  const userId =
    (sessionUser as typeof sessionUser & { id?: string; uid?: string })?.id ||
    (sessionUser as typeof sessionUser & { uid?: string })?.uid;

  const user: AuthUser | null =
    sessionUser && userId
      ? {
          id: userId,
          uid: userId,
          email: sessionUser.email,
        }
      : null;

  return {
    user,
    loading: status === 'loading',
  };
}
