
'use client';

import * as React from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wifi, UserCircle, LogOut, LayoutDashboard, FileText, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types/customer';
import { getCustomerDetailsAction } from './actions'; // Import server action

export default function PelangganLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const customerId = params.customerId as string;
  const { toast } = useToast();
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthorized, setIsAuthorized] = React.useState(false);


  React.useEffect(() => {
    const loggedInId = localStorage.getItem('loggedInCustomerId');
    if (!loggedInId || loggedInId !== customerId) {
      toast({
        title: 'Akses Ditolak',
        description: 'Anda perlu login atau sesi Anda tidak valid.',
        variant: 'destructive',
      });
      localStorage.removeItem('loggedInCustomerId'); // Clean up potentially invalid session
      router.replace('/login/pelanggan');
      return;
    }
    setIsAuthorized(true); // Initial auth passed

    async function fetchCustomerData() {
      const result = await getCustomerDetailsAction(customerId);
      if (result.success && result.customer) {
        setCustomer(result.customer);
      } else {
        toast({
          title: 'Error Memuat Data',
          description: result.message || 'Gagal memuat detail pelanggan dari server.',
          variant: 'destructive',
        });
        // Optionally logout or redirect if customer data crucial for layout isn't found
        // localStorage.removeItem('loggedInCustomerId');
        // router.replace('/login/pelanggan');
      }
      setIsLoading(false);
    }

    if (customerId) {
      fetchCustomerData();
    } else {
      setIsLoading(false); // No customerId, likely an issue, stop loading
    }

  }, [customerId, router, toast]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInCustomerId');
    toast({
      title: 'Logout Berhasil',
      description: 'Anda telah keluar.',
    });
    router.push('/login/pelanggan');
  };
  
  const navItems = [
    { href: `/pelanggan/${customerId}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/pelanggan/${customerId}/profil`, label: 'Profil', icon: UserCircle },
    { href: `/pelanggan/${customerId}/tagihan`, label: 'Tagihan', icon: FileText },
    { href: `/pelanggan/${customerId}/chat`, label: 'Chat', icon: MessageSquare },
  ];

  if (!isAuthorized) { // If initial localStorage check failed
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Mengarahkan ke halaman login...</p>
        </div>
    );
  }


  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Memuat data pelanggan...</p>
        </div>
    );
  }
  
  if (!customer && !isLoading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <p className="text-destructive mb-4">Gagal memuat data pelanggan. Mungkin ID tidak valid.</p>
            <Button onClick={() => router.push('/login/pelanggan')}>Kembali ke Login</Button>
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
            Halo, {customer?.name.split(' ')[0] || 'Pelanggan'}
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
            {/* Pass customer data to children if they are server components or need it directly */}
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // This is a simple way, context or a dedicated store might be better for deep nesting
                    // @ts-ignore
                    return React.cloneElement(child, { customerDataFromLayout: customer });
                }
                return child;
            })}
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
