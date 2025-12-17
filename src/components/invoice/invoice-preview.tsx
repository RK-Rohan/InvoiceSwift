'use client';

import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer, Download, Building } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import type { InvoiceFormData, CompanyProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

type InvoicePreviewProps = {
  generatedHtml: string | null;
  companyProfile: CompanyProfile | null;
  showQty?: boolean;
  orderedColumns?: string[];
  columnLabels?: Record<string, string>;
  showDiscountLine?: boolean;
  discountLabel?: string;
  showTaxLine?: boolean;
  taxLabel?: string;
};

export default function InvoicePreview({
  generatedHtml,
  companyProfile,
  showQty = true,
  orderedColumns,
  columnLabels,
  showDiscountLine = true,
  discountLabel = 'Discount',
  showTaxLine = true,
  taxLabel = 'VAT / Tax',
}: InvoicePreviewProps) {
  const { watch } = useFormContext<InvoiceFormData>();
  const data = watch();
  const customColumns = data.customColumns || [];
  const documentLabel = data.status === 'Quotation' ? 'Quotation' : 'Invoice';
  const documentNumberLabel = `${documentLabel} No.`;
  const defaultColumns = ['Description', 'Qty', 'Price'];

  const columnsToRender = useMemo(() => {
    if (orderedColumns && orderedColumns.length) {
      return showQty ? orderedColumns : orderedColumns.filter((col) => col !== 'Qty');
    }
    const cols = [...defaultColumns];
    customColumns.forEach((col: any) => {
      const anchorIndex = col.anchor ? cols.indexOf(col.anchor) : -1;
      if (anchorIndex !== -1) {
        const insertAt = col.position === 'before' ? anchorIndex : anchorIndex + 1;
        cols.splice(insertAt, 0, col.name);
      } else {
        cols.push(col.name);
      }
    });
    return showQty ? cols : cols.filter((col) => col !== 'Qty');
  }, [orderedColumns, customColumns, showQty]);

  const handlePrint = () => window.print();

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
      const column = customColumns.find((c: any) => c.name === field.name);
      const value = parseFloat(field.value) || 0;
      if (column?.type === 'subtractive') total -= value;
      else if (column?.type === 'additive') total += value;
    });
    return total;
  };

  const items = data.items || [];
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + calculateLineItemTotal(item), 0), [items, customColumns]);
  const discountAmount = useMemo(
    () => ((data.discountType || 'fixed') === 'percent' ? (subtotal * (data.discount || 0)) / 100 : data.discount || 0),
    [data.discountType, data.discount, subtotal]
  );
  const amountDue = useMemo(
    () => {
      const taxAmount = (data.taxType || 'fixed') === 'percent' ? (subtotal * (data.tax || 0)) / 100 : data.tax || 0;
      return subtotal + taxAmount - discountAmount - (data.totalPaid || 0);
    },
    [subtotal, data.taxType, data.tax, discountAmount, data.totalPaid]
  );

  const DefaultPreview = () => (
    <CardContent className="p-0">
      <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_25%)]" />
        <div className="relative flex flex-col gap-3 px-6 py-4 sm:px-8 sm:py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            {companyProfile?.logoUrl ? (
              <Avatar className="h-16 w-16 border border-white/40 bg-white/10">
                <AvatarImage src={companyProfile.logoUrl} alt={companyProfile.companyName} />
                <AvatarFallback className="bg-white/10 text-white">
                  <Building className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white">
                <Building className="h-7 w-7" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{companyProfile?.companyName || 'Your Company'}</h2>
              <p className="text-sm text-white/80 whitespace-pre-wrap">
                {companyProfile?.address || '123 Anywhere St, City, Country'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 rounded-2xl bg-white/10 px-5 py-4 text-left shadow-sm backdrop-blur">
            <span className="text-xs uppercase tracking-[0.25em] text-white/70">{documentNumberLabel}</span>
            <span className="text-2xl font-semibold">#{data.invoiceNumber || 'INV-XXXX'}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 sm:px-10 sm:py-8 bg-muted/60">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground">Bill To</h3>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-base font-semibold text-foreground">{data.clientName || 'Client name'}</p>
              <p className="text-muted-foreground">{data.clientEmail}</p>
              <p className="text-muted-foreground">{data.clientPhoneNumber}</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{data.clientAddress}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground">Invoice Info</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{documentLabel}#</span>
                <span className="font-semibold">#{data.invoiceNumber || 'INV-XXXX'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{documentLabel} Date</span>
                <span className="font-semibold">
                  {data.issueDate ? format(new Date(data.issueDate), 'dd MMM yyyy') : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-semibold">
                  {data.dueDate ? format(new Date(data.dueDate), 'dd MMM yyyy') : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Terms</span>
                <span className="font-semibold">
                  {data.status === 'Final' ? 'Due on Receipt' : data.status || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                {columnsToRender.map((col) => {
                  const label = columnLabels?.[col] ?? col;
                  const alignment = col === 'Description' ? 'text-left' : col === 'Qty' ? 'text-center' : 'text-right';
                  return (
                    <TableHead key={col} className={alignment}>
                      {label}
                    </TableHead>
                  );
                })}
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item, index) => (
                <TableRow key={index}>
                  {columnsToRender.map((col) => {
                    if (col === 'Description') {
                      return (
                        <TableCell key={`${index}-${col}`} className="font-medium">
                          {item.description || '—'}
                        </TableCell>
                      );
                    }
                    if (col === 'Qty') {
                      return (
                        <TableCell key={`${index}-${col}`} className="text-center">
                          {item.quantity ?? '—'}
                        </TableCell>
                      );
                    }
                    if (col === 'Price') {
                      return (
                        <TableCell key={`${index}-${col}`} className="text-right">
                          {formatCurrency(item.unitPrice || 0, data.currency)}
                        </TableCell>
                      );
                    }
                    const columnMeta = customColumns.find((c: any) => c.name === col);
                    const customValue = item.customFields?.find((cf: any) => cf.name === col)?.value;
                    const parsedNumber = typeof customValue === 'string' ? parseFloat(customValue) : customValue;
                    const displayValue =
                      columnMeta?.type && columnMeta.type !== 'text' && !Number.isNaN(parsedNumber)
                        ? formatCurrency(Number(parsedNumber) || 0, data.currency)
                        : customValue || '—';
                    return (
                      <TableCell key={`${index}-${col}`} className="text-right">
                        {displayValue}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">{formatCurrency(calculateLineItemTotal(item), data.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-2 rounded-xl border bg-background p-4 shadow-sm">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal, data.currency)}</span>
            </div>
            {showDiscountLine && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {discountLabel} {data.discountType === 'percent' ? `(${data.discount || 0}%)` : ''}
                </span>
                <span className="font-semibold">{formatCurrency(discountAmount, data.currency)}</span>
              </div>
            )}
            {showTaxLine && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {taxLabel} {data.taxType === 'percent' ? `(${data.tax || 0}%)` : ''}
                </span>
                <span className="font-semibold">
                  {formatCurrency(
                    (data.taxType || 'fixed') === 'percent' ? (subtotal * (data.tax || 0)) / 100 : data.tax || 0,
                    data.currency
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-semibold">{formatCurrency(data.totalPaid || 0, data.currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Amount Due</span>
              <span>{formatCurrency(amountDue, data.currency)}</span>
            </div>
          </div>
        </div>

        {data.notes && (
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground">Notes / Terms</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{data.notes}</p>
          </div>
        )}
      </div>
    </CardContent>
  );

  return (
    <Card className="border-0 shadow-lg ring-1 ring-black/5">
      <CardHeader className="flex-row items-center justify-between no-print bg-background/60 backdrop-blur rounded-t-xl">
        <CardTitle className="text-lg font-semibold">Live Invoice Preview</CardTitle>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          {generatedHtml && (
            <Button variant="outline" size="sm" onClick={downloadHtml}>
              <Download className="mr-2 h-4 w-4" /> HTML
            </Button>
          )}
        </div>
      </CardHeader>
      <div className="h-[70vh] overflow-auto rounded-b-xl bg-muted/40 invoice-print-area">
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
