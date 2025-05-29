
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { LogIn, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from '@/lib/firebase';

export default function PelangganLoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    // If user is already logged in via Firebase, redirect to their dashboard
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check if this user is an admin by trying to go to admin dashboard
        // This is a simple check; a more robust way is custom claims
        // For now, assume if they are logged in, they are a customer unless proven admin
        router.replace('/pelanggan/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login Pelanggan Berhasil',
        description: `Selamat datang kembali!`,
      });
      // PelangganLayout will handle fetching data based on Firebase UID
      router.push(`/pelanggan/dashboard`); 
    } catch (error: any) {
      let errorMessage = 'Email atau password salah.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Email atau password salah.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid.';
      } else {
        console.error("Customer login error:", error);
      }
      toast({
        title: 'Login Gagal',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
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
            Masukkan email dan password Anda untuk melanjutkan.
             <br />
            <span className="text-xs text-muted-foreground">
              (Pastikan akun Anda telah dibuat oleh Admin).
            </span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
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
                placeholder="Password Anda"
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || !email.trim() || !password.trim()}>
              {isLoading ? 'Memproses...' : 'Login'}
            </Button>
            <Button variant="link" size="sm" asChild>
                <Link href="/login/admin">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Login sebagai Admin
                </Link>
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
