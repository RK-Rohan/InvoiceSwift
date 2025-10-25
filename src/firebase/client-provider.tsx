'use client';

import { FirebaseProvider } from './provider';
import { initializeFirebase } from '.';

// Note: We are not using this file in this implementation,
// but it is good practice to have it for client-side only firebase initialization.
// We are initializing firebase in the root layout for simplicity.

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseApp, firestore, auth } = initializeFirebase();

  return (
    <FirebaseProvider app={firebaseApp} auth={auth} firestore={firestore}>
      {children}
    </FirebaseProvider>
  );
}
