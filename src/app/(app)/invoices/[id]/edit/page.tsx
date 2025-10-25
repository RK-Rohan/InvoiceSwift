'use client';

import InvoiceForm from '@/components/invoice/invoice-form';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { type InvoiceWithId } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const invoiceRef = useMemoFirebase(
    () =>
      user && firestore ? doc(firestore, 'users', user.uid, 'invoices', params.id) : null,
    [user, firestore, params.id]
  );

  const { data: invoice, isLoading } = useDoc<InvoiceWithId>(invoiceRef);

  if (isLoading) {
    return <p>Loading invoice...</p>;
  }

  if (!invoice) {
    return <p>Invoice not found.</p>;
  }

  return <InvoiceForm invoice={invoice} />;
}
