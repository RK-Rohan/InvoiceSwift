
import { z } from 'zod';

export const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().min(0, 'Quantity must be positive.'),
  price: z.coerce.number().min(0, 'Price must be positive.'),
});

export const clientFormSchema = z.object({
  name: z.string().min(1, 'Client name is required.'),
  email: z.string().email('Invalid email address.'),
  phoneNumber: z.string().optional(),
  address: z.string().min(1, 'Client address is required.'),
});

export const clientSchema = clientFormSchema.extend({
  id: z.string(),
});

const dateOrStringSchema = z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
});

const customColumnSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'subtractive', 'additive']),
});

const customFieldSchema = z.object({
  name: z.string(),
  value: z.string(),
});

export const invoiceFormSchema = z.object({
  clientId: z.string().min(1, 'Client is required.'),
  clientName: z.string(),
  clientEmail: z.string().optional(),
  clientPhoneNumber: z.string().optional(),
  clientAddress: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
  issueDate: dateOrStringSchema,
  dueDate: dateOrStringSchema,
  currency: z.string().optional().default('BDT'),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required.'),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
    unitPrice: z.coerce.number().min(0, 'Unit price must be non-negative.'),
    customFields: z.array(customFieldSchema).optional(),
  })).min(1, 'At least one item is required.'),
  notes: z.string().optional(),
  customColumns: z.array(customColumnSchema).optional(),
});

export const invoiceSchema = invoiceFormSchema.extend({
  totalAmount: z.number(),
});

export const invoiceWithIdSchema = invoiceSchema.extend({
  id: z.string(),
});

export const customizationSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyBranding: z.string().min(1, "Branding description is required"),
  lateFeeConditions: z.string().min(1, "Late fee conditions are required"),
  companyLogo: z.any().optional(),
});

export const companyProfileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().optional(),
});

export type LineItem = z.infer<typeof lineItemSchema>;
export type Client = z.infer<typeof clientSchema>;
export type ClientFormData = z.infer<typeof clientFormSchema>;
export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceWithId = z.infer<typeof invoiceWithIdSchema>;
export type CustomizationData = z.infer<typeof customizationSchema>;
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type CustomColumn = z.infer<typeof customColumnSchema>;

    