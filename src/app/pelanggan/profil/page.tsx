
'use client';

import * as React from 'react';
// import { useParams, useRouter } from 'next/navigation'; // No longer need useParams
import { useRouter } from 'next/navigation';
import type { Customer } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, Loader2 } from 'lucide-react';
import { updateCustomerProfileAction } from './actions'; // Assuming actions.ts is in the same folder
import type { User as FirebaseUser } from "firebase/auth";

interface PelangganProfilPageProps {
  customerDataFromLayout?: Customer | null;
  firebaseUserFromLayout?: FirebaseUser | null;
}

export default function PelangganProfilPage({ customerDataFromLayout, firebaseUserFromLayout }: PelangganProfilPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [customer, setCustomer] = React.useState<Partial<Customer>>(customerDataFromLayout || {});
  const [isLoadingInitialData, setIsLoadingInitialData] = React.useState(!customerDataFromLayout); // Only if layout didn't provide
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  // Update local state if props from layout change (e.g., after a successful update)
  React.useEffect(() => {
    if (customerDataFromLayout) {
      setCustomer(customerDataFromLayout);
      setIsLoadingInitialData(false);
    }
  }, [customerDataFromLayout]);


  if (isLoadingInitialData && !customerDataFromLayout) {
     // This case should ideally be handled by the layout showing a loader
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Memuat profil...</p>
      </div>
    );
  }

  if (!firebaseUserFromLayout || !customerDataFromLayout?.firebaseUID) {
    // Should be caught by layout, but as a fallback:
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <p className="text-destructive mb-4">Data profil tidak dapat dimuat atau sesi tidak valid.</p>
        <Button onClick={() => router.push('/login/pelanggan')}>Kembali ke Login</Button>
      </div>
    );
  }
  // At this point, customerDataFromLayout and firebaseUserFromLayout should exist
  // and `customer` state is initialized from `customerDataFromLayout`.


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!firebaseUserFromLayout?.uid || !customer.id) return; // customer.id is the custom ID, firebaseUID is for auth
    setIsSubmitting(true);
    const profileDataToUpdate = {
        name: customer.name || '',
        phoneNumber: customer.phoneNumber || '',
        address: customer.address || '',
        email: customer.email || '', // This email is informational; Firebase Auth email is separate
    };

    // Pass firebaseUID to identify which customer document to update
    const result = await updateCustomerProfileAction(firebaseUserFromLayout.uid, profileDataToUpdate);
    if (result.success && result.customer) {
      setCustomer(result.customer); // Update local state with data from server (which includes revalidated data)
      toast({
        title: 'Profil Diperbarui',
        description: result.message,
      });
      setIsEditing(false);
    } else {
      toast({
        title: 'Gagal Memperbarui',
        description: result.message || 'Terjadi kesalahan.',
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profil Saya</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-6 h-6" />
            Informasi Akun Anda
          </CardTitle>
          <CardDescription>
            Lihat dan perbarui detail pribadi Anda. Perubahan pada ID Pelanggan (Custom), Tanggal Bergabung, dan detail teknis lainnya biasanya dilakukan oleh Admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" name="name" value={customer.name || ''} onChange={handleChange} disabled={!isEditing || isSubmitting} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phoneNumber">Nomor Telepon</Label>
              <Input id="phoneNumber" name="phoneNumber" type="tel" value={customer.phoneNumber || ''} onChange={handleChange} disabled={!isEditing || isSubmitting} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="address">Alamat</Label>
            <Input id="address" name="address" value={customer.address || ''} onChange={handleChange} disabled={!isEditing || isSubmitting} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email Kontak</Label>
            <Input id="email" name="email" type="email" value={customer.email || ''} onChange={handleChange} disabled={!isEditing || isSubmitting} />
            <p className="text-xs text-muted-foreground">Ini adalah email kontak Anda, mungkin berbeda dari email login.</p>
          </div>
          
          <hr className="my-4"/>
          <h3 className="text-lg font-medium text-muted-foreground">Informasi Langganan (Read-only)</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label>ID Pelanggan (Custom)</Label>
                <Input value={customer.id || ''} disabled />
            </div>
             <div className="space-y-1">
                <Label>Email Akun Login</Label>
                <Input value={firebaseUserFromLayout.email || ''} disabled />
            </div>
            <div className="space-y-1">
                <Label>Paket WiFi</Label>
                <Input value={customer.wifiPackage || ''} disabled />
            </div>
            <div className="space-y-1">
                <Label>Tanggal Bergabung</Label>
                <Input value={customer.joinDate ? new Date(customer.joinDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric'}) : ''} disabled />
            </div>
             <div className="space-y-1">
                <Label>Siklus Tagihan</Label>
                <Input value={`Setiap tanggal ${customer.billingCycleDay}` || ''} disabled />
            </div>
          </div>

        </CardContent>
        <CardFooter className="border-t pt-6">
          {isEditing ? (
            <div className="flex gap-2">
              <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
              <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  // Revert to original data from layout props if user cancels
                  if (customerDataFromLayout) setCustomer(customerDataFromLayout);
              }} disabled={isSubmitting}>Batal</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profil</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
