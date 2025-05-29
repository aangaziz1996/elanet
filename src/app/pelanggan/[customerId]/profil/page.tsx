
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { findCustomerById } from '@/lib/mock-data';
import type { Customer } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle } from 'lucide-react';

export default function PelangganProfilPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;
  const { toast } = useToast();
  const [customer, setCustomer] = React.useState<Partial<Customer>>({}); // Allow partial for editing
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    const loggedInId = localStorage.getItem('loggedInCustomerId');
    if (!loggedInId || loggedInId !== customerId) {
      router.replace('/login/pelanggan');
      return;
    }
    const fetchedCustomer = findCustomerById(loggedInId);
    if (fetchedCustomer) {
      setCustomer(fetchedCustomer);
    } else {
      router.replace('/login/pelanggan');
      return;
    }
    setIsLoading(false);
  }, [customerId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    // In a real app, this would make an API call to update customer data.
    // For this mock, we'll just show a toast. The data isn't persisted beyond this session.
    toast({
      title: 'Profil Diperbarui (Demo)',
      description: 'Perubahan profil Anda telah disimpan (simulasi).',
    });
    setIsEditing(false);
    // To persist in mock data, you'd need to update `initialCustomers` in `lib/mock-data.ts`
    // and potentially re-trigger a fetch or update a global state.
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><p>Memuat profil...</p></div>;
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
            Lihat dan perbarui detail pribadi Anda. Perubahan pada ID Pelanggan, Tanggal Bergabung, dan detail teknis lainnya biasanya dilakukan oleh Admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" name="name" value={customer.name || ''} onChange={handleChange} disabled={!isEditing} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phoneNumber">Nomor Telepon</Label>
              <Input id="phoneNumber" name="phoneNumber" type="tel" value={customer.phoneNumber || ''} onChange={handleChange} disabled={!isEditing} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="address">Alamat</Label>
            <Input id="address" name="address" value={customer.address || ''} onChange={handleChange} disabled={!isEditing} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={customer.email || ''} onChange={handleChange} disabled={!isEditing} />
          </div>
          
          <hr className="my-4"/>
          <h3 className="text-lg font-medium text-muted-foreground">Informasi Langganan (Read-only)</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label>ID Pelanggan</Label>
                <Input value={customer.id || ''} disabled />
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
              <Button onClick={handleSaveChanges}>Simpan Perubahan</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Batal</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profil</Button>
          )}
        </CardFooter>
      </Card>
       <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">
        <p className="font-bold">Catatan Penting</p>
        <p>Fitur edit profil ini hanya untuk demonstrasi. Perubahan yang Anda buat tidak akan tersimpan secara permanen dalam sistem mock ini.</p>
      </div>
    </div>
  );
}
