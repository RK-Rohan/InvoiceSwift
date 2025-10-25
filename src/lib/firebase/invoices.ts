
'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  initializeFirebase,
  errorEmitter,
  FirestorePermissionError,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase';
import type { Invoice, InvoiceFormData } from '@/lib/types';
import { format } from 'date-fns';

const { firestore, auth } = initializeFirebase();

function getInvoicesCollection() {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return collection(firestore, 'users', user.uid, 'invoices');
}

function getInvoiceItemsCollection(invoiceId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return collection(firestore, 'users', user.uid, 'invoices', invoiceId, 'items');
}

export function addInvoice(invoiceData: InvoiceFormData) {
  const invoicesCollection = getInvoicesCollection();
  const data = {
    ...invoiceData,
    issueDate: format(invoiceData.issueDate, 'yyyy-MM-dd'),
    dueDate: format(invoiceData.dueDate, 'yyyy-MM-dd'),
    totalAmount: invoiceData.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
    createdAt: serverTimestamp(),
    customColumns: invoiceData.customColumns || [],
  };

  return addDoc(invoicesCollection, data).catch(error => {
    const permissionError = new FirestorePermissionError({
      path: invoicesCollection.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw error;
  });
}

export function updateInvoice(invoiceId: string, invoiceData: Partial<InvoiceFormData>) {
  const invoiceDoc = doc(getInvoicesCollection(), invoiceId);
  const data = {
    ...invoiceData,
    ...(invoiceData.issueDate && { issueDate: format(new Date(invoiceData.issueDate), 'yyyy-MM-dd') }),
    ...(invoiceData.dueDate && { dueDate: format(new Date(invoiceData.dueDate), 'yyyy-MM-dd') }),
    totalAmount: invoiceData.items?.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
    updatedAt: serverTimestamp(),
    customColumns: invoiceData.customColumns || [],
  };

  updateDocumentNonBlocking(invoiceDoc, data);
}

export function deleteInvoice(invoiceId: string) {
  const invoiceDoc = doc(getInvoicesCollection(), invoiceId);
  deleteDocumentNonBlocking(invoiceDoc);
}
