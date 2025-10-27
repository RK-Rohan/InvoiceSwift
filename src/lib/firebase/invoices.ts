
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

const calculateSubtotal = (invoiceData: Partial<InvoiceFormData>): number => {
  if (!invoiceData.items) return 0;
  return invoiceData.items.reduce((acc, item) => {
    let itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
    if (item.customFields && invoiceData.customColumns) {
      item.customFields.forEach(field => {
        const column = invoiceData.customColumns?.find(c => c.name === field.name);
        const value = parseFloat(field.value) || 0;
        if (column?.type === 'subtractive') {
          itemTotal -= value;
        } else if (column?.type === 'additive') {
          itemTotal += value;
        }
      });
    }
    return acc + itemTotal;
  }, 0);
};

export function addInvoice(invoiceData: InvoiceFormData) {
  const invoicesCollection = getInvoicesCollection();
  
  const subtotal = calculateSubtotal(invoiceData);
  const totalAmount = subtotal - (invoiceData.discount || 0);

  const data = {
    ...invoiceData,
    issueDate: format(new Date(invoiceData.issueDate), 'yyyy-MM-dd'),
    dueDate: format(new Date(invoiceData.dueDate), 'yyyy-MM-dd'),
    currency: invoiceData.currency || 'USD',
    totalAmount: totalAmount,
    createdAt: serverTimestamp(),
    customColumns: invoiceData.customColumns || [],
    items: (invoiceData.items || []).map(item => ({
      ...item,
      customFields: item.customFields || [],
    })),
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

  // Start with the provided data and add the update timestamp
  const dataToUpdate: Partial<Invoice & { updatedAt: any }> = {
    ...invoiceData,
    updatedAt: serverTimestamp(),
  };

  // If items are being updated, we must recalculate the totalAmount
  if (invoiceData.items || invoiceData.discount !== undefined) {
    const subtotal = calculateSubtotal(invoiceData);
    dataToUpdate.totalAmount = subtotal - (invoiceData.discount || 0);
  }

  // Convert dates to string format if they exist in the payload
  if (invoiceData.issueDate) {
    dataToUpdate.issueDate = format(new Date(invoiceData.issueDate), 'yyyy-MM-dd');
  }
  if (invoiceData.dueDate) {
    dataToUpdate.dueDate = format(new Date(invoiceData.dueDate), 'yyyy-MM-dd');
  }

  updateDocumentNonBlocking(invoiceDoc, dataToUpdate);
}

export function deleteInvoice(invoiceId: string) {
  const invoiceDoc = doc(getInvoicesCollection(), invoiceId);
  deleteDocumentNonBlocking(invoiceDoc);
}
