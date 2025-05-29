
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { findCustomerById } from '@/lib/mock-data';
import type { Customer, Payment } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, UploadCloud, Edit, CheckCircle, AlertCircle, Clock } from 'lucide-react'; // Edit for signature
import { format, addMonths, setDate, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import PaymentConfirmationDialog from '@/components/payment/payment-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';

// Helper function to calculate due amount (simplified)
const calculateDueAmount = (customer: Customer): number => {
  if (customer.status === 'berhenti' || customer.status === 'nonaktif') return 0;

  // Check if there's an unpaid or pending payment for the current/previous cycle
  const today = new Date();
  const currentCyclePayment = customer.paymentHistory
    .filter(p => p.paymentStatus === 'lunas')
    .sort((a,b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())[0];

  let hasPaidForCurrentCycle = false;
  if (currentCyclePayment) {
    const periodEnd = new Date(currentCyclePayment.periodEnd);
    if (periodEnd >= today) { // If current lunas payment covers today
        hasPaidForCurrentCycle = true;
    }
  }
  
  // If there's a payment pending confirmation for current cycle, consider amount as 0 for now
  const pendingPaymentForCurrentCycle = customer.paymentHistory.find(p => {
    const periodEndDate = new Date(p.periodEnd);
    const periodStartDate = new Date(p.periodStart);
    // Check if today falls within this payment's period or if the period is the most recent one
    return p.paymentStatus === 'pending_konfirmasi' && periodEndDate >= setDate(startOfMonth(today), customer.billingCycleDay-1) && periodStartDate <= setDate(endOfMonth(today), customer.billingCycleDay);
  });


  if (hasPaidForCurrentCycle || pendingPaymentForCurrentCycle) return 0;
  
  // Fallback to package price if no recent 'lunas' or 'pending' payment found for the current cycle
  if (customer.wifiPackage.includes("10 Mbps")) return 100000;
  if (customer.wifiPackage.includes("20 Mbps")) return 150000;
  if (customer.wifiPackage.includes("30 Mbps")) return 200000;
  if (customer.wifiPackage.includes("50 Mbps")) return 250000;
  if (customer.wifiPackage.includes("100 Mbps")) return 350000;
  return 125000; // Default for "5 Mbps" or "Custom"
};


const getPaymentStatusBadge = (status: Payment['paymentStatus']): React.ReactElement => {
  switch (status) {
    case 'lunas':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Lunas</Badge>;
    case 'pending_konfirmasi':
      return <Badge variant="outline" className="text-yellow-600 border-yellow-500"><Clock className="mr-1 h-3 w-3" />Menunggu Konfirmasi</Badge>;
    case 'ditolak':
      return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Ditolak</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function PelangganTagihanPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;
  const { toast } = useToast();
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const loggedInId = localStorage.getItem('loggedInCustomerId');
    if (!loggedInId || loggedInId !== customerId) {
      router.replace('/login/pelanggan');
      return;
    }
    const fetchedCustomer = findCustomerById(loggedInId);
    if (fetchedCustomer) {
      // Create a deep copy to allow local modifications without affecting mock-data.ts directly
      setCustomer(JSON.parse(JSON.stringify(fetchedCustomer)));
    } else {
      router.replace('/login/pelanggan');
      return;
    }
    setIsLoading(false);
  }, [customerId, router]);

  const handlePaymentConfirmationSubmit = (
    data: Omit<Payment, 'id' | 'periodStart' | 'periodEnd' | 'paymentStatus'> & { proofFileName?: string; signatureDataUrl?: string }
  ) => {
    if (!customer) return;

    const today = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    // Determine billing period for the new payment
    const lastLunasPayment = [...customer.paymentHistory]
      .filter(p => p.paymentStatus === 'lunas')
      .sort((a,b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())[0];

    if (lastLunasPayment) {
        periodStart = addMonths(new Date(lastLunasPayment.periodEnd), 0); 
        periodStart.setDate(new Date(lastLunasPayment.periodEnd).getDate() + 1);

    } else { 
        periodStart = new Date(customer.joinDate);
        if (periodStart.getDate() > customer.billingCycleDay) {
             periodStart = setDate(addMonths(periodStart,1), customer.billingCycleDay);
        } else {
            periodStart = setDate(periodStart, customer.billingCycleDay);
        }
    }
    periodStart = setDate(new Date(periodStart.getFullYear(), periodStart.getMonth(), 1), customer.billingCycleDay);


    periodEnd = addMonths(new Date(periodStart), 1);
    periodEnd.setDate(periodStart.getDate() -1);


    const newPayment: Payment = {
      id: uuidv4(),
      paymentDate: data.paymentDate,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      proofOfPaymentUrl: data.proofFileName ? `https://placehold.co/100x50.png?text=${encodeURIComponent(data.proofFileName)}` : undefined,
      signatureDataUrl: data.signatureDataUrl,
      paymentStatus: 'pending_konfirmasi',
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    };

    setCustomer(prevCustomer => {
      if (!prevCustomer) return null;
      return {
        ...prevCustomer,
        paymentHistory: [...prevCustomer.paymentHistory, newPayment].sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()),
      };
    });
  };

  if (isLoading || !customer) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><p>Memuat data tagihan...</p></div>;
  }

  const dueAmount = calculateDueAmount(customer);
  
  let nextDueDate = new Date();
  const sortedLunasPayments = [...customer.paymentHistory]
    .filter(p => p.paymentStatus === 'lunas')
    .sort((a,b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());

  if (sortedLunasPayments.length > 0) {
    const lastPeriodEnd = new Date(sortedLunasPayments[0].periodEnd);
    nextDueDate = addMonths(lastPeriodEnd,0); 
    nextDueDate.setDate(new Date(lastPeriodEnd).getDate()+1); 
     if (nextDueDate < new Date()) { 
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        nextDueDate.setFullYear(currentYear, currentMonth, customer.billingCycleDay);
        if (nextDueDate < new Date()) { 
            nextDueDate.setMonth(currentMonth + 1);
        }
    }

  } else { 
      const join = new Date(customer.joinDate);
      nextDueDate = setDate(join, customer.billingCycleDay);
      if (join.getDate() > customer.billingCycleDay) { 
        nextDueDate = addMonths(nextDueDate, 1);
      }
      if (nextDueDate < new Date() && new Date(customer.joinDate) < nextDueDate) {
         nextDueDate = addMonths(nextDueDate, 1);
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
              Silakan lakukan pembayaran dan konfirmasi di bawah ini.
            </div>
          </CardContent>
          <CardFooter className="gap-2">
             <Button onClick={() => setIsConfirmationDialogOpen(true)}>
              <UploadCloud className="mr-2 h-4 w-4" /> Konfirmasi Pembayaran
            </Button>
          </CardFooter>
        </Card>
      )}
       {(customer.status === 'aktif' || customer.status === 'baru') && dueAmount === 0 && (
         <Card className="bg-green-50 border-green-500">
            <CardHeader>
                <CardTitle className="text-green-700">Tidak Ada Tagihan</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-green-600">Pembayaran Anda sudah lunas atau menunggu konfirmasi. Terima kasih!</p>
            </CardContent>
         </Card>
       )}
      {customer.status === 'isolir' && dueAmount === 0 && (
         <Card className="bg-yellow-50 border-yellow-500">
            <CardHeader>
                <CardTitle className="text-yellow-700">Pembayaran Menunggu Konfirmasi</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-yellow-600">Satu atau lebih pembayaran Anda sedang menunggu konfirmasi oleh Admin. Status layanan akan diperbarui setelah dikonfirmasi.</p>
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
                    <TableHead>Periode</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bukti</TableHead>
                    <TableHead>Tanda Tangan</TableHead>
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
                        {getPaymentStatusBadge(payment.paymentStatus)}
                      </TableCell>
                       <TableCell>
                        {payment.proofOfPaymentUrl ? (
                          <a 
                            href={payment.proofOfPaymentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                            onClick={(e) => {
                                if (payment.proofOfPaymentUrl?.startsWith('https://placehold.co')) {
                                    // This is a placeholder, prevent default and show toast
                                } else if (!payment.proofOfPaymentUrl?.startsWith('http')) {
                                     e.preventDefault();
                                     toast({ title: "Info", description: `Bukti: ${payment.proofOfPaymentUrl}`});
                                }
                                // else allow normal link behavior for real URLs
                            }}
                            >
                            Lihat Bukti
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.signatureDataUrl ? (
                            <div className="text-xs text-muted-foreground italic flex items-center gap-1">
                                <Edit className="h-3 w-3" /> 
                                {payment.signatureDataUrl.split(': ')[1] || payment.signatureDataUrl}
                            </div>
                        ) : payment.paymentMethod === 'cash' ? (
                            <span className="text-xs text-muted-foreground italic">Tidak ada</span>
                        ) : (
                           '-'
                        )}
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
      <PaymentConfirmationDialog
        isOpen={isConfirmationDialogOpen}
        onClose={() => setIsConfirmationDialogOpen(false)}
        onSubmit={handlePaymentConfirmationSubmit}
        defaultAmount={dueAmount > 0 ? dueAmount : (customer ? (calculateDueAmount(customer) || 100000) : 100000)} // Fallback amount
      />
    </div>
  );
}
