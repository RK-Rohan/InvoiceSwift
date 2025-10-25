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


export const invoiceSchema = z.object({
  from_name: z.string().min(1, 'Your name is required.'),
  from_address: z.string().min(1, 'Your address is required.'),
  client_id: z.string().optional(),
  client_name: z.string().min(1, "Client's name is required."),
  client_address: z.string().min(1, "Client's address is required."),
  invoice_number: z.string().min(1, 'Invoice number is required.'),
  issue_date: z.date(),
  due_date: z.date(),
  items: z.array(lineItemSchema).min(1, 'At least one item is required.'),
  notes: z.string().optional(),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(0),
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
  logoUrl: z.string().url().optional(),
});

export type LineItem = z.infer<typeof lineItemSchema>;
export type Client = z.infer<typeof clientSchema>;
export type ClientFormData = z.infer<typeof clientFormSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type CustomizationData = z.infer<typeof customizationSchema>;
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
