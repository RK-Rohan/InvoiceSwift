'use client';

import InvoiceForm from '@/components/invoice/invoice-form';

// This page is deprecated and its logic moved to the /[id]/edit page and the InvoiceForm component.
// It can be removed in the future. For now, it just renders the form.
export default function InvoiceTemplatePage({ params }: { params?: { id: string } }) {
  return <InvoiceForm params={params} />;
}
