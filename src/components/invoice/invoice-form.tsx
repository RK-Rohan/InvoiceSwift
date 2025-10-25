'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import ClientManager from './client-manager';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import CustomizationForm from './customization-form';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Client, Invoice } from '@/lib/types';

type InvoiceFormProps = {
  setGeneratedHtml: (html: string | null) => void;
};

export default function InvoiceForm({ setGeneratedHtml }: InvoiceFormProps) {
  const { register, control, watch, formState: { errors }, setValue } = useFormContext<Invoice>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  const [clients, setClients] = useLocalStorage<Client[]>('clients', []);

  const items = watch('items');
  const taxRate = watch('tax_rate') || 0;

  const subtotal = items.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <div className="space-y-6 pb-16">
      <Card>
        <CardHeader>
          <CardTitle>Parties</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">From</h3>
            <div className="space-y-2">
              <Label htmlFor="from_name">Name</Label>
              <Input id="from_name" {...register('from_name')} placeholder="Your Company" />
              {errors.from_name && <p className="text-sm text-destructive">{errors.from_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_address">Address</Label>
              <Textarea id="from_address" {...register('from_address')} placeholder="123 Main St, Anytown, USA" />
              {errors.from_address && <p className="text-sm text-destructive">{errors.from_address.message}</p>}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">To</h3>
              <ClientManager clients={clients} setClients={setClients} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <select
                id="client_id"
                {...register('client_id')}
                className={cn('flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50')}
                onChange={(e) => {
                  const client = clients.find(c => c.id === e.target.value);
                  if (client) {
                    setValue('client_name', client.name);
                    setValue('client_address', client.address);
                  }
                  setValue('client_id', e.target.value);
                }}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input id="client_name" {...register('client_name')} placeholder="Client Company" />
               {errors.client_name && <p className="text-sm text-destructive">{errors.client_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_address">Client Address</Label>
              <Textarea id="client_address" {...register('client_address')} placeholder="456 Oak Ave, Otherville, USA" />
               {errors.client_address && <p className="text-sm text-destructive">{errors.client_address.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="invoice_number">Invoice Number</Label>
            <Input id="invoice_number" {...register('invoice_number')} />
            {errors.invoice_number && <p className="text-sm text-destructive">{errors.invoice_number.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Issue Date</Label>
            <Controller
              name="issue_date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
              )}
            />
             {errors.issue_date && <p className="text-sm text-destructive">{errors.issue_date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
             <Controller
              name="due_date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
              )}
            />
             {errors.due_date && <p className="text-sm text-destructive">{errors.due_date.message}</p>}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                <Input {...register(`items.${index}.description`)} placeholder="Description" className="col-span-5" />
                <Input {...register(`items.${index}.quantity`)} type="number" placeholder="Qty" className="col-span-2 text-center" />
                <Input {...register(`items.${index}.price`)} type="number" placeholder="Price" className="col-span-2 text-right" />
                <div className="col-span-2 text-right py-2 pr-2 font-medium">
                  {formatCurrency((items[index]?.quantity || 0) * (items[index]?.price || 0))}
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(index)} className="col-span-1 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
             {errors.items && typeof errors.items.message === 'string' && <p className="text-sm text-destructive">{errors.items.message}</p>}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ id: `${Date.now()}`, description: '', quantity: 1, price: 0 })}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea {...register('notes')} placeholder="Add any additional notes here." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input {...register('tax_rate')} type="number" id="tax_rate" className="w-24 text-right" />
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

       <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-lg font-medium">AI Customization</AccordionTrigger>
          <AccordionContent>
            <CustomizationForm setGeneratedHtml={setGeneratedHtml} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
