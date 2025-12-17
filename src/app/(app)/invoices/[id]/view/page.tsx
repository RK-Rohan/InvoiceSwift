
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/auth';
import type { InvoiceWithId, CompanyProfile } from '@/lib/types';
import { useForm, FormProvider } from 'react-hook-form';
import InvoicePreview from '@/components/invoice/invoice-preview';
import { Skeleton } from '@/components/ui/skeleton';

export default function ViewInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<InvoiceWithId | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const methods = useForm<InvoiceWithId>();
  
  useEffect(() => {
    if (!user || !params.id) return;
    
    const fetchInvoiceAndProfile = async () => {
      setLoading(true);
      try {
        const [invoiceRes, profileRes] = await Promise.all([
          fetch(`/api/invoices/${params.id}`),
          fetch('/api/company-profile'),
        ]);

        if (invoiceRes.ok) {
          const invoiceBody = await invoiceRes.json();
          const invoiceData = invoiceBody.data as InvoiceWithId | null;
          if (invoiceData) {
            setInvoice(invoiceData);
            methods.reset(invoiceData);
          }
        }

        if (profileRes.ok) {
          const profileBody = await profileRes.json();
          setCompanyProfile(profileBody.data as CompanyProfile | null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceAndProfile();
  }, [user, params.id, methods]);
  
  useEffect(() => {
    if (!loading && invoice) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, invoice]);

  if (loading) {
    return <div className="p-8"><Skeleton className="h-[90vh] w-full" /></div>;
  }

  if (!invoice) {
    return <p className="p-8">Invoice not found.</p>;
  }

  return (
    <div className="bg-background">
        <FormProvider {...methods}>
            <InvoicePreview generatedHtml={null} companyProfile={companyProfile} />
        </FormProvider>
    </div>
  );
}
