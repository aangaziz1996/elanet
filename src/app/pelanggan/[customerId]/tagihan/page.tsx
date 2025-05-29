
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { findCustomerById } from '@/lib/mock-data';
import type { Customer, Payment } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, UploadCloud, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// Helper function to calculate due amount (simplified)
const calculateDueAmount = (customer: Customer): number => {
  // This is a very simplified calculation.
  // A real system would look at package price, pro-rata, discounts, etc.
  if (customer.status === 'aktif' || customer.status === 'baru' || customer.status === 'isolir') {
    if (customer.wifiPackage.includes("10 Mbps")) return 100000;
    if (customer.wifiPackage.includes("20 Mbps")) return 150000;
    if (customer.wifiPackage.includes("30 Mbps")) return 200000;
    if (customer.wifiPackage.includes("50 Mbps")) return 250000;
    if (customer.wifiPackage.includes("100 Mbps")) return 350000;
    return 125000; // Default for "5 Mbps" or "Custom"
  }
  return 0;
};


export default function PelangganTagihanPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;
  const { toast } = useToast();
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loggedInId = localStorage.getItem('loggedInCustomerId');
    if (!loggedInId || loggedInId !== customerId) {
      router.replace('/login/pelanggan');
      return;
    }
    const fetchedCustomer = findCustomerById(loggedInId);
    if (fetchedCustomer) {
      setCustomer(fetchedCustomer);
    } else {
      router.replace('/login/pelanggan');
      return;
    }
    setIsLoading(false);
  }, [customerId, router]);

  const handleUploadProof = () => {
    // Mock upload
    toast({
      title: 'Fitur Segera Hadir',
      description: 'Upload bukti pembayaran akan segera tersedia.',
    });
  };
  
  const handlePayOnline = () => {
     toast({
      title: 'Fitur Segera Hadir',
      description: 'Pembayaran online akan terintegrasi di sini.',
    });
  };


  if (isLoading || !customer) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><p>Memuat data tagihan...</p></div>;
  }

  const dueAmount = calculateDueAmount(customer);
  const nextDueDate = new Date(); // Placeholder from dashboard
  if (customer.paymentHistory.length > 0) {
    const lastPayment = customer.paymentHistory.sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
    const lastPeriodEnd = new Date(lastPayment.periodEnd);
    nextDueDate.setDate(lastPeriodEnd.getDate() + 1);
    if (nextDueDate < new Date()) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        nextDueDate.setFullYear(currentYear);
        nextDueDate.setMonth(currentMonth);
        nextDueDate.setDate(customer.billingCycleDay);
        if (nextDueDate < new Date()) {
            nextDueDate.setMonth(currentMonth + 1);
        }
    }
  } else {
      const join = new Date(customer.joinDate);
      nextDueDate.setFullYear(join.getFullYear());
      nextDueDate.setMonth(join.getMonth());
      nextDueDate.setDate(customer.billingCycleDay);
      if (join.getDate() > customer.billingCycleDay) {
        nextDueDate.setMonth(join.getMonth() + 1);
      }
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tagihan & Pembayaran</h1>

      {customer.status !== 'berhenti' && customer.status !== 'nonaktif' && dueAmount > 0 && (
        <Card className="bg-primary/5 border-primary">
          <CardHeader>
            <CardTitle className="text-primary">Tagihan Saat Ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg">Jumlah Tagihan:</span>
              <span className="text-2xl font-bold text-primary">Rp {dueAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Jatuh Tempo:</span>
              <span className="text-sm font-medium">{format(nextDueDate, 'dd MMMM yyyy', { locale: localeId })}</span>
            </div>
             <div className="text-xs text-muted-foreground pt-2">
              Pembayaran dapat dilakukan melalui transfer bank ke rekening ELANET atau metode lain yang tersedia.
              Silakan konfirmasi pembayaran Anda setelahnya.
            </div>
          </CardContent>
          <CardFooter className="gap-2">
             <Button onClick={handlePayOnline} disabled>
              <CreditCard className="mr-2 h-4 w-4" /> Bayar Online (Segera)
            </Button>
            <Button variant="outline" onClick={handleUploadProof} disabled>
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Bukti (Segera)
            </Button>
          </CardFooter>
        </Card>
      )}
       {customer.status === 'aktif' && dueAmount === 0 && (
         <Card className="bg-green-50 border-green-500">
            <CardHeader>
                <CardTitle className="text-green-700">Tidak Ada Tagihan</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-green-600">Pembayaran Anda sudah lunas. Terima kasih!</p>
            </CardContent>
         </Card>
       )}


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Riwayat Pembayaran
          </CardTitle>
          <CardDescription>Daftar semua transaksi pembayaran Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          {customer.paymentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal Bayar</TableHead>
                    <TableHead>Periode Langganan</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.paymentHistory.map((payment: Payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.paymentDate), 'dd MMM yyyy', { locale: localeId })}</TableCell>
                      <TableCell>
                        {format(new Date(payment.periodStart), 'dd/MM/yy')} - {format(new Date(payment.periodEnd), 'dd/MM/yy')}
                      </TableCell>
                       <TableCell className="capitalize">{payment.paymentMethod || 'N/A'}</TableCell>
                      <TableCell className="text-right">Rp {payment.amount.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <Badge variant="default">Lunas</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground py-4 text-center">Belum ada riwayat pembayaran.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
