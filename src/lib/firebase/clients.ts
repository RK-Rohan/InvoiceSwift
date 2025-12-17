'use client';

import type { ClientFormData } from '@/lib/types';

async function handleResponse(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || 'Request failed');
  }
  return body;
}

export async function addClient(clientData: ClientFormData) {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  });
  const body = await handleResponse(res);
  return body.data as { id: string; name: string; email: string; phoneNumber?: string; address?: string };
}

export async function updateClient(clientId: string, clientData: Partial<ClientFormData>) {
  const res = await fetch(`/api/clients/${clientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  });
  await handleResponse(res);
}

export async function deleteClient(clientId: string) {
  const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
  await handleResponse(res);
}
