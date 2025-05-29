
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { validateCustomerLoginAction } from './actions'; // Import server action

export default function PelangganLoginPage() {
  const [customerId, setCustomerId] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    // Optional: If already logged in via localStorage, redirect
    const loggedInId = localStorage.getItem('loggedInCustomerId');
    if (loggedInId) {
      router.replace(`/pelanggan/${loggedInId}/dashboard`);
    }
  }, [router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const result = await validateCustomerLoginAction(customerId);

    if (result.success && result.customer) {
      localStorage.setItem('loggedInCustomerId', result.customer.id);
      toast({
        title: 'Login Berhasil',
        description: `Selamat datang kembali, ${result.customer.name}!`,
      });
      router.push(`/pelanggan/${result.customer.id}/dashboard`);
    } else {
      toast({
        title: 'Login Gagal',
        description: result.message || 'ID Pelanggan tidak ditemukan atau terjadi kesalahan.',
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || !customerId.trim()}>
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
