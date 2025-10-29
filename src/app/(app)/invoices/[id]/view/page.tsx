
'use client';

import { useMemo, useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { InvoiceWithId, CompanyProfile } from '@/lib/types';
import { useForm, FormProvider } from 'react-hook-form';
import InvoicePreview from '@/components/invoice/invoice-preview';
import { Skeleton } from '@/components/ui/skeleton';

export default function ViewInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<InvoiceWithId | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { user } = useUser();
  const methods = useForm<InvoiceWithId>();
  
  useEffect(() => {
    if (!user || !firestore || !params.id) return;
    
    const fetchInvoiceAndProfile = async () => {
      setLoading(true);
      try {
        const invoiceRef = doc(firestore, 'users', user.uid, 'invoices', params.id);
        const invoiceSnap = await getDoc(invoiceRef);
        
        if (invoiceSnap.exists()) {
          const invoiceData = { ...invoiceSnap.data(), id: invoiceSnap.id } as InvoiceWithId;
          setInvoice(invoiceData);
          methods.reset(invoiceData);
        }

        const companyProfileRef = doc(firestore, 'users', user.uid, 'companyProfile', 'profile');
        const companyProfileSnap = await getDoc(companyProfileRef);

        if (companyProfileSnap.exists()) {
          setCompanyProfile(companyProfileSnap.data() as CompanyProfile);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceAndProfile();
  }, [user, firestore, params.id, methods]);
  
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
