
'use client';

import { useMemo, useState } from 'react';
import { type InvoiceWithId } from '@/lib/types';
import InvoiceForm from '@/components/invoice/invoice-form';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';

export default function InvoiceTemplatePage({ params }: { params?: { id: string } }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const invoiceRef = useMemoFirebase(
    () =>
      params?.id && user && firestore
        ? doc(firestore, 'users', user.uid, 'invoices', params.id)
        : null,
    [user, firestore, params?.id]
  );

  const { data: invoice, isLoading } = useDoc<InvoiceWithId>(invoiceRef);

  if (isLoading) {
    return <p>Loading invoice...</p>;
  }

  if (params?.id && !invoice && !isLoading) {
    return <p>Invoice not found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-8">
        <InvoiceForm invoice={invoice} />
    </div>
  );
}
