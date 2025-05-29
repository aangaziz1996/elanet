'use client';

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
import { Users, CreditCard, MessageSquare, Settings, LayoutDashboard, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

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
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-4">
            <SidebarTrigger className="sm:hidden" />
            {/* Breadcrumbs or page title can go here */}
            <div className="flex-1">
                <h1 className="text-xl font-semibold capitalize">
                    {navItems.find(item => pathname.startsWith(item.href))?.label || 'Admin'}
                </h1>
            </div>
            {/* User menu can go here */}
          </header>
          <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
