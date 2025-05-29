
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Customer, Payment } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Wifi, UserCircle, CalendarDays, Info, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { getCustomerDetailsAction } from './actions'; // Import server action

const getStatusInfo = (status: Customer['status']): { text: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  switch (status) {
    case 'aktif':
      return { text: 'Aktif', icon: ShieldCheck, variant: 'default' };
    case 'baru':
      return { text: 'Baru', icon: Info, variant: 'outline' };
    case 'isolir':
      return { text: 'Isolir', icon: ShieldAlert, variant: 'destructive' };
    case 'nonaktif':
      return { text: 'Nonaktif', icon: ShieldX, variant: 'secondary' };
    case 'berhenti':
      return { text: 'Berhenti', icon: ShieldX, variant: 'secondary' };
    default:
      return { text: 'Tidak Diketahui', icon: ShieldQuestion, variant: 'secondary' };
  }
};

// Props for page components that might receive data from layout
interface PelangganPageProps {
  customerDataFromLayout?: Customer | null;
}

export default function PelangganDashboardPage({ customerDataFromLayout }: PelangganPageProps) {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;
  const { toast } = useToast();
  // Use customerDataFromLayout if available, otherwise fetch
  const [customer, setCustomer] = React.useState<Customer | null>(customerDataFromLayout || null);
  const [isLoading, setIsLoading] = React.useState(!customerDataFromLayout); // Only load if not provided by layout

  React.useEffect(() => {
    // This check is redundant if layout handles it, but good for standalone page logic
    const loggedInId = localStorage.getItem('loggedInCustomerId');
    if (!loggedInId || loggedInId !== customerId) {
      // Layout should handle this redirect, but as a fallback
      toast({ title: 'Akses Ditolak', description: 'Sesi tidak valid.', variant: 'destructive' });
      router.replace('/login/pelanggan');
      return;
    }

    async function fetchCustomer() {
      setIsLoading(true);
      const result = await getCustomerDetailsAction(customerId);
      if (result.success && result.customer) {
        setCustomer(result.customer);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal memuat data pelanggan.',
          variant: 'destructive',
        });
        // router.replace('/login/pelanggan'); // Or handle error display
      }
      setIsLoading(false);
    }

    // If customer data wasn't passed from layout, fetch it.
    if (!customerDataFromLayout && customerId) {
      fetchCustomer();
    } else if (customerDataFromLayout) {
      // If data is from layout, ensure it's set and stop loading
      setCustomer(customerDataFromLayout);
      setIsLoading(false);
    }
  }, [customerId, router, toast, customerDataFromLayout]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p className="text-muted-foreground">Memuat dashboard pelanggan...</p>
      </div>
    );
  }
  
  if (!customer) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <p className="text-destructive mb-4">Data pelanggan tidak dapat dimuat.</p>
        <Button onClick={() => router.push('/login/pelanggan')}>Kembali ke Login</Button>
      </div>
    );
  }
  
  const statusInfo = getStatusInfo(customer.status);
  
  let nextDueDate = new Date(); 
  if (customer.paymentHistory && customer.paymentHistory.length > 0) {
    const lastPayment = [...customer.paymentHistory] // Create a shallow copy before sorting
        .filter(p => p.paymentStatus === 'lunas') // Consider only 'lunas' payments for next due date
        .sort((a,b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())[0];
    
    if (lastPayment) {
        const lastPeriodEnd = new Date(lastPayment.periodEnd);
        nextDueDate = new Date(lastPeriodEnd);
        nextDueDate.setDate(lastPeriodEnd.getDate() + 1); // Day after last period ends
        
        if (nextDueDate < new Date()) { // If it's in the past, advance to next month based on billing cycle day
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            nextDueDate.setFullYear(currentYear, currentMonth, customer.billingCycleDay);
            if (nextDueDate < new Date()) { 
                nextDueDate.setMonth(currentMonth + 1);
            }
        }
    } else { // No 'lunas' payments, calculate from join date
        const join = new Date(customer.joinDate);
        nextDueDate = new Date(join.getFullYear(), join.getMonth(), customer.billingCycleDay);
        if (join.getDate() > customer.billingCycleDay) { 
            nextDueDate.setMonth(join.getMonth() + 1);
        }
        // If due date is still past and join date is before this due date, it means it should be next month
        if (nextDueDate < new Date() && new Date(customer.joinDate) < nextDueDate) {
            nextDueDate.setMonth(nextDueDate.getMonth() +1);
        }
    }
  } else {
      const join = new Date(customer.joinDate);
      nextDueDate = new Date(join.getFullYear(), join.getMonth(), customer.billingCycleDay);
      if (join.getDate() > customer.billingCycleDay) { 
        nextDueDate.setMonth(join.getMonth() + 1);
      }
       if (nextDueDate < new Date() && new Date(customer.joinDate) < nextDueDate) {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Pelanggan</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Akun</CardTitle>
            <statusInfo.icon className={`h-5 w-5 text-${statusInfo.variant === 'default' ? 'primary' : statusInfo.variant === 'destructive' ? 'destructive' : 'muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <Badge variant={statusInfo.variant} className="text-lg">{statusInfo.text}</Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {customer.status === 'aktif' ? 'Layanan internet Anda aktif.' : 
               customer.status === 'isolir' ? 'Segera lakukan pembayaran.' :
               'Hubungi dukungan jika ada masalah.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paket Internet</CardTitle>
            <Wifi className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.wifiPackage}</div>
            <p className="text-xs text-muted-foreground">Paket langganan Anda saat ini.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jatuh Tempo Berikutnya</CardTitle>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(nextDueDate, 'dd MMM yyyy', { locale: localeId })}
            </div>
            <p className="text-xs text-muted-foreground">Tanggal pembayaran tagihan.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Riwayat Pembayaran Terakhir
          </CardTitle>
          <CardDescription>Berikut adalah beberapa transaksi pembayaran terakhir Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          {customer.paymentHistory && customer.paymentHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal Bayar</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Metode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...customer.paymentHistory]
                  .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                  .slice(0, 5)
                  .map((payment: Payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.paymentDate), 'dd MMM yyyy', { locale: localeId })}</TableCell>
                    <TableCell>
                      {format(new Date(payment.periodStart), 'dd MMM yy', { locale: localeId })} - {format(new Date(payment.periodEnd), 'dd MMM yy', { locale: localeId })}
                    </TableCell>
                    <TableCell className="text-right">Rp {payment.amount.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="capitalize">{payment.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Belum ada riwayat pembayaran.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-6 w-6" />
            Informasi Akun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nama:</span>
            <span className="font-medium">{customer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID Pelanggan:</span>
            <span className="font-medium">{customer.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Alamat:</span>
            <span className="font-medium text-right">{customer.address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">No. Telepon:</span>
            <span className="font-medium">{customer.phoneNumber}</span>
          </div>
           <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{customer.email || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tanggal Bergabung:</span>
            <span className="font-medium">{format(new Date(customer.joinDate), 'dd MMMM yyyy', { locale: localeId })}</span>
          </div>
          {customer.installationDate && (
            <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal Instalasi:</span>
                <span className="font-medium">{format(new Date(customer.installationDate), 'dd MMMM yyyy', { locale: localeId })}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Siklus Tagihan:</span>
            <span className="font-medium">Setiap tanggal {customer.billingCycleDay}</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">
        <p className="font-bold">Perhatian</p>
        <p>Data pelanggan kini diambil dari Firestore. Perubahan pada profil dan pembayaran akan disimpan ke database.</p>
      </div>
    </div>
  );
}
