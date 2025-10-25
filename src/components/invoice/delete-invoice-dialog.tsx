'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteInvoice } from '@/lib/firebase/invoices';
import { type InvoiceWithId } from '@/lib/types';

type DeleteInvoiceDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceWithId;
};

export default function DeleteInvoiceDialog({
  isOpen,
  onClose,
  invoice,
}: DeleteInvoiceDialogProps) {
  const { toast } = useToast();

  const handleDelete = () => {
    deleteInvoice(invoice.id);
    toast({ title: 'Invoice deleted successfully' });
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete invoice
            "{invoice.invoiceNumber}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
