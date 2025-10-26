'use client';

import InvoiceForm from '@/components/invoice/invoice-form';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  return <InvoiceForm params={params} />;
}
