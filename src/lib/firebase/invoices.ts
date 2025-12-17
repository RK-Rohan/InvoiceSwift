
'use client';

import type { InvoiceFormData, InvoiceWithId } from '@/lib/types';

async function handleResponse(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || 'Request failed');
  }
  return body;
}

export async function addInvoice(invoiceData: InvoiceFormData) {
  const res = await fetch('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData),
  });
  const body = await handleResponse(res);
  return body.data as InvoiceWithId;
}

export async function updateInvoice(invoiceId: string, invoiceData: Partial<InvoiceFormData>) {
  const res = await fetch(`/api/invoices/${invoiceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData),
  });
  await handleResponse(res);
}

export async function deleteInvoice(invoiceId: string) {
  const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
  await handleResponse(res);
}

export async function duplicateInvoice(invoice: InvoiceWithId) {
  const res = await fetch(`/api/invoices/${invoice.id}/duplicate`, { method: 'POST' });
  const body = await handleResponse(res);
  return body.data as InvoiceWithId;
}
