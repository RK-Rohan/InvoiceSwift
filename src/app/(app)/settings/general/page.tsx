'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User as UserIcon } from 'lucide-react';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Label } from '@/components/ui/label';

const companyProfileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

export default function GeneralSettingsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const companyProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'profile') : null),
    [user, firestore]
  );

  const { data: companyProfile, isLoading } = useDoc<CompanyProfileFormData>(companyProfileRef);

  const form = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: '',
      email: '',
      phone: '',
      address: '',
      logoUrl: '',
    },
  });

  useEffect(() => {
    if (companyProfile) {
      form.reset(companyProfile);
    }
  }, [companyProfile, form]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const storage = getStorage();
    const storageRef = ref(storage, `users/${user.uid}/logos/${file.name}`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        await uploadString(storageRef, dataUrl, 'data_url');
        const downloadUrl = await getDownloadURL(storageRef);
        form.setValue('logoUrl', downloadUrl);
        toast({ title: 'Logo uploaded successfully.' });
      } catch (error) {
        console.error('Logo upload failed:', error);
        toast({ variant: 'destructive', title: 'Logo upload failed.' });
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: CompanyProfileFormData) => {
    if (!companyProfileRef) return;
    const dataToSave = { ...values, updatedAt: serverTimestamp() };
    try {
      await setDoc(companyProfileRef, dataToSave, { merge: true });
      toast({ title: 'Settings saved successfully!' });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: companyProfileRef.path,
            operation: 'write',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error.message || 'Could not save settings.',
        });
      }
    }
  };

  if (isLoading) {
    return <p>Loading settings...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Update your company information. This will be used on your invoices.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={form.watch('logoUrl')} alt="Company Logo" />
                <AvatarFallback>
                  <UserIcon className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1.5">
                  <Label htmlFor="logo-upload">Company Logo</Label>
                  <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="w-fit" />
                  <p className="text-sm text-muted-foreground">Upload your company logo (PNG, JPG, SVG).</p>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company LLC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@yourcompany.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (234) 567-890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Address</FormLabel>
                  <FormControl>
                    <Input placeholder="1234 Innovation Drive, Tech City, 12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
