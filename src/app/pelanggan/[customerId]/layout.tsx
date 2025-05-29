
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wifi, UserCircle, LogOut, LayoutDashboard, FileText, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { findCustomerById } from '@/lib/mock-data';
import type { Customer } from '@/types/customer';

export default function PelangganLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const customerId = params.customerId as string;
  const { toast } = useToast();
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loggedInId = localStorage.getItem('loggedInCustomerId');
    if (!loggedInId || loggedInId !== customerId) {
      toast({
        title: 'Akses Ditolak',
        description: 'Anda perlu login untuk mengakses halaman ini.',
        variant: 'destructive',
      });
      router.replace('/login/pelanggan');
      return;
    }

    const fetchedCustomer = findCustomerById(loggedInId);
    if (fetchedCustomer) {
      setCustomer(fetchedCustomer);
    } else {
      // Should not happen if login was successful
      toast({
        title: 'Error',
        description: 'Data pelanggan tidak ditemukan.',
        variant: 'destructive',
      });
      localStorage.removeItem('loggedInCustomerId');
      router.replace('/login/pelanggan');
      return;
    }
    setIsLoading(false);
  }, [customerId, router, toast]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInCustomerId');
    toast({
      title: 'Logout Berhasil',
      description: 'Anda telah keluar.',
    });
    router.push('/login/pelanggan');
  };

  if (isLoading || !customer) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Memuat data pelanggan...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
        <Link href={`/pelanggan/${customerId}/dashboard`} className="flex items-center gap-2">
          <Wifi className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold text-foreground">ELANET Pelanggan</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Halo, {customer.name.split(' ')[0]}
          </span>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>
      
      <div className="flex flex-1">
        <nav className="hidden md:flex md:flex-col md:w-64 border-r bg-card p-4 space-y-2">
            <Button variant="ghost" className="justify-start" asChild>
                <Link href={`/pelanggan/${customerId}/dashboard`}>
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Dashboard
                </Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild>
                 <Link href={`/pelanggan/${customerId}/profil`}>
                    <UserCircle className="mr-2 h-5 w-5" />
                    Profil Saya
                </Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild>
                 <Link href={`/pelanggan/${customerId}/tagihan`}>
                    <FileText className="mr-2 h-5 w-5" />
                    Tagihan & Pembayaran
                </Link>
            </Button>
             <Button variant="ghost" className="justify-start" asChild>
                 <Link href={`/pelanggan/${customerId}/chat`}>
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Chat Dukungan
                </Link>
            </Button>
        </nav>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            {children}
        </main>
      </div>
       {/* Bottom navigation for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background p-2 flex justify-around">
        <Button variant="ghost" size="sm" className="flex flex-col h-auto p-1" asChild>
           <Link href={`/pelanggan/${customerId}/dashboard`}>
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-xs">Dashboard</span>
            </Link>
        </Button>
         <Button variant="ghost" size="sm" className="flex flex-col h-auto p-1" asChild>
           <Link href={`/pelanggan/${customerId}/profil`}>
                <UserCircle className="h-5 w-5" />
                <span className="text-xs">Profil</span>
            </Link>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col h-auto p-1" asChild>
           <Link href={`/pelanggan/${customerId}/tagihan`}>
                <FileText className="h-5 w-5" />
                <span className="text-xs">Tagihan</span>
            </Link>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col h-auto p-1" asChild>
           <Link href={`/pelanggan/${customerId}/chat`}>
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">Chat</span>
            </Link>
        </Button>
      </nav>
      <div className="md:hidden h-16"></div> {/* Spacer for bottom nav */}
    </div>
  );
}
