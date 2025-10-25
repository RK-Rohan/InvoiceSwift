'use client';

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import type { ClientFormData } from '@/lib/types';

const { firestore, auth } = initializeFirebase();

function getClientsCollection() {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return collection(firestore, 'users', user.uid, 'clients');
}

export async function addClient(clientData: ClientFormData) {
  const clientsCollection = getClientsCollection();
  return await addDoc(clientsCollection, {
    ...clientData,
    createdAt: serverTimestamp(),
  });
}

export async function updateClient(clientId: string, clientData: Partial<ClientFormData>) {
  const clientDoc = doc(getClientsCollection(), clientId);
  return await updateDoc(clientDoc, {
    ...clientData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteClient(clientId: string) {
  const clientDoc = doc(getClientsCollection(), clientId);
  return await deleteDoc(clientDoc);
}
