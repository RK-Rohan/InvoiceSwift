'use client';

import { useMemo, useState } from 'react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import ClientForm from '@/components/clients/client-form';
import DeleteClientDialog from '@/components/clients/delete-client-dialog';
import { type Client } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ClientsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();

  const clientsCollection = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'clients') : null),
    [user, firestore]
  );

  const {
    data: clients,
    isLoading,
    error,
  } = useCollection<Omit<Client, 'id'>>(clientsCollection);

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedClient(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedClient(null);
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clients</CardTitle>
          <Button onClick={handleAddClient} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading clients...</p>}
          {error && <p className="text-destructive">Error: {error.message}</p>}
          {!isLoading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients && clients.length > 0 ? (
                  clients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phoneNumber}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClient(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClient(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No clients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ClientForm
        isOpen={isFormOpen}
        onClose={closeForm}
        client={selectedClient}
      />
      
      {selectedClient && (
        <DeleteClientDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          client={selectedClient}
        />
      )}
    </>
  );
}
