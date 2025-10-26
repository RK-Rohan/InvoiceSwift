

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { type InvoiceFormData, type InvoiceWithId, invoiceFormSchema, type Client, type CompanyProfile, type CustomColumn } from '@/lib/types';
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
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

type InvoiceFormProps = {
  invoice?: InvoiceWithId | null;
};

export default function InvoiceForm({ invoice }: InvoiceFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'text' | 'subtractive' | 'additive'>('text');
  const [newColumnPosition, setNewColumnPosition] = useState<'before' | 'after'>('after');
  const [referenceColumn, setReferenceColumn] = useState<string>('');


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
      items: [{ description: '', quantity: 1, unitPrice: 0, customFields: [] }],
      notes: '',
      customColumns: [],
      currency: 'USD',
    },
  });

  const { control, formState, watch, reset, handleSubmit, setValue, getValues } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  const watchedItems = watch('items');
  const customColumns = watch('customColumns') || [];
  const currency = watch('currency');
  
  const allColumns = useMemo(() => ['Description', 'Qty', 'Price', ...customColumns.map(c => c.name)], [customColumns]);

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

  const subtotal = useMemo(() => watchedItems.reduce((acc, item) => acc + calculateLineItemTotal(item), 0), [watchedItems, customColumns]);

  useEffect(() => {
    if (invoice) {
      reset({
        ...invoice,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        items: invoice.items.map(item => ({...item, customFields: item.customFields || [] })),
        customColumns: invoice.customColumns || [],
        currency: invoice.currency || 'USD',
      });
    } else {
      reset({
        clientId: '',
        clientName: '',
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        issueDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        items: [{ description: '', quantity: 1, unitPrice: 0, customFields: [] }],
        notes: 'Thank you for your business.',
        customColumns: [],
        currency: 'USD',
      });
    }
  }, [invoice, reset]);

   useEffect(() => {
    if (isColumnDialogOpen) {
      setReferenceColumn(allColumns[allColumns.length - 1]);
    }
  }, [isColumnDialogOpen, allColumns]);

  const handleAddColumn = () => {
    if (newColumnName && !customColumns.find(c => c.name === newColumnName)) {
      const currentCustomColumns = getValues('customColumns') || [];
      const newColumn: CustomColumn = { name: newColumnName, type: newColumnType };

      let insertIndex = currentCustomColumns.length;

      if (referenceColumn) {
          const isDefaultColumn = ['Description', 'Qty', 'Price'].includes(referenceColumn);
          const refIndex = isDefaultColumn 
            ? allColumns.indexOf(referenceColumn)
            : currentCustomColumns.findIndex(c => c.name === referenceColumn);

          if (newColumnPosition === 'before') {
              insertIndex = isDefaultColumn ? 0 : refIndex;
          } else { // 'after'
              insertIndex = isDefaultColumn ? refIndex - 2 : refIndex + 1;
          }
      }


      const newCustomColumns = [...currentCustomColumns];
      newCustomColumns.splice(insertIndex, 0, newColumn);
      setValue('customColumns', newCustomColumns);

      const currentItems = getValues('items');
      const updatedItems = currentItems.map(item => {
          const newCustomFields = [...(item.customFields || [])];
          newCustomFields.splice(insertIndex, 0, { name: newColumnName, value: '' });
          return { ...item, customFields: newCustomFields };
      });
      setValue('items', updatedItems);

      setNewColumnName('');
      setReferenceColumn('');
      setNewColumnPosition('after');
      setNewColumnType('text');
      setIsColumnDialogOpen(false);
    }
  };

  const handleRemoveColumn = (columnNameToRemove: string) => {
    // Remove the column from the customColumns array
    const newCustomColumns = customColumns.filter(col => col.name !== columnNameToRemove);
    setValue('customColumns', newCustomColumns);

    // Remove the corresponding custom field from each item
    const currentItems = getValues('items');
    const updatedItems = currentItems.map(item => ({
      ...item,
      customFields: (item.customFields || []).filter(field => field.name !== columnNameToRemove)
    }));
    setValue('items', updatedItems);
  };

  const onSubmit = async (values: InvoiceFormData) => {
    try {
        const invoiceData = {
            ...values,
            totalAmount: subtotal,
            items: values.items.map(item => ({
              ...item,
              customFields: (item.customFields || []).map(cf => ({...cf})) // Ensure it's a plain object
            }))
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              name="currency"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Currency</FormLabel>
                                  <FormControl>
                                    <Input placeholder="USD" {...field} />
                                  </FormControl>
                                   <FormDescription>
                                    3-letter currency code (e.g., USD, BDT).
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <div className="overflow-x-auto">
                            <table className="w-full mt-2">
                                <thead>
                                    <tr>
                                        <th className="px-2 py-2 text-left w-1/3">Description</th>
                                        <th className="px-2 py-2 text-left">Qty</th>
                                        <th className="px-2 py-2 text-left">Price</th>
                                        {customColumns.map(col => (
                                            <th key={col.name} className="px-2 py-2 text-left">
                                                <div className="flex items-center gap-1">
                                                    {col.name}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 text-destructive/70 hover:text-destructive"
                                                        onClick={() => handleRemoveColumn(col.name)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-2 py-2 text-right">Total</th>
                                        <th className="px-2 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {fields.map((field, index) => (
                                <tr key={field.id} className="items-start">
                                    <td>
                                    <FormField
                                        control={control}
                                        name={`items.${index}.description`}
                                        render={({ field }) => ( <FormItem><FormControl><Input placeholder="Item description" {...field} /></FormControl><FormMessage /></FormItem> )}
                                    />
                                    </td>
                                    <td>
                                    <FormField
                                        control={control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => ( <FormItem><FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl><FormMessage /></FormItem> )}
                                    />
                                    </td>
                                    <td>
                                    <FormField
                                        control={control}
                                        name={`items.${index}.unitPrice`}
                                        render={({ field }) => ( <FormItem><FormControl><Input type="number" placeholder="Price" {...field} /></FormControl><FormMessage /></FormItem> )}
                                    />
                                    </td>
                                    {customColumns.map((col, colIndex) => {
                                      const fieldName = `items.${index}.customFields.${colIndex}.value`;
                                      return (
                                        <td key={col.name}>
                                            <FormField
                                                control={control}
                                                name={`items.${index}.customFields`}
                                                render={() => (
                                                    <Input
                                                        placeholder={col.name}
                                                        type={col.type === 'text' ? 'text' : 'number'}
                                                        {...methods.register(fieldName as any)}
                                                    />
                                                )}
                                            />
                                        </td>
                                      )
                                    })}
                                    <td className="text-right py-2 font-medium align-top">
                                        {formatCurrency(calculateLineItemTotal(watchedItems[index]), currency)}
                                    </td>
                                    <td className='align-top'>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    </td>
                                </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                            {formState.errors.items && (
                                <p className="text-sm font-medium text-destructive mt-2">
                                    {typeof formState.errors.items.message === 'string' ? formState.errors.items.message : 'Please add at least one item.'}
                                </p>
                            )}
                        <div className="mt-2 space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ description: '', quantity: 1, unitPrice: 0, customFields: customColumns.map(c => ({name: c.name, value: ''})) })}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                             <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="sm">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Column
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Custom Column</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="new-column-name">Column Name</Label>
                                            <Input 
                                                id="new-column-name"
                                                placeholder="e.g. Discount"
                                                value={newColumnName}
                                                onChange={(e) => setNewColumnName(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                          <Label>Behavior</Label>
                                          <RadioGroup
                                              value={newColumnType}
                                              onValueChange={(value: 'text' | 'subtractive' | 'additive') => setNewColumnType(value)}
                                              className="flex space-x-4"
                                          >
                                              <div className="flex items-center space-x-2">
                                                  <RadioGroupItem value="text" id="type-text" />
                                                  <Label htmlFor="type-text">Text</Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                  <RadioGroupItem value="subtractive" id="type-sub" />
                                                  <Label htmlFor="type-sub">Subtract from Total</Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                  <RadioGroupItem value="additive" id="type-add" />
                                                  <Label htmlFor="type-add">Add to Total</Label>
                                              </div>
                                          </RadioGroup>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Position</Label>
                                            <RadioGroup 
                                              value={newColumnPosition} 
                                              onValueChange={(value: 'before' | 'after') => setNewColumnPosition(value)} 
                                              className="flex space-x-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="before" id="pos-before" />
                                                    <Label htmlFor="pos-before">Before</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="after" id="pos-after" />
                                                    <Label htmlFor="pos-after">After</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="reference-column">Reference Column</Label>
                                              <Select onValueChange={setReferenceColumn} value={referenceColumn}>
                                                  <SelectTrigger id="reference-column">
                                                      <SelectValue placeholder="Select a column" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                      {allColumns.map(col => (
                                                          <SelectItem key={col} value={col}>{col}</SelectItem>
                                                      ))}
                                                  </SelectContent>
                                              </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                                        <Button type="button" onClick={handleAddColumn} disabled={!newColumnName || !referenceColumn}>Add Column</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
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
                            Total: {formatCurrency(subtotal, currency)}
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
