
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Trash2, X, Eye, EyeOff, Pencil } from 'lucide-react';
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
import { useCollection, useDoc } from '@/firebase';
import { useUser } from '@/auth';
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
import { Skeleton } from '../ui/skeleton';
import ClientForm from '@/components/clients/client-form';

type InvoiceFormProps = {
  params?: { id: string } | Promise<{ id: string }>;
};

export default function InvoiceForm({ params }: InvoiceFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const [invoiceId, setInvoiceId] = useState<string | undefined>(params?.id);
  const mountedRef = useRef(false);
  const [clientsVersion, setClientsVersion] = useState(0);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'text' | 'subtractive' | 'additive'>('text');
  const [newColumnPosition, setNewColumnPosition] = useState<'after' | 'before'>('after');
  const [referenceColumn, setReferenceColumn] = useState<string>('');
  const [showQtyInPreview, setShowQtyInPreview] = useState(true);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [showDiscountLine, setShowDiscountLine] = useState(true);
  const [discountLabel, setDiscountLabel] = useState('Discount');
  const [showTaxLine, setShowTaxLine] = useState(true);
  const [taxLabel, setTaxLabel] = useState('VAT / Tax');
  const [columnLabels, setColumnLabels] = useState<{ [key: string]: string }>({
    Description: 'Description',
    Qty: 'Qty',
    Price: 'Price',
  });

  // Handle resolving params promise without direct property access
  useEffect(() => {
    let cancelled = false;
    const resolveParams = async () => {
      if (!params) return;
      try {
        const resolved = typeof (params as any).then === 'function' ? await params : params;
        if (!cancelled && resolved?.id) {
          setInvoiceId(resolved.id);
        }
      } catch (e) {
        console.error('Failed to resolve params', e);
      }
    };
    resolveParams();
    return () => {
      cancelled = true;
    };
  }, [params]);


  const invoiceEndpoint = useMemo(
    () => (invoiceId && user ? `/api/invoices/${invoiceId}` : null),
    [invoiceId, user]
  );
  const { data: invoice, isLoading: isInvoiceLoading } = useDoc<InvoiceWithId>(invoiceEndpoint);

  const { data: clients } = useCollection<Client>(user ? `/api/clients?v=${clientsVersion}` : null);

  const { data: companyProfile } = useDoc<CompanyProfile>(user ? '/api/company-profile' : null);

  const defaultInvoiceValues: InvoiceFormData = {
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientPhoneNumber: '',
    clientAddress: '',
    status: 'Final',
    invoiceNumber: '',
    issueDate: new Date(0),
    dueDate: new Date(0),
    items: [{ description: '', quantity: 1, unitPrice: 0, customFields: [] }],
    notes: 'Thank you for your business.',
    customColumns: [],
    currency: 'USD',
    discount: 0,
    discountType: 'fixed',
    tax: 0,
    totalPaid: 0,
  };

  const buildDefaultInvoice = (): InvoiceFormData => {
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 3);
    return {
      clientId: '',
      clientName: '',
      clientEmail: '',
      clientPhoneNumber: '',
      clientAddress: '',
      status: 'Final',
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      issueDate: now,
      dueDate: due,
      items: [{ description: '', quantity: 1, unitPrice: 0, customFields: [] }],
      notes: 'Thank you for your business.',
      customColumns: [],
      currency: 'BDT',
      discount: 0,
      discountType: 'fixed',
      tax: 0,
      totalPaid: 0,
    };
  };

  const methods = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: defaultInvoiceValues,
  });

  const { control, formState, reset, handleSubmit, setValue, getValues } = methods;
  const selectClientById = (id: string) => {
    const selectedClient = clients?.find(c => c.id === id);
    if (selectedClient) {
      setValue('clientId', selectedClient.id);
      setValue('clientName', selectedClient.name);
      setValue('clientEmail', selectedClient.email);
      setValue('clientPhoneNumber', selectedClient.phoneNumber);
      setValue('clientAddress', selectedClient.address);
    }
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  const watchedItems = useWatch({ control, name: 'items' }) || [];
  const customColumns = useWatch({ control, name: 'customColumns' }) || [];
  const currency = useWatch({ control, name: 'currency' });
  const discount = Number(useWatch({ control, name: 'discount' }) || 0);
  const discountType = useWatch({ control, name: 'discountType' }) || 'fixed';
  const tax = Number(useWatch({ control, name: 'tax' }) || 0);
  const taxType = useWatch({ control, name: 'taxType' }) || 'fixed';
  const totalPaid = Number(useWatch({ control, name: 'totalPaid' }) || 0);
  const watchedClientId = useWatch({ control, name: 'clientId' });
  
  const defaultColumns = ['Description', 'Qty', 'Price'];
  const orderedColumns = useMemo(() => {
    const cols = [...defaultColumns];
    customColumns.forEach((col) => {
      const anchorIndex = col.anchor ? cols.indexOf(col.anchor) : -1;
      if (anchorIndex !== -1) {
        const insertAt = col.position === 'before' ? anchorIndex : anchorIndex + 1;
        cols.splice(insertAt, 0, col.name);
      } else {
        cols.push(col.name);
      }
    });
    return cols;
  }, [customColumns]);

  const calculateLineItemTotal = (item: any) => {
    if (!item) return 0;
    let total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    const formCustomColumns = getValues('customColumns') || [];
    item.customFields?.forEach((field: any) => {
      const column = formCustomColumns.find(c => c.name === field.name);
      const value = parseFloat(field.value) || 0;
      if (column?.type === 'subtractive') {
        total -= value;
      } else if (column?.type === 'additive') {
        total += value;
      }
    });
    return total;
  };

  const calculateSubtotal = (invoiceData: Partial<InvoiceFormData>): number => {
    if (!invoiceData.items) return 0;
    return invoiceData.items.reduce((acc, item) => {
      let itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      if (item.customFields && invoiceData.customColumns) {
        item.customFields.forEach(field => {
          const column = invoiceData.customColumns?.find(c => c.name === field.name);
          const value = parseFloat(field.value) || 0;
          if (column?.type === 'subtractive') {
            itemTotal -= value;
          } else if (column?.type === 'additive') {
            itemTotal += value;
          }
        });
      }
      return acc + itemTotal;
    }, 0);
  };

  useEffect(() => {
    if (invoice && !isInvoiceLoading) {
      const invoiceData = {
        ...invoice,
        issueDate: invoice.issueDate ? new Date(invoice.issueDate) : new Date(),
        dueDate: invoice.dueDate ? new Date(invoice.dueDate) : new Date(),
        items: (invoice.items || []).map(item => ({...item, customFields: item.customFields || [] })),
        customColumns: invoice.customColumns || [],
        currency: invoice.currency || 'USD',
        discount: invoice.discount || 0,
        discountType: invoice.discountType || 'fixed',
        tax: invoice.tax || 0,
        taxType: invoice.taxType || 'fixed',
        totalPaid: invoice.totalPaid || 0,
      };
      reset(invoiceData);
    }
  }, [invoice, isInvoiceLoading, reset]);
  
  useEffect(() => {
      if (!invoiceId && !isInvoiceLoading) {
        reset(buildDefaultInvoice());
      }
  }, [invoiceId, isInvoiceLoading, reset]);
  
  const subtotal = useMemo(() => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((acc, item) => acc + calculateLineItemTotal(item), 0)
  }, [watchedItems, customColumns]);

  const discountAmount = useMemo(
    () => (discountType === 'percent' ? (subtotal * discount) / 100 : discount),
    [discountType, discount, subtotal]
  );
  const taxAmount = useMemo(
    () => (taxType === 'percent' ? (subtotal * tax) / 100 : tax),
    [taxType, tax, subtotal]
  );

  const amountDue = useMemo(
    () => subtotal + taxAmount - discountAmount - totalPaid,
    [subtotal, taxAmount, discountAmount, totalPaid]
  );

  const allColumns = orderedColumns;

  const handleEditLabel = (key: string) => {
    const current = columnLabels[key] || key;
    const updated = typeof window !== 'undefined' ? window.prompt('Edit column label', current) : null;
    if (updated && updated.trim()) {
      setColumnLabels((prev) => ({ ...prev, [key]: updated.trim() }));
    }
  };

  const handleEditDiscountLabel = () => {
    const updated = typeof window !== 'undefined' ? window.prompt('Edit discount label', discountLabel) : null;
    if (updated && updated.trim()) {
      setDiscountLabel(updated.trim());
    }
  };

  const handleEditTaxLabel = () => {
    const updated = typeof window !== 'undefined' ? window.prompt('Edit tax label', taxLabel) : null;
    if (updated && updated.trim()) {
      setTaxLabel(updated.trim());
    }
  };

  useEffect(() => {
    if (isColumnDialogOpen) {
      setReferenceColumn(allColumns[allColumns.length - 1]);
    }
  }, [isColumnDialogOpen, allColumns]);

  const handleAddColumn = () => {
    if (!newColumnName || customColumns.find(c => c.name === newColumnName)) return;
    const currentCustomColumns = getValues('customColumns') || [];
    const newColumn: CustomColumn = { name: newColumnName, type: newColumnType, position: newColumnPosition, anchor: referenceColumn };
    const newCustomColumns = [...currentCustomColumns, newColumn];
    setValue('customColumns', newCustomColumns);

    const currentItems = getValues('items');
    const updatedItems = currentItems.map(item => {
      const newCustomFields = [...(item.customFields || [])];
      newCustomFields.push({ name: newColumnName, value: '' });
      return { ...item, customFields: newCustomFields };
    });
    setValue('items', updatedItems);

    setNewColumnName('');
    setReferenceColumn('');
    setNewColumnPosition('after');
    setNewColumnType('text');
    setIsColumnDialogOpen(false);
  };

  const handleRemoveColumn = (columnNameToRemove: string) => {
    const customColumnIndex = (getValues('customColumns') || []).findIndex(c => c.name === columnNameToRemove);
    if(customColumnIndex === -1) return;

    const newCustomColumns = (getValues('customColumns') || []).filter(col => col.name !== columnNameToRemove);
    setValue('customColumns', newCustomColumns);

    const currentItems = getValues('items');
    const updatedItems = currentItems.map(item => {
        const newCustomFields = [...(item.customFields || [])];
        newCustomFields.splice(customColumnIndex, 1);
        return { ...item, customFields: newCustomFields };
    });
    setValue('items', updatedItems);
  };
  
  const onSubmit = async (values: InvoiceFormData) => {
    try {
        const subtotalVal = calculateSubtotal(values);
        const discountAmount = values.discountType === 'percent'
          ? (subtotalVal * (values.discount || 0)) / 100
          : (values.discount || 0);
        const taxAmount = values.taxType === 'percent'
          ? (subtotalVal * (values.tax || 0)) / 100
          : (values.tax || 0);
        const totalAmount = subtotalVal + taxAmount - discountAmount;

        const invoiceData = {
            ...values,
            totalAmount,
            items: values.items.map(item => ({
              ...item,
              customFields: (item.customFields || []).map(cf => ({...cf}))
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

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    reset(buildDefaultInvoice());
  }, [reset]);

  if (isInvoiceLoading && invoiceId) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-[600px] w-full" />
            <Skeleton className="h-[70vh] w-full" />
        </div>
    );
  }

  if (invoiceId && !invoice && !isInvoiceLoading) {
    return <p>Invoice not found.</p>;
  }

  if (!mountedRef.current) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-[600px] w-full" />
        <Skeleton className="h-[70vh] w-full" />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
        <div className="space-y-8">
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
                                <div className="flex items-center gap-2">
                                    <Select 
                                        key={watchedClientId || 'select-client'}
                                        onValueChange={(value) => {
                                            const selectedClient = clients?.find(c => c.id === value);
                                            field.onChange(value);
                                            if (selectedClient) {
                                                setValue('clientName', selectedClient.name);
                                                setValue('clientEmail', selectedClient.email);
                                                setValue('clientPhoneNumber', selectedClient.phoneNumber);
                                                setValue('clientAddress', selectedClient.address);
                                            }
                                        }} 
                                        value={field.value}
                                        defaultValue={field.value}
                                    >
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
                                    <Button type="button" variant="outline" size="icon" onClick={() => setIsClientFormOpen(true)}>
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
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
                            <FormField
                              control={control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Draft">Draft</SelectItem>
                                      <SelectItem value="Quotation">Quotation</SelectItem>
                                      <SelectItem value="Final">Final</SelectItem>
                                    </SelectContent>
                                  </Select>
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
                        <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-md">
                            <table className="w-full mt-2 text-sm">
                                <thead className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 text-slate-800">
                                    <tr className="text-xs font-semibold tracking-wide">
                                        {orderedColumns.map((colName) => {
                                          if (colName === 'Description') {
                                            return (
                                              <th key={colName} className="px-4 py-3 text-left w-1/3">
                                                <div className="flex items-center gap-2">
                                                  {columnLabels.Description}
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-500 hover:text-primary"
                                                    onClick={() => handleEditLabel('Description')}
                                                  >
                                                    <Pencil className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </th>
                                            );
                                          }
                                          if (colName === 'Qty') {
                                            return (
                                              <th key={colName} className="px-4 py-3 text-left">
                                                <div className="flex items-center gap-1">
                                                  {columnLabels.Qty}
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 text-slate-500 hover:text-primary"
                                                    onClick={() => setShowQtyInPreview(!showQtyInPreview)}
                                                  >
                                                    {showQtyInPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                  </Button>
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-500 hover:text-primary"
                                                    onClick={() => handleEditLabel('Qty')}
                                                  >
                                                    <Pencil className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </th>
                                            );
                                          }
                                          if (colName === 'Price') {
                                            return (
                                              <th key={colName} className="px-4 py-3 text-left">
                                                <div className="flex items-center gap-2">
                                                  {columnLabels.Price}
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-500 hover:text-primary"
                                                    onClick={() => handleEditLabel('Price')}
                                                  >
                                                    <Pencil className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </th>
                                            );
                                          }
                                          return (
                                            <th key={colName} className="px-4 py-3 text-left">
                                              <div className="flex items-center gap-1">
                                                {colName}
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-5 w-5 text-slate-500 hover:text-destructive"
                                                  onClick={() => handleRemoveColumn(colName)}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </th>
                                          );
                                        })}
                                        <th className="px-4 py-3 text-right">Total</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                {fields.map((field, index) => {
                                  const item = watchedItems[index];
                                  return (
                                    <tr key={field.id} className="items-start odd:bg-white even:bg-slate-50 transition-colors hover:bg-primary/5 last:border-b-0">
                                        {orderedColumns.map((colName) => {
                                          if (colName === 'Description') {
                                            return (
                                              <td key={`${field.id}-desc`} className="px-4 py-3 align-top">
                                                <FormField
                                                  control={control}
                                                  name={`items.${index}.description`}
                                                  render={({ field }) => (
                                                    <FormItem>
                                                      <FormControl>
                                                        <Input
                                                          placeholder="Item description"
                                                          {...field}
                                                          className="rounded-lg bg-white focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:border-primary/70"
                                                        />
                                                      </FormControl>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                              </td>
                                            );
                                          }
                                          if (colName === 'Qty') {
                                            return (
                                              <td key={`${field.id}-qty`} className="px-4 py-3 align-top">
                                                <FormField
                                                  control={control}
                                                  name={`items.${index}.quantity`}
                                                  render={({ field }) => (
                                                    <FormItem>
                                                      <FormControl>
                                                        <Input
                                                          type="number"
                                                          placeholder="Qty"
                                                          {...field}
                                                          className="rounded-lg bg-white text-right focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:border-primary/70"
                                                        />
                                                      </FormControl>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                              </td>
                                            );
                                          }
                                          if (colName === 'Price') {
                                            return (
                                              <td key={`${field.id}-price`} className="px-4 py-3 align-top">
                                                <FormField
                                                  control={control}
                                                  name={`items.${index}.unitPrice`}
                                                  render={({ field }) => (
                                                    <FormItem>
                                                      <FormControl>
                                                        <Input
                                                          type="number"
                                                          placeholder="Price"
                                                          {...field}
                                                          className="rounded-lg bg-white text-right focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:border-primary/70"
                                                        />
                                                      </FormControl>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                              </td>
                                            );
                                          }
                                          const colMeta = customColumns.find(c => c.name === colName);
                                          const customFieldIndex = (item.customFields || []).findIndex(cf => cf.name === colName);
                                          const fieldName = `items.${index}.customFields.${customFieldIndex}.value`;
                                          const nameFieldName = `items.${index}.customFields.${customFieldIndex}.name`;
                                          return (
                                            <td key={`${field.id}-${colName}`} className="px-4 py-3 align-top">
                                              <input type="hidden" {...methods.register(nameFieldName as any)} value={colName} />
                                              <Input
                                                placeholder={colName}
                                                type={colMeta?.type === 'text' ? 'text' : 'number'}
                                                {...methods.register(fieldName as any)}
                                                className="rounded-lg bg-white focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:border-primary/70"
                                              />
                                            </td>
                                          );
                                        })}
                                        <td className="text-right px-4 py-3 font-semibold align-top text-foreground">
                                            {formatCurrency(calculateLineItemTotal(item), currency)}
                                        </td>
                                        <td className='align-top px-4 py-3 text-right'>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive bg-destructive/10 hover:bg-destructive/20"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        </td>
                                    </tr>
                                  )
                                })}
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

                        <div className="flex justify-end">
                            <div className="w-full max-w-sm space-y-4">
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <span className="font-medium text-right">Subtotal</span>
                                    <span className="text-right font-medium">{formatCurrency(subtotal, currency)}</span>
                                </div>
                                <FormField
                                  control={control}
                                  name="discount"
                                  render={({ field }) => (
                                    <FormItem className="grid grid-cols-2 items-center gap-4">
                                      <div className="flex items-center justify-end gap-2">
                                        <span className="text-right">{discountLabel}</span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                                          onClick={() => setShowDiscountLine((prev) => !prev)}
                                        >
                                          {showDiscountLine ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                                          onClick={handleEditDiscountLabel}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      {showDiscountLine ? (
                                        <div className="flex flex-col items-end gap-1">
                                          <div className="flex items-center justify-end gap-2 w-full">
                                            <FormControl className="w-full">
                                              <Input type="number" placeholder="0.00" {...field} className="text-right" />
                                            </FormControl>
                                            <Select
                                              value={discountType}
                                            onValueChange={(val) => setValue('discountType', val as 'fixed' | 'percent')}
                                          >
                                            <SelectTrigger className="w-28">
                                              <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="fixed">Fixed</SelectItem>
                                                <SelectItem value="percent">%</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <span className="text-xs text-muted-foreground">
                                            {discountType === 'percent'
                                              ? `-${formatCurrency(discountAmount, currency)} (${discount || 0}%)`
                                              : `-${formatCurrency(discountAmount, currency)}`}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="text-right text-sm text-muted-foreground">Hidden</div>
                                      )}
                                      <FormMessage className="col-span-2" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={control}
                                  name="tax"
                                  render={({ field }) => (
                                    <FormItem className="grid grid-cols-2 items-center gap-4">
                                      <div className="flex items-center justify-end gap-2">
                                        <span className="text-right">{taxLabel}</span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                                          onClick={() => setShowTaxLine((prev) => !prev)}
                                        >
                                          {showTaxLine ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                                          onClick={handleEditTaxLabel}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      {showTaxLine ? (
                                        <div className="flex flex-col items-end gap-1">
                                          <div className="flex items-center justify-end gap-2 w-full">
                                            <FormControl className="w-full">
                                              <Input
                                                type="number"
                                                placeholder="0.00"
                                                {...field}
                                                className="text-right"
                                              />
                                            </FormControl>
                                            <Select
                                              value={taxType}
                                              onValueChange={(val) => setValue('taxType', val as 'fixed' | 'percent')}
                                            >
                                            <SelectTrigger className="w-28">
                                              <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="fixed">Fixed</SelectItem>
                                                <SelectItem value="percent">%</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <span className="text-xs text-muted-foreground">
                                            {taxType === 'percent'
                                              ? `${formatCurrency(taxAmount, currency)} (${tax || 0}%)`
                                              : formatCurrency(taxAmount, currency)}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="text-right text-sm text-muted-foreground">Hidden</div>
                                      )}
                                      <FormMessage className="col-span-2" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={control}
                                  name="totalPaid"
                                  render={({ field }) => (
                                    <FormItem className="grid grid-cols-2 items-center gap-4">
                                      <FormLabel className="text-right">Total Paid</FormLabel>
                                      <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} className="text-right" />
                                      </FormControl>
                                      <FormMessage className="col-span-2" />
                                    </FormItem>
                                  )}
                                />
                                <div className="grid grid-cols-2 items-center gap-4 font-bold text-lg">
                                    <span className="text-right">Amount Due</span>
                                    <span className="text-right">{formatCurrency(amountDue, currency)}</span>
                                </div>
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
            <InvoicePreview
              generatedHtml={generatedHtml}
              companyProfile={companyProfile}
              showQty={showQtyInPreview}
              orderedColumns={orderedColumns}
              columnLabels={columnLabels}
              showDiscountLine={showDiscountLine}
              discountLabel={discountLabel}
              showTaxLine={showTaxLine}
              taxLabel={taxLabel}
            />
        </div>
        <ClientForm 
            isOpen={isClientFormOpen}
            onClose={() => setIsClientFormOpen(false)}
            onSaved={() => setClientsVersion(v => v + 1)}
            onSavedId={(id) => {
              setClientsVersion(v => v + 1);
              selectClientById(id);
            }}
            client={null}
        />
    </FormProvider>
  );
}
