
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Removed useParams
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wifi, UserCircle, LogOut, LayoutDashboard, FileText, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types/customer';
import { getCustomerByFirebaseUIDAction } from './actions'; // Import server action
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


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        const result = await getCustomerByFirebaseUIDAction(user.uid);
        if (result.success && result.customer) {
          setCustomer(result.customer);
        } else {
          toast({
            title: 'Error Memuat Data Pelanggan',
            description: result.message || 'Gagal menghubungkan akun Anda dengan data pelanggan. Silakan hubungi admin.',
            variant: 'destructive',
          });
          // Optionally sign out user if no customer profile is linked
          // await signOut(auth); 
          // router.replace('/login/pelanggan'); 
          // For now, let them stay but show error in UI
        }
      } else {
        setFirebaseUser(null);
        setCustomer(null);
        // Only redirect if not already on the login page
        if (pathname !== '/login/pelanggan') {
             router.replace('/login/pelanggan');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router, toast]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Auth state change will trigger redirect via useEffect
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
  
  // Adjusted navItems to remove customerId from href
  const navItems = [
    { href: `/pelanggan/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/pelanggan/profil`, label: 'Profil', icon: UserCircle },
    { href: `/pelanggan/tagihan`, label: 'Tagihan', icon: FileText },
    { href: `/pelanggan/chat`, label: 'Chat', icon: MessageSquare },
  ];

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Memverifikasi sesi dan memuat data...</p>
        </div>
    );
  }
  
  // If firebaseUser exists but customer profile doesn't, show an error message.
  // This state might occur if Firebase Auth user exists but no corresponding Firestore doc with that firebaseUID.
  if (firebaseUser && !customer && !isLoading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <Wifi className="h-12 w-12 text-primary mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Gagal Memuat Profil Pelanggan</h1>
            <p className="text-muted-foreground mb-4">
                Tidak dapat menemukan data pelanggan yang terhubung dengan akun Anda ({firebaseUser.email}). <br/>
                Ini mungkin karena data pelanggan belum di-link oleh admin atau ada kesalahan konfigurasi.
            </p>
            <p className="text-muted-foreground mb-6">Silakan hubungi admin untuk bantuan.</p>
            <Button onClick={handleLogout}>Logout dan Kembali ke Login</Button>
        </div>
    );
  }
  
  // If no firebaseUser (which means onAuthStateChanged redirected or is about to),
  // this prevents rendering children briefly before redirect.
  if (!firebaseUser && !isLoading && pathname !== '/login/pelanggan') {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Mengarahkan ke login...</p>
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
            Halo, {customer?.name.split(' ')[0] || firebaseUser?.email?.split('@')[0] || 'Pelanggan'}
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
            {/* Pass customer and firebaseUser data to children */}
            {firebaseUser && customer && !isLoading ? React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // @ts-ignore 
                    return React.cloneElement(child, { customerDataFromLayout: customer, firebaseUserFromLayout: firebaseUser });
                }
                return child;
            }) : null}
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
