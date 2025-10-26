
'use client';

import { useMemo, useState } from 'react';
import { type InvoiceWithId } from '@/lib/types';
import InvoiceForm from '@/components/invoice/invoice-form';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';

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

  if (isLoading && params?.id) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-[600px] w-full" />
            <Skeleton className="h-[70vh] w-full" />
        </div>
    );
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
