
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
import { signInWithEmailAndPassword } from "firebase/auth"; // Firebase Auth
import { auth } from '@/lib/firebase'; // Firebase auth instance

export default function AdminLoginPage() {
  const [email, setEmail] = React.useState(''); // Changed username to email
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login Admin Berhasil',
        description: 'Selamat datang, Admin!',
      });
      // AdminLayout will handle redirection based on auth state
      // No need to explicitly push, but good for immediate feedback if desired
      // router.push('/admin/dashboard');
      // Forcing a reload or relying on AdminLayout's auth check to redirect
      router.replace('/admin/dashboard'); 
    } catch (error: any) {
      let errorMessage = 'Username atau password admin salah.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Email atau password admin salah.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid.';
      }
      console.error("Admin login error:", error);
      toast({
        title: 'Login Gagal',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
    // setIsLoading(false); // Moved inside catch for error case, success case redirects
  };

  React.useEffect(() => {
    // Check if admin is already logged in via Firebase Auth
    // This redirection is primarily handled by AdminLayout now,
    // but this can prevent a flash of the login page if user is already authenticated.
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        router.replace('/admin/dashboard');
      }
    });
    return () => unsubscribe();
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
            Masukkan email dan password admin untuk mengakses dashboard.
            <br />
            <span className="text-xs text-muted-foreground">
              (Pastikan Anda telah membuat akun admin di Firebase Authentication).
            </span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email" // Changed type to email
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
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
