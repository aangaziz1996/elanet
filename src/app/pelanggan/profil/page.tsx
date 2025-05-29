
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation'; // Removed useParams
import type { Customer } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, Loader2 } from 'lucide-react';
import { updateCustomerProfileAction, getCustomerByFirebaseUIDAction } from '../actions'; // Import from parent directory
import type { User as FirebaseUser } from "firebase/auth";

interface PelangganProfilPageProps {
  customerDataFromLayout?: Customer | null;
  firebaseUserFromLayout?: FirebaseUser | null;
}

export default function PelangganProfilPage({ customerDataFromLayout, firebaseUserFromLayout }: PelangganProfilPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [customer, setCustomer] = React.useState<Partial<Customer>>(customerDataFromLayout || {});
  const [isLoading, setIsLoading] = React.useState(!customerDataFromLayout && !!firebaseUserFromLayout); // Only load if no layout data but user exists
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  const firebaseUID = firebaseUserFromLayout?.uid;

  const fetchCustomerData = React.useCallback(async () => {
    if (!firebaseUID) return;
    setIsLoading(true);
    const result = await getCustomerByFirebaseUIDAction(firebaseUID);
    if (result.success && result.customer) {
      setCustomer(result.customer);
    } else {
      toast({
        title: 'Error Memuat Profil',
        description: result.message || 'Gagal memuat data profil dari server.',
        variant: 'destructive',
      });
      // Don't redirect here, layout should handle general auth issues
    }
    setIsLoading(false);
  }, [firebaseUID, toast]);


  React.useEffect(() => {
    if (customerDataFromLayout) {
      setCustomer(customerDataFromLayout);
      setIsLoading(false);
    } else if (firebaseUserFromLayout && !customerDataFromLayout) {
      // If layout provided firebaseUser but not customerData, it means layout might have failed to fetch.
      // Attempt to fetch directly here.
      fetchCustomerData();
    }
    // If neither firebaseUserFromLayout nor customerDataFromLayout is present,
    // PelangganLayout should have redirected to login.
  }, [customerDataFromLayout, firebaseUserFromLayout, fetchCustomerData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!firebaseUID || !customer.id) {
        toast({ title: 'Error', description: 'Informasi pelanggan tidak lengkap untuk menyimpan.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    const profileDataToUpdate = {
        name: customer.name || '',
        phoneNumber: customer.phoneNumber || '',
        address: customer.address || '',
        email: customer.email || '', // Email from form, not FirebaseUser email
    };

    // Pass firebaseUID to identify the customer for update
    const result = await updateCustomerProfileAction(firebaseUID, profileDataToUpdate);
    if (result.success && result.customer) {
      setCustomer(result.customer); 
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Memuat profil...</p>
      </div>
    );
  }

  if (!firebaseUserFromLayout || (!customer.id && !isLoading)) {
    // This case should ideally be handled by PelangganLayout redirecting to login.
    // Showing a generic message if somehow reached.
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <p className="text-destructive mb-4">Sesi tidak valid atau data profil tidak dapat dimuat.</p>
        <Button onClick={() => router.push('/login/pelanggan')}>Kembali ke Login</Button>
      </div>
    );
  }

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
            Lihat dan perbarui detail pribadi Anda. Email login Firebase tidak dapat diubah dari sini.
            Perubahan pada ID Pelanggan, Tanggal Bergabung, dan detail teknis lainnya dilakukan oleh Admin.
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
            <p className="text-xs text-muted-foreground">Email ini adalah untuk kontak dan mungkin berbeda dari email login Firebase Anda.</p>
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
                <Input value={firebaseUserFromLayout?.email || ''} disabled />
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
                  // Re-fetch original data if changes were made then cancelled
                  if (firebaseUserFromLayout?.uid) fetchCustomerData();
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

    