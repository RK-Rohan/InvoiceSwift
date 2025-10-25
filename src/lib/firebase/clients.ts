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
import {
  initializeFirebase,
  errorEmitter,
  FirestorePermissionError,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase';
import type { ClientFormData } from '@/lib/types';

const { firestore, auth } = initializeFirebase();

function getClientsCollection() {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return collection(firestore, 'users', user.uid, 'clients');
}

export function addClient(clientData: ClientFormData) {
  const clientsCollection = getClientsCollection();
  const data = {
    ...clientData,
    createdAt: serverTimestamp(),
  };
  // Return the promise from addDoc
  return addDoc(clientsCollection, data).catch(error => {
    const permissionError = new FirestorePermissionError({
      path: clientsCollection.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    // Re-throw the original error to be caught by the calling function's catch block
    throw error;
  });
}

export function updateClient(clientId: string, clientData: Partial<ClientFormData>) {
  const clientDoc = doc(getClientsCollection(), clientId);
  const data = {
    ...clientData,
    updatedAt: serverTimestamp(),
  };
  updateDocumentNonBlocking(clientDoc, data);
}

export function deleteClient(clientId: string) {
  const clientDoc = doc(getClientsCollection(), clientId);
  deleteDocumentNonBlocking(clientDoc);
}
