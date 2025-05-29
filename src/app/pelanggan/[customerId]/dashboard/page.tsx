
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { findCustomerById } from '@/lib/mock-data';
import type { Customer, Payment } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Wifi, UserCircle, CalendarDays, Info, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

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


export default function PelangganDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;
  const { toast } = useToast();
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // This is a basic client-side check for "privacy".
    // In a real app, this would be handled by middleware and server-side auth.
    const loggedInId = localStorage.getItem('loggedInCustomerId');
    if (!loggedInId || loggedInId !== customerId) {
      toast({
        title: 'Akses Ditolak',
        description: 'Anda tidak diizinkan melihat halaman ini atau sesi Anda telah berakhir.',
        variant: 'destructive',
      });
      router.replace('/login/pelanggan');
      return;
    }

    const fetchedCustomer = findCustomerById(loggedInId);
    if (fetchedCustomer) {
      setCustomer(fetchedCustomer);
    } else {
      toast({
        title: 'Error',
        description: 'Gagal memuat data pelanggan.',
        variant: 'destructive',
      });
      localStorage.removeItem('loggedInCustomerId'); // Clean up bad state
      router.replace('/login/pelanggan');
      return;
    }
    setIsLoading(false);
  }, [customerId, router, toast]);

  if (isLoading || !customer) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <p className="text-muted-foreground">Memuat dashboard pelanggan...</p>
      </div>
    );
  }
  
  const statusInfo = getStatusInfo(customer.status);
  const nextDueDate = new Date(); // Placeholder, should be calculated based on billingCycleDay and last payment
  if (customer.paymentHistory.length > 0) {
    const lastPayment = customer.paymentHistory.sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
    const lastPeriodEnd = new Date(lastPayment.periodEnd);
    nextDueDate.setDate(lastPeriodEnd.getDate() + 1); // Day after last period ends
    if (nextDueDate < new Date()) { // If it's in the past, advance to next month based on billing cycle day
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        nextDueDate.setFullYear(currentYear);
        nextDueDate.setMonth(currentMonth);
        nextDueDate.setDate(customer.billingCycleDay);
        if (nextDueDate < new Date()) { // If still in past (e.g. today is 20th, billing day is 15th)
            nextDueDate.setMonth(currentMonth + 1);
        }
    }

  } else {
      // New customer, due date is based on joinDate and billingCycleDay
      const join = new Date(customer.joinDate);
      nextDueDate.setFullYear(join.getFullYear());
      nextDueDate.setMonth(join.getMonth()); // First bill usually in the month of joining or next
      nextDueDate.setDate(customer.billingCycleDay);
      if (join.getDate() > customer.billingCycleDay) { // If joined after billing day this month
        nextDueDate.setMonth(join.getMonth() + 1);
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
          {customer.paymentHistory.length > 0 ? (
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
                {customer.paymentHistory.slice(0, 5).map((payment: Payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.paymentDate), 'dd MMM yyyy', { locale: localeId })}</TableCell>
                    <TableCell>
                      {format(new Date(payment.periodStart), 'dd MMM yy', { locale: localeId })} - {format(new Date(payment.periodEnd), 'dd MMM yy', { locale: localeId })}
                    </TableCell>
                    <TableCell className="text-right">Rp {payment.amount.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="capitalize">{payment.paymentMethod || 'N/A'}</TableCell>
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
        <p>Ini adalah implementasi demo. Fitur login dan privasi pelanggan saat ini disimulasikan menggunakan penyimpanan lokal browser dan belum aman untuk penggunaan produksi.</p>
      </div>
    </div>
  );
}
