
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { findCustomerById } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function PelangganLoginPage() {
  const [customerId, setCustomerId] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // In a real app, you would call an API to authenticate the user.
    // For this mock, we'll just check if the customer ID exists.
    const customer = findCustomerById(customerId);

    if (customer) {
      localStorage.setItem('loggedInCustomerId', customer.id);
      toast({
        title: 'Login Berhasil',
        description: `Selamat datang kembali, ${customer.name}!`,
      });
      router.push(`/pelanggan/${customer.id}/dashboard`);
    } else {
      toast({
        title: 'Login Gagal',
        description: 'ID Pelanggan tidak ditemukan. Silakan coba lagi.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <LogIn className="w-6 h-6 text-primary" />
            Login Pelanggan ELANET
          </CardTitle>
          <CardDescription>
            Masukkan ID Pelanggan Anda untuk melanjutkan.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">ID Pelanggan</Label>
              <Input
                id="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Contoh: cust_1"
                required
                disabled={isLoading}
              />
            </div>
            {/* Password field can be added here for a more complete mock or real auth */}
            {/* <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Password Anda" required disabled={isLoading} />
            </div> */}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Memproses...' : 'Login'}
            </Button>
            <Button variant="link" size="sm" asChild>
                <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
