
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Customer, Payment } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, UploadCloud, Edit, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { format, addMonths, setDate, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import PaymentConfirmationDialog from '@/components/payment/payment-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { getCustomerDetailsAction, addPaymentConfirmationAction } from './actions';

// Helper function to calculate due amount (simplified)
const calculateDueAmount = (customer: Customer): number => {
  if (!customer || customer.status === 'berhenti' || customer.status === 'nonaktif') return 0;

  const today = new Date();
  
  const lastLunasPayment = [...(customer.paymentHistory || [])]
    .filter(p => p.paymentStatus === 'lunas')
    .sort((a,b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())[0];

  let hasPaidForCurrentBillingCycle = false;
  if (lastLunasPayment) {
    const periodEnd = new Date(lastLunasPayment.periodEnd);
     // Check if the last lunas payment covers up to or beyond the start of the current billing day for *this* month
    const currentBillingCycleStartDateThisMonth = setDate(startOfMonth(today), customer.billingCycleDay);
    if (periodEnd >= currentBillingCycleStartDateThisMonth) {
        hasPaidForCurrentBillingCycle = true;
    }
  }
  
  const pendingPaymentForCurrentCycle = (customer.paymentHistory || []).find(p => {
    const periodEndDate = new Date(p.periodEnd);
    // Check if pending payment's period end is on or after this month's billing cycle start
    const currentBillingCycleStartDateThisMonth = setDate(startOfMonth(today), customer.billingCycleDay);
    return p.paymentStatus === 'pending_konfirmasi' && periodEndDate >= currentBillingCycleStartDateThisMonth;
  });


  if (hasPaidForCurrentBillingCycle || pendingPaymentForCurrentCycle) return 0;
  
  // Fallback to package name if specific logic is complex for mock
  if (customer.wifiPackage.includes("10 Mbps")) return 100000;
  if (customer.wifiPackage.includes("20 Mbps")) return 150000;
  if (customer.wifiPackage.includes("30 Mbps")) return 200000;
  if (customer.wifiPackage.includes("50 Mbps")) return 250000;
  if (customer.wifiPackage.includes("100 Mbps")) return 350000;
  return 125000; 
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

interface PelangganPageProps {
  customerDataFromLayout?: Customer | null;
}

export default function PelangganTagihanPage({ customerDataFromLayout }: PelangganPageProps) {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;
  const { toast } = useToast();
  const [customer, setCustomer] = React.useState<Customer | null>(customerDataFromLayout || null);
  const [isLoading, setIsLoading] = React.useState(!customerDataFromLayout);
  const [isSubmittingPayment, setIsSubmittingPayment] = React.useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = React.useState(false);

  const fetchCustomerData = React.useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    const result = await getCustomerDetailsAction(customerId);
    if (result.success && result.customer) {
      setCustomer(result.customer);
    } else {
      toast({
        title: 'Error',
        description: result.message || 'Gagal memuat data tagihan.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  }, [customerId, toast]);

  React.useEffect(() => {
    const loggedInId = localStorage.getItem('loggedInCustomerId');
    if (!loggedInId || loggedInId !== customerId) {
      router.replace('/login/pelanggan');
      return;
    }
    if (!customerDataFromLayout) {
      fetchCustomerData();
    } else {
      setCustomer(customerDataFromLayout);
      setIsLoading(false);
    }
  }, [customerId, router, customerDataFromLayout, fetchCustomerData]);

  const handlePaymentConfirmationSubmit = async (
    data: Omit<Payment, 'id' | 'periodStart' | 'periodEnd' | 'paymentStatus'> & { proofFileName?: string; signatureDataUrl?: string }
  ) => {
    if (!customer) return;
    setIsSubmittingPayment(true);

    const today = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    const lastLunasOrPendingPayment = [...(customer.paymentHistory || [])]
      .filter(p => p.paymentStatus === 'lunas' || p.paymentStatus === 'pending_konfirmasi')
      .sort((a,b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())[0];

    if (lastLunasOrPendingPayment) {
        periodStart = new Date(lastLunasOrPendingPayment.periodEnd);
        periodStart.setDate(periodStart.getDate() + 1); // Start day after last period ends
    } else { 
        periodStart = new Date(customer.joinDate); // First payment
        // Align to billingCycleDay for the first payment month
        const joinDay = periodStart.getDate();
        if (joinDay > customer.billingCycleDay) {
            periodStart = setDate(addMonths(periodStart,1), customer.billingCycleDay);
        } else {
            periodStart = setDate(periodStart, customer.billingCycleDay);
        }
    }
    // Ensure periodStart is not in the past unnecessarily, adjust to current/next cycle if needed.
    // This logic assumes billing cycle day is consistent.
    // If periodStart calculated is in the past relative to "today", it might mean they missed payments.
    // The `calculateDueAmount` and `nextDueDate` should handle what's currently owed.
    // For a *new* payment being submitted, its period should generally follow the last paid one or be the current cycle.
    
    // For simplicity, let's base periodStart on nextDueDate calculation if it's clearer
    let calculatedNextDueDate = new Date(); // Recalculate nextDueDate for this submission context
    const sortedLunasPayments = [...(customer.paymentHistory || [])]
      .filter(p => p.paymentStatus === 'lunas')
      .sort((a,b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());

    if (sortedLunasPayments.length > 0) {
        const lastPeriodEnd = new Date(sortedLunasPayments[0].periodEnd);
        calculatedNextDueDate = new Date(lastPeriodEnd);
        calculatedNextDueDate.setDate(calculatedNextDueDate.getDate() + 1);
        if (calculatedNextDueDate < new Date()) { 
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            calculatedNextDueDate.setFullYear(currentYear, currentMonth, customer.billingCycleDay);
            if (calculatedNextDueDate < new Date()) { 
                calculatedNextDueDate.setMonth(currentMonth + 1);
            }
        }
    } else { 
        const join = new Date(customer.joinDate);
        calculatedNextDueDate = setDate(join, customer.billingCycleDay);
        if (join.getDate() > customer.billingCycleDay) { 
            calculatedNextDueDate = addMonths(calculatedNextDueDate, 1);
        }
        if (calculatedNextDueDate < new Date() && new Date(customer.joinDate) < calculatedNextDueDate) {
            calculatedNextDueDate = addMonths(calculatedNextDueDate, 1);
        }
    }
    periodStart = new Date(calculatedNextDueDate); // Use the calculated start of the due period
    periodEnd = addMonths(new Date(periodStart), 1);
    periodEnd.setDate(periodStart.getDate() - 1);


    const newPayment: Payment = {
      id: uuidv4(),
      paymentDate: data.paymentDate, // This is already an ISO string from dialog
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      proofOfPaymentUrl: data.proofFileName ? `mock_proof_${data.proofFileName}` : undefined, // Store actual URL in real app
      signatureDataUrl: data.signatureDataUrl,
      paymentStatus: 'pending_konfirmasi',
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    };

    const result = await addPaymentConfirmationAction(customer.id, newPayment);
    if (result.success) {
      toast({ title: 'Konfirmasi Terkirim', description: result.message });
      fetchCustomerData(); // Re-fetch customer data to update payment history
      setIsConfirmationDialogOpen(false);
    } else {
      toast({ title: 'Gagal', description: result.message || 'Terjadi kesalahan.', variant: 'destructive' });
    }
    setIsSubmittingPayment(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Memuat data tagihan...</p>
    </div>;
  }

  if (!customer && !isLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <p className="text-destructive mb-4">Data tagihan tidak dapat dimuat.</p>
        <Button onClick={() => router.push('/login/pelanggan')}>Kembali ke Login</Button>
      </div>
    );
  }
  
  const dueAmount = calculateDueAmount(customer);
  
  let nextDueDate = new Date();
  const sortedLunasPayments = [...(customer.paymentHistory || [])]
    .filter(p => p.paymentStatus === 'lunas')
    .sort((a,b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());

  if (sortedLunasPayments.length > 0) {
    const lastPeriodEnd = new Date(sortedLunasPayments[0].periodEnd);
    nextDueDate = new Date(lastPeriodEnd);
    nextDueDate.setDate(nextDueDate.getDate() + 1); 
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
              Silakan lakukan pembayaran sesuai metode yang Anda pilih, lalu konfirmasikan di bawah ini.
            </div>
          </CardContent>
          <CardFooter className="gap-2">
             <Button onClick={() => setIsConfirmationDialogOpen(true)} disabled={isSubmittingPayment}>
              {isSubmittingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          {customer.paymentHistory && customer.paymentHistory.length > 0 ? (
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
                  {[...(customer.paymentHistory || [])]
                    .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                    .map((payment: Payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(parseISO(payment.paymentDate), 'dd MMM yyyy', { locale: localeId })}</TableCell>
                      <TableCell>
                        {format(parseISO(payment.periodStart), 'dd/MM/yy')} - {format(parseISO(payment.periodEnd), 'dd/MM/yy')}
                      </TableCell>
                       <TableCell className="capitalize">
                        {payment.paymentMethod?.replace(/_/g, ' ') || 'N/A'}
                       </TableCell>
                      <TableCell className="text-right">Rp {payment.amount.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(payment.paymentStatus)}
                      </TableCell>
                       <TableCell>
                        {payment.proofOfPaymentUrl ? (
                          <a 
                            href={payment.proofOfPaymentUrl.startsWith('http') ? payment.proofOfPaymentUrl : undefined} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`text-sm text-primary hover:underline ${!payment.proofOfPaymentUrl.startsWith('http') ? 'cursor-default pointer-events-none opacity-70' : ''}`}
                            onClick={(e) => {
                                if (payment.proofOfPaymentUrl?.startsWith('mock_proof_')) {
                                     e.preventDefault();
                                     toast({ title: "Info Bukti (Mock)", description: `File: ${payment.proofOfPaymentUrl.replace('mock_proof_', '')}`});
                                } else if (!payment.proofOfPaymentUrl?.startsWith('http')) {
                                     e.preventDefault(); // Should not happen if logic above is correct
                                     toast({ title: "Info", description: `Bukti: ${payment.proofOfPaymentUrl}`});
                                }
                            }}
                            >
                            {payment.proofOfPaymentUrl.startsWith('mock_proof_') ? `Lihat (${payment.proofOfPaymentUrl.replace('mock_proof_', '').substring(0,10)}...)` : 'Lihat Bukti'}
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
                        ) : payment.paymentMethod === 'tunai_kolektor' ? (
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
        defaultAmount={dueAmount > 0 ? dueAmount : (customer ? (calculateDueAmount(customer) || 100000) : 100000)}
      />
    </div>
  );
}
