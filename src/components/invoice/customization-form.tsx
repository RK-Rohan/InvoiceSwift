'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type CustomizationData, customizationSchema } from '@/lib/types';
import { generateCustomInvoiceAction } from '@/app/actions';
import { Sparkles } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { Invoice } from '@/lib/types';

type CustomizationFormProps = {
  setGeneratedHtml: (html: string | null) => void;
};

export default function CustomizationForm({ setGeneratedHtml }: CustomizationFormProps) {
  const { watch } = useFormContext<Invoice>();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const fromName = watch('from_name');

  const form = useForm<CustomizationData>({
    resolver: zodResolver(customizationSchema),
    defaultValues: {
      companyName: fromName || '',
      companyBranding: 'Modern, clean, and professional with a focus on readability.',
      lateFeeConditions: 'A late fee of 1.5% will be charged per month on overdue invoices.',
      companyLogo: undefined,
    },
  });

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (values: CustomizationData) => {
    setIsGenerating(true);
    try {
      let logoDataUri;
      if (values.companyLogo && values.companyLogo[0]) {
        logoDataUri = await readFileAsDataURL(values.companyLogo[0]);
      }
      
      const result = await generateCustomInvoiceAction({
        ...values,
        companyLogoDataUri: logoDataUri,
      });

      if (result.success && result.data) {
        setGeneratedHtml(result.data.invoiceTemplate);
        toast({
          title: 'Template Generated',
          description: 'Your custom invoice template has been created.',
          variant: 'default',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate invoice template. Please try again.',
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>Generate with AI</CardTitle>
        <CardDescription>
          Customize your invoice template using AI. Provide your branding guidelines, and we'll create a professional look for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" {...form.register('companyName')} />
            {form.formState.errors.companyName && <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyBranding">Company Branding</Label>
            <Textarea id="companyBranding" {...form.register('companyBranding')} placeholder="e.g., minimalist, colorful, formal" />
             {form.formState.errors.companyBranding && <p className="text-sm text-destructive">{form.formState.errors.companyBranding.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lateFeeConditions">Late Fee Conditions</Label>
            <Textarea id="lateFeeConditions" {...form.register('lateFeeConditions')} />
             {form.formState.errors.lateFeeConditions && <p className="text-sm text-destructive">{form.formState.errors.lateFeeConditions.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyLogo">Company Logo</Label>
            <Input id="companyLogo" type="file" {...form.register('companyLogo')} accept="image/*" />
          </div>
          <div className="flex gap-4">
             <Button type="submit" disabled={isGenerating}>
              <Sparkles className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Template'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setGeneratedHtml(null)}>
              Reset to Default
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
