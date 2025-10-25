'use client';

import { FirebaseProvider } from './provider';
import { initializeFirebase } from '.';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!firebaseApp || !auth || !firestore) {
    const initialized = initializeFirebase();
    firebaseApp = initialized.firebaseApp;
    auth = initialized.auth;
    firestore = initialized.firestore;
  }

  return (
    <FirebaseProvider app={firebaseApp} auth={auth} firestore={firestore}>
      {children}
    </FirebaseProvider>
  );
}
