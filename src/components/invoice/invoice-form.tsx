
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { type InvoiceFormData, type InvoiceWithId, invoiceFormSchema, type Client, type CompanyProfile } from '@/lib/types';
import { addInvoice, updateInvoice } from '@/lib/firebase/invoices';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import InvoicePreview from './invoice-preview';

type InvoiceFormProps = {
  invoice: InvoiceWithId | null;
};

export default function InvoiceForm({ invoice }: InvoiceFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  const clientsCollection = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'clients') : null),
    [user, firestore]
  );
  const { data: clients } = useCollection<Client>(clientsCollection);

  const companyProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'profile') : null),
    [user, firestore]
  );
  const { data: companyProfile } = useDoc<CompanyProfile>(companyProfileRef);

  const methods = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: '',
      clientName: '',
      invoiceNumber: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      notes: '',
    },
  });

  const { control, formState, watch, reset, handleSubmit, setValue } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  const watchedItems = watch('items');
  const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);

  useEffect(() => {
    if (invoice) {
      reset({
        ...invoice,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        items: invoice.items.map(item => ({...item}))
      });
    } else {
      reset({
        clientId: '',
        clientName: '',
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        issueDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
        notes: 'Thank you for your business.',
      });
    }
  }, [invoice, reset]);

  const onSubmit = async (values: InvoiceFormData) => {
    try {
        const invoiceData = {
            ...values,
            totalAmount: subtotal
        }
      if (invoice) {
        await updateInvoice(invoice.id, invoiceData);
        toast({ title: 'Invoice updated successfully' });
      } else {
        await addInvoice(invoiceData);
        toast({ title: 'Invoice added successfully' });
      }
      router.push('/invoices');
    } catch (error: any) {
      if (error.name !== 'FirebaseError') {
        console.error("Failed to save invoice:", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: error.message || "Could not save invoice.",
        });
      }
    }
  };

  return (
    <FormProvider {...methods}>
        <div className="grid grid-cols-1 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>{invoice ? 'Edit Invoice' : 'Create New Invoice'}</CardTitle>
                </CardHeader>
                <Form {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                            control={control}
                            name="clientId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Client</FormLabel>
                                <Select onValueChange={(value) => {
                                    const selectedClient = clients?.find(c => c.id === value);
                                    field.onChange(value);
                                    if (selectedClient) {
                                        setValue('clientName', selectedClient.name);
                                    }
                                }} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a client" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {clients?.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={control}
                            name="issueDate"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Issue Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Due Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        </div>

                        <div>
                        <FormLabel>Items</FormLabel>
                        <div className="space-y-2 mt-2">
                            {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                                <FormField
                                control={control}
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                    <FormItem className="col-span-6">
                                    <FormControl>
                                        <Input placeholder="Item description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                    <FormControl>
                                        <Input type="number" placeholder="Qty" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={control}
                                name={`items.${index}.unitPrice`}
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                    <FormControl>
                                        <Input type="number" placeholder="Price" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <div className="col-span-1 text-right py-2 font-medium">
                                    {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0))}
                                </div>
                                <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="col-span-1 text-destructive hover:text-destructive"
                                onClick={() => remove(index)}
                                >
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            ))}
                        </div>
                            {formState.errors.items && (
                                <p className="text-sm font-medium text-destructive mt-2">
                                    {typeof formState.errors.items.message === 'string' ? formState.errors.items.message : 'Please add at least one item.'}
                                </p>
                            )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                        </div>

                        <FormField
                        control={control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Notes / Terms</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Additional notes or payment terms." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        
                        <div className="text-right font-bold text-lg">
                            Total: {formatCurrency(subtotal)}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => router.push('/invoices')}>
                        Cancel
                        </Button>
                        <Button type="submit" disabled={formState.isSubmitting}>
                        {invoice ? 'Save Changes' : 'Create Invoice'}
                        </Button>
                    </CardFooter>
                    </form>
                </Form>
            </Card>
            <InvoicePreview generatedHtml={generatedHtml} companyProfile={companyProfile} />
        </div>
    </FormProvider>
  );
}
