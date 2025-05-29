
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Users, CreditCard, MessageSquare, Settings, LayoutDashboard, Wifi, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { auth } from '@/lib/firebase'; // Firebase auth instance
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pelanggan', label: 'Pelanggan', icon: Users },
  { href: '/admin/pembayaran', label: 'Pembayaran', icon: CreditCard },
  { href: '/admin/chat', label: 'Chat', icon: MessageSquare },
  { href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [authUser, setAuthUser] = React.useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser(user);
        // You might want to verify if this user is an admin, e.g., via custom claims or a Firestore check.
        // For this example, any authenticated Firebase user is considered an admin.
      } else {
        setAuthUser(null);
        // Only redirect if not already on the login page
        if (pathname !== '/login/admin') {
            router.replace('/login/admin');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const handleAdminLogout = async () => {
    try {
      await signOut(auth);
      setAuthUser(null); // Clear local auth user state
      toast({
        title: 'Logout Admin Berhasil',
        description: 'Anda telah keluar dari sesi admin.',
      });
      router.push('/login/admin'); // Redirect to login page
    } catch (error) {
      console.error("Admin logout error:", error);
      toast({
        title: 'Gagal Logout',
        description: 'Terjadi kesalahan saat mencoba logout.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Memverifikasi sesi admin...</p>
      </div>
    );
  }

  // If not authenticated (authUser is null) and not loading, and not on login page,
  // the onAuthStateChanged effect should have redirected.
  // This is an additional safeguard or can cover edge cases.
  if (!authUser && pathname !== '/login/admin') {
     return (
         <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Mengarahkan ke halaman login admin...</p>
        </div>
    );
  }

  // If on login page but somehow authenticated, redirect to dashboard
  if (authUser && pathname === '/login/admin') {
    router.replace('/admin/dashboard');
    return ( // Show loader while redirecting
         <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Mengarahkan ke dashboard...</p>
        </div>
    );
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Button variant="ghost" className="h-10 w-10 p-0 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                 <Wifi className="h-6 w-6 text-primary group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
              </Button>
              <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">ELANET</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))}
                    tooltip={{ children: item.label, side: 'right', align: 'center' }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
           <SidebarContent className="mt-auto">
            <SidebarMenu>
              <SidebarMenuItem>
                 <SidebarMenuButton onClick={handleAdminLogout} tooltip={{ children: 'Logout Admin', side: 'right', align: 'center' }}>
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-4">
            <SidebarTrigger className="sm:hidden" />
            <div className="flex-1">
                <h1 className="text-xl font-semibold capitalize">
                    {navItems.find(item => pathname.startsWith(item.href))?.label || 'Admin'}
                </h1>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={authUser?.photoURL || "https://placehold.co/40x40.png?text=A"} alt={authUser?.displayName || authUser?.email || "Admin"} data-ai-hint="avatar person" />
                        <AvatarFallback>{authUser?.email?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                    </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{authUser?.email || 'Admin Akun'}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/admin/pengaturan')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Pengaturan
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleAdminLogout} className="text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-auto">
            {/* Render children only if authenticated firebase user exists and not loading */}
            {authUser && !isLoading ? children : null}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
