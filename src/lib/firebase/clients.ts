'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { ClientFormData } from '@/lib/types';

const { firestore, auth } = initializeFirebase();

function getClientsCollection() {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return collection(firestore, 'users', user.uid, 'clients');
}

export function addClient(clientData: ClientFormData) {
  const clientsCollection = getClientsCollection();
  addDoc(clientsCollection, {
    ...clientData,
    createdAt: serverTimestamp(),
  }).catch(error => {
    const permissionError = new FirestorePermissionError({
      path: clientsCollection.path,
      operation: 'create',
      requestResourceData: clientData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function updateClient(clientId: string, clientData: Partial<ClientFormData>) {
  const clientDoc = doc(getClientsCollection(), clientId);
  updateDoc(clientDoc, {
    ...clientData,
    updatedAt: serverTimestamp(),
  }).catch(error => {
    const permissionError = new FirestorePermissionError({
      path: clientDoc.path,
      operation: 'update',
      requestResourceData: clientData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function deleteClient(clientId: string) {
  const clientDoc = doc(getClientsCollection(), clientId);
  deleteDoc(clientDoc).catch(error => {
    const permissionError = new FirestorePermissionError({
      path: clientDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}
