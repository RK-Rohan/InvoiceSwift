'use server';

import { z } from 'zod';
import { customizeInvoiceTemplate } from '@/ai/flows/customize-invoice-templates';
import { customizationSchema } from '@/lib/types';

export async function generateCustomInvoiceAction(
  values: z.infer<typeof customizationSchema>
) {
  try {
    const result = await customizeInvoiceTemplate(values);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to generate invoice template.' };
  }
}
