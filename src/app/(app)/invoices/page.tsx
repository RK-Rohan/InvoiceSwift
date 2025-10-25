'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays } from 'date-fns';

import { type Invoice, invoiceSchema } from '@/lib/types';
import InvoiceForm from '@/components/invoice/invoice-form';
import InvoicePreview from '@/components/invoice/invoice-preview';

const defaultValues: Invoice = {
  from_name: 'Your Company',
  from_address: '123 Main St, Anytown, USA',
  client_id: '',
  client_name: '',
  client_address: '',
  invoice_number: `INV-${new Date().getFullYear()}-001`,
  issue_date: new Date(),
  due_date: addDays(new Date(), 30),
  items: [{ id: '1', description: 'Item Description', quantity: 1, price: 100 }],
  notes: 'Thank you for your business.',
  tax_rate: 8,
};

export default function InvoicesPage() {
  const methods = useForm<Invoice>({
    resolver: zodResolver(invoiceSchema),
    defaultValues,
  });
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  return (
    <FormProvider {...methods}>
      <div className="grid gap-8 lg:grid-cols-2">
        <InvoiceForm setGeneratedHtml={setGeneratedHtml} />
        <InvoicePreview generatedHtml={generatedHtml} />
      </div>
    </FormProvider>
  );
}
