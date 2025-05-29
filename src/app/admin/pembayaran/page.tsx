
'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSignIcon, Info, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { PaymentWithCustomerInfo } from '@/components/payment/all-payments-table-columns';
import { columns as paymentColumnsDef } from '@/components/payment/all-payments-table-columns';
import { AllPaymentsDataTable } from '@/components/payment/all-payments-data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Payment } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { getPaymentsForAdminAction, confirmPaymentAction, rejectPaymentAction } from './actions';

const uniquePaymentStatuses: Payment['paymentStatus'][] = ['lunas', 'pending_konfirmasi', 'ditolak'];

export default function AdminPembayaranPage() {
  const { toast } = useToast();
  const [allPaymentsData, setAllPaymentsData] = React.useState<PaymentWithCustomerInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchPayments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const payments = await getPaymentsForAdminAction();
      setAllPaymentsData(payments);
    } catch (error) {
      toast({
        title: "Gagal Memuat Pembayaran",
        description: "Terjadi kesalahan saat mengambil data pembayaran dari server.",
        variant: "destructive",
      });
      setAllPaymentsData([]); // Ensure it's an empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);
  
  const handleConfirmPayment = async (customerCustomId: string, paymentId: string) => {
    const result = await confirmPaymentAction(customerCustomId, paymentId);
    if (result.success) {
      toast({
        title: "Pembayaran Dikonfirmasi",
        description: result.message,
        action: <CheckCircle className="text-green-500" />,
      });
      fetchPayments(); // Re-fetch to update the list
    } else {
      toast({
        title: "Gagal Konfirmasi",
        description: result.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    }
  };

  const handleRejectPayment = async (customerCustomId: string, paymentId: string) => {
    const result = await rejectPaymentAction(customerCustomId, paymentId);
     if (result.success) {
      toast({
        title: "Pembayaran Ditolak",
        description: result.message,
        action: <XCircle className="text-white" />, // Assuming destructive variant has dark bg for white icon
        variant: "destructive" 
      });
      fetchPayments(); // Re-fetch to update the list
    } else {
      toast({
        title: "Gagal Menolak",
        description: result.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    }
  };
  
  // Pass customerCustomId to the handlers
  const paymentTableColumns = paymentColumnsDef({ 
    onConfirmPayment: (paymentId, custId) => handleConfirmPayment(custId, paymentId), 
    onRejectPayment: (paymentId, custId) => handleRejectPayment(custId, paymentId) 
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Memuat data pembayaran...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="w-6 h-6" />
            Manajemen Pembayaran
          </CardTitle>
          <CardDescription>
            Lihat dan kelola semua riwayat pembayaran pelanggan dari Firestore. Anda dapat mengkonfirmasi atau menolak pembayaran yang pending.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Informasi Penting (Data Firestore)</AlertTitle>
                <AlertDescription>
                    Perubahan status pembayaran dan pelanggan yang Anda lakukan di sini akan tersimpan secara permanen di database Firestore.
                    Status pelanggan akan otomatis diperbarui menjadi 'Aktif' jika pembayaran dikonfirmasi dan status pelanggan sebelumnya adalah 'Isolir' atau 'Baru'.
                </AlertDescription>
            </Alert>
          <AllPaymentsDataTable columns={paymentTableColumns} data={allPaymentsData} paymentStatuses={uniquePaymentStatuses} />
        </CardContent>
      </Card>
    </div>
  );
}
    