
'use client';

import { useMemo, useState, useEffect } from 'react';
import { type InvoiceWithId } from '@/lib/types';
import InvoiceForm from '@/components/invoice/invoice-form';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoiceTemplatePage({ params }: { params?: { id: string } }) {
  const [invoiceId, setInvoiceId] = useState<string | undefined>(undefined);
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    // Since params can be a promise, we handle it asynchronously.
    const resolveParams = async () => {
      if (params) {
        // In newer Next.js versions, params can be a promise.
        // For simplicity and compatibility, we check if it's a promise-like object.
        // A simple check like this avoids needing React.use() which has other implications.
        const id = await (params.id as any);
        setInvoiceId(id);
      }
    };
    resolveParams();
  }, [params]);


  const invoiceRef = useMemoFirebase(
    () =>
      invoiceId && user && firestore
        ? doc(firestore, 'users', user.uid, 'invoices', invoiceId)
        : null,
    [user, firestore, invoiceId]
  );

  const { data: invoice, isLoading } = useDoc<InvoiceWithId>(invoiceRef);

  if (isLoading && invoiceId) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-[600px] w-full" />
            <Skeleton className="h-[70vh] w-full" />
        </div>
    );
  }

  if (invoiceId && !invoice && !isLoading) {
    return <p>Invoice not found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-8">
        <InvoiceForm invoice={invoice} />
    </div>
  );
}
