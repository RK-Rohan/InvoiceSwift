'use client';

import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/lib/types';

type InvoicePreviewProps = {
  generatedHtml: string | null;
};

export default function InvoicePreview({ generatedHtml }: InvoicePreviewProps) {
  const { watch } = useFormContext<Invoice>();
  const data = watch();

  const handlePrint = () => {
    window.print();
  };

  const downloadHtml = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${data.invoice_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const taxAmount = subtotal * ((data.tax_rate || 0) / 100);
  const total = subtotal + taxAmount;

  const DefaultPreview = () => (
    <CardContent className="p-6 sm:p-8">
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary">{data.from_name}</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{data.from_address}</p>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold">INVOICE</h1>
          <p className="text-muted-foreground"># {data.invoice_number}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div>
          <h3 className="font-semibold mb-1">Bill To</h3>
          <p className="font-medium">{data.client_name}</p>
          <p className="text-muted-foreground whitespace-pre-wrap">{data.client_address}</p>
        </div>
        <div className="text-right">
          <p><span className="font-semibold">Issue Date:</span> {format(data.issue_date, 'PPP')}</p>
          <p><span className="font-semibold">Due Date:</span> {format(data.due_date, 'PPP')}</p>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.description}</TableCell>
              <TableCell className="text-center">{item.quantity}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.quantity * item.price)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-8">
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({data.tax_rate || 0}%)</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
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
    <Card className="sticky top-24">
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
