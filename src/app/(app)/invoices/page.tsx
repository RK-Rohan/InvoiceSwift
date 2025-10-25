'use client';

import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays } from 'date-fns';

import { type Invoice, invoiceSchema, type CompanyProfile } from '@/lib/types';
import InvoiceForm from '@/components/invoice/invoice-form';
import InvoicePreview from '@/components/invoice/invoice-preview';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useState } from 'react';

export default function InvoicesPage() {
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const companyProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'profile') : null),
    [user, firestore]
  );
  const { data: companyProfile } = useDoc<CompanyProfile>(companyProfileRef);

  const methods = useForm<Invoice>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      from_name: '',
      from_address: '',
      client_id: '',
      client_name: '',
      client_address: '',
      invoice_number: `INV-${new Date().getFullYear()}-001`,
      issue_date: new Date(),
      due_date: addDays(new Date(), 30),
      items: [{ id: '1', description: 'Item Description', quantity: 1, price: 100 }],
      notes: 'Thank you for your business.',
      tax_rate: 8,
    },
  });

  useEffect(() => {
    if (companyProfile) {
      methods.setValue('from_name', companyProfile.companyName);
      methods.setValue('from_address', `${companyProfile.address ?? ''}\n${companyProfile.email ?? ''}\n${companyProfile.phone ?? ''}`);
    } else {
        methods.setValue('from_name', 'Your Company');
        methods.setValue('from_address', '123 Main St, Anytown, USA');
    }
  }, [companyProfile, methods]);


  return (
    <FormProvider {...methods}>
      <div className="grid gap-8 lg:grid-cols-2">
        <InvoiceForm setGeneratedHtml={setGeneratedHtml} />
        <InvoicePreview generatedHtml={generatedHtml} />
      </div>
    </FormProvider>
  );
}
