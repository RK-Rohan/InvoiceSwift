'use server';

import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { type ClientFormData, type Client, type InvoiceFormData, type InvoiceWithId, type CompanyProfile } from '@/lib/types';

type WithId<T> = T & { id: string };

function toObjectId(id: string) {
  return new ObjectId(id);
}

function invoiceSubtotal(invoiceData: Partial<InvoiceFormData>): number {
  if (!invoiceData.items) return 0;
  return invoiceData.items.reduce((acc, item) => {
    let itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
    if (item.customFields && invoiceData.customColumns) {
      item.customFields.forEach(field => {
        const column = invoiceData.customColumns?.find(c => c.name === field.name);
        const value = parseFloat(field.value) || 0;
        if (column?.type === 'subtractive') itemTotal -= value;
        else if (column?.type === 'additive') itemTotal += value;
      });
    }
    return acc + itemTotal;
  }, 0);
}

export async function listClients(userId: string): Promise<WithId<Client>[]> {
  const db = await getDb();
  const docs = await db
    .collection<Client & { _id: ObjectId; userId: string }>('clients')
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(({ _id, ...rest }) => ({ ...rest, id: _id.toString() }));
}

export async function createClient(userId: string, data: ClientFormData): Promise<WithId<Client>> {
  const db = await getDb();
  const doc = {
    ...data,
    userId,
    createdAt: new Date(),
  };
  const result = await db.collection('clients').insertOne(doc);
  return { ...data, id: result.insertedId.toString() };
}

export async function updateClientById(userId: string, clientId: string, data: Partial<ClientFormData>) {
  const db = await getDb();
  await db
    .collection('clients')
    .updateOne({ _id: toObjectId(clientId), userId }, { $set: { ...data, updatedAt: new Date() } });
}

export async function deleteClientById(userId: string, clientId: string) {
  const db = await getDb();
  await db.collection('clients').deleteOne({ _id: toObjectId(clientId), userId });
}

export async function listInvoices(userId: string): Promise<InvoiceWithId[]> {
  const db = await getDb();
  const docs = await db
    .collection<InvoiceWithId & { _id: ObjectId; userId: string }>('invoices')
    .find({ userId })
    .sort({ issueDate: -1 })
    .toArray();

  return docs.map(({ _id, ...rest }) => ({ ...rest, id: _id.toString() }));
}

export async function getInvoice(userId: string, invoiceId: string): Promise<InvoiceWithId | null> {
  const db = await getDb();
  const doc = await db
    .collection<InvoiceWithId & { _id: ObjectId; userId: string }>('invoices')
    .findOne({ _id: toObjectId(invoiceId), userId });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() };
}

export async function createInvoice(userId: string, data: InvoiceFormData): Promise<InvoiceWithId> {
  const db = await getDb();

  const subtotal = invoiceSubtotal(data);
  const totalAmount = subtotal - (data.discount || 0);

  const doc = {
    ...data,
    userId,
    totalAmount,
    issueDate: new Date(data.issueDate),
    dueDate: new Date(data.dueDate),
    createdAt: new Date(),
    items: (data.items || []).map(item => ({ ...item, customFields: item.customFields || [] })),
    customColumns: data.customColumns || [],
    currency: data.currency || 'USD',
    totalPaid: data.totalPaid || 0,
    discount: data.discount || 0,
  };

  const result = await db.collection('invoices').insertOne(doc);
  return { ...doc, id: result.insertedId.toString() };
}

export async function updateInvoiceById(
  userId: string,
  invoiceId: string,
  data: Partial<InvoiceFormData>
): Promise<void> {
  const db = await getDb();

  const payload: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.issueDate) payload.issueDate = new Date(data.issueDate);
  if (data.dueDate) payload.dueDate = new Date(data.dueDate);

  if (data.items || data.customColumns || data.discount !== undefined) {
    const subtotal = invoiceSubtotal(data);
    payload.totalAmount = subtotal - (data.discount || 0);
  }

  await db
    .collection('invoices')
    .updateOne({ _id: toObjectId(invoiceId), userId }, { $set: payload });
}

export async function deleteInvoiceById(userId: string, invoiceId: string) {
  const db = await getDb();
  await db.collection('invoices').deleteOne({ _id: toObjectId(invoiceId), userId });
}

export async function duplicateInvoiceForUser(userId: string, sourceId: string): Promise<InvoiceWithId | null> {
  const original = await getInvoice(userId, sourceId);
  if (!original) return null;
  const { id, totalAmount, createdAt, updatedAt, ...rest } = original;
  const newData: InvoiceFormData = {
    ...rest,
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    issueDate: new Date(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    totalPaid: 0,
  };
  return createInvoice(userId, newData);
}

export async function getCompanyProfile(userId: string): Promise<CompanyProfile | null> {
  const db = await getDb();
  const doc = await db
    .collection<CompanyProfile & { _id: ObjectId; userId: string }>('companyProfiles')
    .findOne({ userId });
  if (!doc) return null;
  const { _id, userId: _uid, ...rest } = doc;
  return rest;
}

export async function upsertCompanyProfile(userId: string, data: CompanyProfile): Promise<CompanyProfile> {
  const db = await getDb();
  await db
    .collection('companyProfiles')
    .updateOne(
      { userId },
      { $set: { ...data, updatedAt: new Date(), userId }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  return data;
}
