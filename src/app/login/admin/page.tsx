
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ShieldCheck, LogIn } from 'lucide-react';

// Credentials for mock admin login
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password";

export default function AdminLoginPage() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem('isAdminLoggedIn', 'true');
      toast({
        title: 'Login Admin Berhasil',
        description: 'Selamat datang, Admin!',
      });
      router.push('/admin/dashboard');
    } else {
      toast({
        title: 'Login Gagal',
        description: 'Username atau password admin salah.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    // If admin is already logged in, redirect to dashboard
    if (localStorage.getItem('isAdminLoggedIn') === 'true') {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Login Admin ELANET
          </CardTitle>
          <CardDescription>
            Masukkan kredensial admin untuk mengakses dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username admin"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password admin"
                required
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center pt-2">
              (Untuk demo: username: <strong>admin</strong>, password: <strong>password</strong>)
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Memproses...' : 'Login Admin'}
            </Button>
             <Button variant="link" size="sm" asChild>
                <Link href="/">
                    <LogIn className="mr-2 h-4 w-4" />
                    Kembali ke Beranda / Login Pelanggan
                </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
