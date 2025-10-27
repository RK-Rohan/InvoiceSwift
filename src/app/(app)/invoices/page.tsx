
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, Edit, Trash2, MoreHorizontal, Copy } from 'lucide-react';
import { type InvoiceWithId, type CompanyProfile } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import DeleteInvoiceDialog from '@/components/invoice/delete-invoice-dialog';
import AddPaymentDialog from '@/components/invoice/add-payment-dialog';
import Link from 'next/link';
import { duplicateInvoice } from '@/lib/firebase/invoices';
import { useToast } from '@/hooks/use-toast';

export default function InvoicesPage() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithId | null>(null);
  const { toast } = useToast();

  const firestore = useFirestore();
  const { user } = useUser();

  const invoicesCollection = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'invoices') : null),
    [user, firestore]
  );
  
  const invoicesQuery = useMemoFirebase(
      () => (invoicesCollection ? query(invoicesCollection, orderBy('issueDate', 'desc')) : null),
      [invoicesCollection]
  );

  const {
    data: invoices,
    isLoading,
    error,
  } = useCollection<InvoiceWithId>(invoicesQuery);

  const companyProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'profile') : null),
    [user, firestore]
  );
  const { data: companyProfile } = useDoc<CompanyProfile>(companyProfileRef);

  const handleAction = (invoice: InvoiceWithId, action: 'edit' | 'delete' | 'payment' | 'duplicate') => {
    setSelectedInvoice(invoice);
    if (action === 'delete') {
      setIsDeleteDialogOpen(true);
    } else if (action === 'payment') {
      setIsPaymentDialogOpen(true);
    } else if (action === 'duplicate') {
      handleDuplicateInvoice(invoice);
    }
  };

  const handleDuplicateInvoice = async (invoice: InvoiceWithId) => {
    try {
      await duplicateInvoice(invoice);
      toast({
        title: "Invoice Duplicated",
        description: `A new draft has been created from invoice #${invoice.invoiceNumber}.`
      });
    } catch (error) {
      console.error("Failed to duplicate invoice:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Could not duplicate the invoice.",
      });
    }
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedInvoice(null);
  };
  
  const closePaymentDialog = () => {
    setIsPaymentDialogOpen(false);
    setSelectedInvoice(null);
  }

  const calculateSubtotal = (invoice: InvoiceWithId) => {
    return invoice.items.reduce((acc, item) => {
      let itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      if (item.customFields && invoice.customColumns) {
        item.customFields.forEach(field => {
          const column = invoice.customColumns?.find(c => c.name === field.name);
          const value = parseFloat(field.value) || 0;
          if (column?.type === 'subtractive') itemTotal -= value;
          else if (column?.type === 'additive') itemTotal += value;
        });
      }
      return acc + itemTotal;
    }, 0);
  };

  const getStatus = (amountDue: number, invoice: InvoiceWithId) => {
    if (amountDue <= 0) {
      return <Badge variant="default" className="bg-accent text-accent-foreground">Paid</Badge>;
    }
    if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoices</CardTitle>
          <Button asChild size="sm">
            <Link href="/invoices/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading invoices...</p>}
          {error && <p className="text-destructive">Error: {error.message}</p>}
          {!isLoading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices && invoices.length > 0 ? (
                  invoices.map(invoice => {
                    const subtotal = calculateSubtotal(invoice);
                    const totalAmount = subtotal - (invoice.discount || 0);
                    const amountDue = totalAmount - (invoice.totalPaid || 0);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.clientName}</TableCell>
                        <TableCell>{invoice.issueDate ? format(new Date(invoice.issueDate), 'PPP') : ''}</TableCell>
                        <TableCell>{formatCurrency(totalAmount, invoice.currency)}</TableCell>
                        <TableCell>{formatCurrency(invoice.totalPaid || 0, invoice.currency)}</TableCell>
                        <TableCell>{formatCurrency(amountDue, invoice.currency)}</TableCell>
                        <TableCell>{getStatus(amountDue, invoice)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/invoices/${invoice.id}/edit`} className="flex items-center">
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </Link>
                              </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleAction(invoice, 'duplicate')} className="flex items-center">
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(invoice, 'payment')}>
                                Add Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleAction(invoice, 'delete')}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {selectedInvoice && (
        <DeleteInvoiceDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          invoice={selectedInvoice}
        />
      )}
      {selectedInvoice && (
        <AddPaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={closePaymentDialog}
          invoice={selectedInvoice}
        />
      )}
    </>
  );
}
