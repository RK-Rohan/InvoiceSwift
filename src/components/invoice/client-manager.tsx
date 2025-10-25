'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Edit, UserPlus, X } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { Client } from '@/lib/types';
import { useFormContext as useInvoiceFormContext } from 'react-hook-form';

type ClientManagerProps = {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
};

export default function ClientManager({ clients, setClients }: ClientManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { setValue: setInvoiceValue } = useInvoiceFormContext();

  const { register, handleSubmit, reset, setValue } = useForm<Client>();

  const handleSaveClient = (data: Client) => {
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...data, id: c.id } : c));
    } else {
      setClients([...clients, { ...data, id: `${Date.now()}` }]);
    }
    setEditingClient(null);
    reset({ name: '', email: '', address: '' });
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setValue('name', client.name);
    setValue('email', client.email);
    setValue('address', client.address);
  };

  const handleDelete = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
    setInvoiceValue('client_id', '');
    setInvoiceValue('client_name', '');
    setInvoiceValue('client_address', '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" /> Manage Clients
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Client Management</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <form onSubmit={handleSubmit(handleSaveClient)} className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium text-lg">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...register('address')} />
            </div>
            <div className="flex justify-end gap-2">
                {editingClient && (
                    <Button type="button" variant="ghost" onClick={() => { setEditingClient(null); reset(); }}>Cancel Edit</Button>
                )}
              <Button type="submit" variant="secondary">{editingClient ? 'Save Changes' : 'Add Client'}</Button>
            </div>
          </form>

          <div className="space-y-2">
            <h3 className="font-medium text-lg mb-2">Client List</h3>
            <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
              {clients.length > 0 ? clients.map(client => (
                <div key={client.id} className="flex items-center justify-between p-2 border rounded-md bg-secondary/30">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(client.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No clients added yet.</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
