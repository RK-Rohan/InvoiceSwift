
'use client';

import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer, Download, Building } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import type { InvoiceFormData, CompanyProfile, CustomColumn } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

type InvoicePreviewProps = {
  generatedHtml: string | null;
  companyProfile: CompanyProfile | null;
};

export default function InvoicePreview({ generatedHtml, companyProfile }: InvoicePreviewProps) {
  const { watch } = useFormContext<InvoiceFormData>();
  const data = watch();
  const customColumns = data.customColumns || [];

  const handlePrint = () => {
    window.print();
  };

  const downloadHtml = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${data.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const calculateLineItemTotal = (item: any) => {
    let total = (item.quantity || 0) * (item.unitPrice || 0);
    item.customFields?.forEach((field: any) => {
      const column = customColumns.find(c => c.name === field.name);
      const value = parseFloat(field.value) || 0;
      if (column?.type === 'subtractive') {
        total -= value;
      } else if (column?.type === 'additive') {
        total += value;
      }
    });
    return total;
  };

  const subtotal = useMemo(() => data.items.reduce((acc, item) => acc + calculateLineItemTotal(item), 0), [data.items, customColumns]);


  const DefaultPreview = () => (
    <CardContent className="p-6 sm:p-8">
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="flex items-start gap-4">
            {companyProfile?.logoUrl ? (
                <Avatar className="h-20 w-20">
                    <AvatarImage src={companyProfile.logoUrl} alt={companyProfile.companyName} />
                    <AvatarFallback><Building className="h-8 w-8" /></AvatarFallback>
                </Avatar>
            ) : null}
            <div>
              <h2 className="text-2xl font-bold text-primary">{companyProfile?.companyName || 'Your Company'}</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{companyProfile?.address || 'Your Address'}</p>
            </div>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold">INVOICE</h1>
          <p className="text-muted-foreground"># {data.invoiceNumber}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div>
          <h3 className="font-semibold mb-1">Bill To</h3>
          <p className="font-medium">{data.clientName}</p>
        </div>
        <div className="text-right">
          <p><span className="font-semibold">Issue Date:</span> {data.issueDate ? format(new Date(data.issueDate), 'PPP') : ''}</p>
          <p><span className="font-semibold">Due Date:</span> {data.dueDate ? format(new Date(data.dueDate), 'PPP') : ''}</p>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
            {customColumns.map(col => <TableHead key={col.name} className="text-right">{col.name}</TableHead>)}
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.description}</TableCell>
              <TableCell className="text-center">{item.quantity}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.unitPrice || 0, data.currency)}</TableCell>
              {customColumns.map(col => (
                  <TableCell key={col.name} className="text-right">
                      {item.customFields?.find(cf => cf.name === col.name)?.value || '-'}
                  </TableCell>
              ))}
              <TableCell className="text-right">{formatCurrency(calculateLineItemTotal(item), data.currency)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-8">
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(subtotal, data.currency)}</span>
          </div>
        </div>
      </div>
      {data.notes && (
        <div className="mt-8">
          <h3 className="font-semibold mb-1">Notes</h3>
          <p className="text-muted-foreground text-sm">{data.notes}</p>
        </div>
      )}
    </CardContent>
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between no-print">
        <CardTitle>Preview</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          {generatedHtml && (
            <Button variant="outline" size="sm" onClick={downloadHtml}>
              <Download className="mr-2 h-4 w-4" /> HTML
            </Button>
          )}
        </div>
      </CardHeader>
      <div className="h-[70vh] overflow-auto invoice-print-area">
        {generatedHtml ? (
          <iframe
            srcDoc={generatedHtml}
            className="w-full h-full border-0"
            title="Generated Invoice Preview"
          />
        ) : (
          <DefaultPreview />
        )}
      </div>
    </Card>
  );
}
