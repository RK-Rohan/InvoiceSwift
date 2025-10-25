'use client';

import InvoiceTemplatePage from '@/app/(app)/invoices/template/page';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  return <InvoiceTemplatePage params={params} />;
}
