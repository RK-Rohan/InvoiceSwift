'use client';

import { useMemo, useState } from 'react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { type InvoiceWithId } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import InvoiceForm from '@/components/invoice/invoice-form';
import DeleteInvoiceDialog from '@/components/invoice/delete-invoice-dialog';

export default function InvoicesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithId | null>(null);

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

  const handleAddInvoice = () => {
    setSelectedInvoice(null);
    setIsFormOpen(true);
  };

  const handleEditInvoice = (invoice: InvoiceWithId) => {
    setSelectedInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleDeleteInvoice = (invoice: InvoiceWithId) => {
    setSelectedInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedInvoice(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedInvoice(null);
  };

  const getStatus = (invoice: InvoiceWithId) => {
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
          <Button onClick={handleAddInvoice} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Invoice
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
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices && invoices.length > 0 ? (
                  invoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{invoice.issueDate ? format(new Date(invoice.issueDate), 'PPP') : ''}</TableCell>
                      <TableCell>{invoice.dueDate ? format(new Date(invoice.dueDate), 'PPP') : ''}</TableCell>
                      <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell>{getStatus(invoice)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditInvoice(invoice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteInvoice(invoice)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InvoiceForm
        isOpen={isFormOpen}
        onClose={closeForm}
        invoice={selectedInvoice}
      />
      
      {selectedInvoice && (
        <DeleteInvoiceDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          invoice={selectedInvoice}
        />
      )}
    </>
  );
}
