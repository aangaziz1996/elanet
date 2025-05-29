
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Added for potential user display
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


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
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (isAdminLoggedIn === 'true') {
      setIsAuthenticated(true);
    } else {
      // Allow access to login page itself if we were to include it in this layout (not current case)
      // For now, any path under /admin that isn't logged in gets redirected.
      if (pathname !== '/login/admin') { // Ensure we don't redirect from the login page itself if it somehow fell under this layout
         router.replace('/login/admin');
      } else {
        // If it's the login page and somehow using this layout, just mark as not loading
        // This scenario is unlikely with current setup.
      }
    }
    setIsLoading(false);
  }, [pathname, router]);

  const handleAdminLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    setIsAuthenticated(false);
    toast({
      title: 'Logout Admin Berhasil',
      description: 'Anda telah keluar dari sesi admin.',
    });
    router.push('/login/admin');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Memverifikasi sesi admin...</p>
      </div>
    );
  }

  // If not authenticated and done loading, the redirect should have happened.
  // But as a safeguard, prevent rendering children.
  if (!isAuthenticated && pathname !== '/login/admin') {
     // This check helps prevent flash of content if redirect is slow or if effect hasn't run.
     // Router.replace should handle it, but good for robustness.
    return (
         <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">Mengarahkan ke halaman login admin...</p>
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
                        <AvatarImage src="https://placehold.co/40x40.png?text=A" alt="Admin" data-ai-hint="avatar person" />
                        <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Admin Akun</DropdownMenuLabel>
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
            {isAuthenticated ? children : null /* Render children only if authenticated */}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
