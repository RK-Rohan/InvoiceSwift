
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateInvoice } from '@/lib/firebase/invoices';
import { type InvoiceWithId } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

type AddPaymentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceWithId;
};

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be a positive number.'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function AddPaymentDialog({
  isOpen,
  onClose,
  invoice,
}: AddPaymentDialogProps) {
  const { toast } = useToast();
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const handlePayment = async (values: PaymentFormData) => {
    const currentTotalPaid = invoice.totalPaid || 0;
    const newTotalPaid = currentTotalPaid + values.amount;

    try {
      await updateInvoice(invoice.id, { totalPaid: newTotalPaid });
      toast({
        title: 'Payment Added',
        description: `${formatCurrency(values.amount, invoice.currency)} has been added to invoice ${invoice.invoiceNumber}.`,
      });
      onClose();
      form.reset();
    } catch (error: any) {
        console.error("Failed to add payment:", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: error.message || "Could not add payment.",
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment for Invoice #{invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>
            Current amount due: {formatCurrency(invoice.totalAmount, invoice.currency)}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePayment)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Save Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
