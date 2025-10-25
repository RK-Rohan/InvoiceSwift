'use server';

/**
 * @fileOverview A flow for customizing invoice templates using AI.
 * 
 * - customizeInvoiceTemplate - A function that generates customized invoice templates based on user input.
 * - CustomizeInvoiceTemplateInput - The input type for the customizeInvoiceTemplate function.
 * - CustomizeInvoiceTemplateOutput - The return type for the customizeInvoiceTemplate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomizeInvoiceTemplateInputSchema = z.object({
  companyLogoDataUri: z
    .string()
    .describe(
      'A company logo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    )
    .optional(),
  companyName: z.string().describe('The name of the company.'),
  companyBranding: z.string().describe('Description of company branding guidelines.'),
  lateFeeConditions: z.string().describe('The late fee payment conditions to include in the invoice.'),
});
export type CustomizeInvoiceTemplateInput = z.infer<typeof CustomizeInvoiceTemplateInputSchema>;

const CustomizeInvoiceTemplateOutputSchema = z.object({
  invoiceTemplate: z.string().describe('The generated HTML invoice template.'),
});
export type CustomizeInvoiceTemplateOutput = z.infer<typeof CustomizeInvoiceTemplateOutputSchema>;

export async function customizeInvoiceTemplate(
  input: CustomizeInvoiceTemplateInput
): Promise<CustomizeInvoiceTemplateOutput> {
  return customizeInvoiceTemplateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customizeInvoiceTemplatePrompt',
  input: {schema: CustomizeInvoiceTemplateInputSchema},
  output: {schema: CustomizeInvoiceTemplateOutputSchema},
  prompt: `You are an expert in creating visually appealing and professional invoice templates.

  Based on the company branding guidelines and late fee conditions, generate an HTML invoice template.

  Company Name: {{{companyName}}}
  Branding Guidelines: {{{companyBranding}}}
  Late Fee Conditions: {{{lateFeeConditions}}}
  {{#if companyLogoDataUri}}
  Company Logo: {{media url=companyLogoDataUri}}
  {{/if}}

  Return the complete HTML invoice template as a string.
  Make sure the invoice has a clean, tabular layout for invoice details and totals.
  Use Inter font for a clean, modern, objective, and neutral appearance.
  Use soft blue (#A0BFE0) as the primary color, light gray (#F0F4F8) as the background color, and muted green (#8FBC8F) for positive actions and highlights.
  `,
});

const customizeInvoiceTemplateFlow = ai.defineFlow(
  {
    name: 'customizeInvoiceTemplateFlow',
    inputSchema: CustomizeInvoiceTemplateInputSchema,
    outputSchema: CustomizeInvoiceTemplateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
