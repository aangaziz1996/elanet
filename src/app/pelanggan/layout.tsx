
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wifi, UserCircle, LogOut, LayoutDashboard, FileText, MessageSquare, Loader2, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types/customer';
import { getCustomerByFirebaseUIDAction } from './actions';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { auth } from '@/lib/firebase';

export default function PelangganLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(null);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorFetchingCustomer, setErrorFetchingCustomer] = React.useState<string | null>(null);


  React.useEffect(() => {
    console.log('PelangganLayout: useEffect triggered. Pathname:', pathname);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true); // Set loading true at the start of auth state change
      setErrorFetchingCustomer(null); // Reset error state
      setCustomer(null); // Reset customer data

      if (user) {
        console.log('PelangganLayout: Firebase user detected:', user.uid, user.email);
        setFirebaseUser(user);
        try {
          console.log('PelangganLayout: Attempting to fetch customer data for UID:', user.uid);
          const result = await getCustomerByFirebaseUIDAction(user.uid);
          console.log('PelangganLayout: getCustomerByFirebaseUIDAction result:', result);

          if (result.success && result.customer) {
            console.log('PelangganLayout: Customer data found:', result.customer.id, result.customer.name);
            setCustomer(result.customer);
          } else {
            console.error('PelangganLayout: Failed to fetch customer data or customer not found. Message:', result.message);
            setErrorFetchingCustomer(result.message || 'Data pelanggan tidak ditemukan terhubung dengan akun Anda.');
            // Tidak logout otomatis, biarkan pengguna melihat pesan error
          }
        } catch (e: any) {
            console.error('PelangganLayout: Exception while fetching customer data:', e);
            setErrorFetchingCustomer('Terjadi kesalahan server saat mengambil data pelanggan.');
            toast({
                title: 'Error Server',
                description: e.message || 'Gagal menghubungi server untuk data pelanggan.',
                variant: 'destructive',
            });
        }
      } else {
        console.log('PelangganLayout: No Firebase user detected. Redirecting to login.');
        setFirebaseUser(null);
        // Hanya redirect jika tidak sudah di halaman login
        if (pathname !== '/login/pelanggan') {
             router.replace('/login/pelanggan');
        }
      }
      setIsLoading(false);
    });

    return () => {
      console.log('PelangganLayout: useEffect cleanup.');
      unsubscribe();
    };
  }, [pathname, router, toast]); // `toast` ditambahkan jika digunakan dalam effect, meskipun lebih baik di luar jika memungkinkan

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Auth state change akan trigger redirect via useEffect
      toast({
        title: 'Logout Berhasil',
        description: 'Anda telah keluar.',
      });
    } catch (error) {
        console.error("Customer logout error:", error);
        toast({
            title: 'Gagal Logout',
            description: 'Terjadi kesalahan saat mencoba logout.',
            variant: 'destructive',
        });
    }
  };
  
  const navItems = [
    { href: `/pelanggan/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/pelanggan/profil`, label: 'Profil', icon: UserCircle },
    { href: `/pelanggan/tagihan`, label: 'Tagihan', icon: FileText },
    { href: `/pelanggan/chat`, label: 'Chat', icon: MessageSquare },
  ];

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Memverifikasi sesi dan memuat data...</p>
        </div>
    );
  }
  
  if (!firebaseUser && !isLoading && pathname !== '/login/pelanggan') {
    // Kasus ini seharusnya ditangani oleh onAuthStateChanged yang redirect,
    // tapi sebagai fallback jika render terjadi sebelum redirect selesai.
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Mengarahkan ke halaman login...</p>
        </div>
    );
  }
  
  if (firebaseUser && !customer && !isLoading && errorFetchingCustomer) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold mb-2 text-destructive">Gagal Memuat Profil Pelanggan</h1>
            <p className="text-muted-foreground mb-2">
                Email terautentikasi: <span className="font-medium">{firebaseUser.email}</span>
            </p>
            <p className="text-muted-foreground mb-4">
                Pesan error: {errorFetchingCustomer}
            </p>
            <p className="text-muted-foreground mb-6 text-sm">
                Pastikan akun Firebase Anda (<span className="font-mono text-xs">{firebaseUser.uid}</span>) telah ditautkan dengan benar ke data pelanggan (field `firebaseUID`) oleh admin di sistem ELANET.
                Jika masalah berlanjut, silakan hubungi admin untuk bantuan.
            </p>
            <Button onClick={handleLogout} variant="destructive">Logout dan Coba Lagi</Button>
        </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
        <Link href={`/pelanggan/dashboard`} className="flex items-center gap-2">
          <Wifi className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold text-foreground">ELANET Pelanggan</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Halo, {customer?.name?.split(' ')[0] || firebaseUser?.email?.split('@')[0] || 'Pelanggan'}
          </span>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>
      
      <div className="flex flex-1">
        <nav className="hidden md:flex md:flex-col md:w-64 border-r bg-card p-4 space-y-2">
            {navItems.map(item => (
                <Button 
                    key={item.href}
                    variant={pathname === item.href ? "secondary" : "ghost"} 
                    className="justify-start" 
                    asChild
                >
                    <Link href={item.href}>
                        <item.icon className="mr-2 h-5 w-5" />
                        {item.label}
                    </Link>
                </Button>
            ))}
        </nav>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            {/* Pass customer and firebaseUser data to children if available */}
            {firebaseUser && customer && !isLoading && !errorFetchingCustomer ? React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // @ts-ignore 
                    return React.cloneElement(child, { customerDataFromLayout: customer, firebaseUserFromLayout: firebaseUser });
                }
                return child;
            }) : null /* Atau tampilkan pesan/loader spesifik di main area jika diperlukan */}
        </main>
      </div>
       {/* Bottom navigation for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background p-2 flex justify-around">
        {navItems.map(item => (
            <Button 
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"} 
                size="sm" 
                className="flex flex-col h-auto p-1" 
                asChild
            >
                <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs">{item.label}</span>
                </Link>
            </Button>
        ))}
      </nav>
      <div className="md:hidden h-16"></div> {/* Spacer for bottom nav */}
    </div>
  );
}

    