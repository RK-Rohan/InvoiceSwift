
'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceFormSchema, type InvoiceWithId } from '@/lib/types';
import InvoiceForm from '@/components/invoice/invoice-form';
import InvoicePreview from '@/components/invoice/invoice-preview';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import { z } from 'zod';

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export default function InvoiceTemplatePage({ params }: { params?: { id: string } }) {
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
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

  const methods = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: '',
      clientName: '',
      invoiceNumber: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      notes: '',
    },
  });

  if (isLoading) {
    return <p>Loading invoice...</p>;
  }

  if (params?.id && !invoice) {
    return <p>Invoice not found.</p>;
  }

  return (
    <FormProvider {...methods}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <InvoiceForm invoice={invoice} />
            </div>
            <div className="lg:sticky top-24 self-start">
                <InvoicePreview generatedHtml={generatedHtml} />
            </div>
        </div>
    </FormProvider>
  );
}
