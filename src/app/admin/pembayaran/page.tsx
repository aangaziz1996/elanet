
'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSignIcon, Info, CheckCircle, XCircle } from "lucide-react";
import { getInitialCustomers, getAllPaymentsFromCustomers } from '@/lib/mock-data'; 
import type { PaymentWithCustomerInfo } from '@/components/payment/all-payments-table-columns';
import { columns as paymentColumnsDef } from '@/components/payment/all-payments-table-columns';
import { AllPaymentsDataTable } from '@/components/payment/all-payments-data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Payment, Customer } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';

const uniquePaymentStatuses: Payment['paymentStatus'][] = ['lunas', 'pending_konfirmasi', 'ditolak'];

export default function AdminPembayaranPage() {
  const { toast } = useToast();
  // Manage both customers and payments in state to reflect updates
  const [customersData, setCustomersData] = React.useState<Customer[]>(() => getInitialCustomers());
  const [allPaymentsData, setAllPaymentsData] = React.useState<PaymentWithCustomerInfo[]>(() => getAllPaymentsFromCustomers(customersData));

  // Effect to update payments if customersData changes (e.g. by an external factor, though not in this mock setup)
  React.useEffect(() => {
    setAllPaymentsData(getAllPaymentsFromCustomers(customersData));
  }, [customersData]);
  
  const handleConfirmPayment = (paymentId: string) => {
    let customerToUpdateId: string | null = null;

    setAllPaymentsData(prevPayments => 
      prevPayments.map(p => {
        if (p.id === paymentId && p.paymentStatus === 'pending_konfirmasi') {
          customerToUpdateId = p.customerId; // Store customer ID for status update
          return { ...p, paymentStatus: 'lunas' };
        }
        return p;
      })
    );

    if (customerToUpdateId) {
      const finalCustomerId = customerToUpdateId; // Ensure closure capture
      setCustomersData(prevCustomers => 
        prevCustomers.map(c => {
          if (c.id === finalCustomerId && (c.status === 'isolir' || c.status === 'baru')) {
            return { ...c, status: 'aktif' };
          }
          return c;
        })
      );
       toast({
        title: "Pembayaran Dikonfirmasi",
        description: "Status pembayaran telah diubah menjadi LUNAS. Status pelanggan terkait juga telah diperbarui jika perlu.",
        variant: "default",
        action: <CheckCircle className="text-green-500" />,
      });
    } else {
         toast({
            title: "Error",
            description: "Gagal mengkonfirmasi pembayaran atau pelanggan tidak ditemukan.",
            variant: "destructive",
         });
    }
  };

  const handleRejectPayment = (paymentId: string) => {
    setAllPaymentsData(prevPayments => 
      prevPayments.map(p => {
        if (p.id === paymentId && p.paymentStatus === 'pending_konfirmasi') {
          return { ...p, paymentStatus: 'ditolak' };
        }
        return p;
      })
    );
    toast({
      title: "Pembayaran Ditolak",
      description: "Status pembayaran telah diubah menjadi DITOLAK.",
      variant: "destructive",
      action: <XCircle className="text-white" />,
    });
  };
  
  const paymentTableColumns = paymentColumnsDef({ onConfirmPayment: handleConfirmPayment, onRejectPayment: handleRejectPayment });

  return (
    <div className="container mx-auto py-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="w-6 h-6" />
            Manajemen Pembayaran
          </CardTitle>
          <CardDescription>
            Lihat dan kelola semua riwayat pembayaran pelanggan. Anda dapat mengkonfirmasi atau menolak pembayaran yang pending.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Informasi Penting (Simulasi)</AlertTitle>
                <AlertDescription>
                    Perubahan status pembayaran dan pelanggan yang Anda lakukan di sini hanya akan tersimpan dalam sesi browser ini (mock data).
                    Status pelanggan akan otomatis diperbarui menjadi 'Aktif' jika pembayaran dikonfirmasi dan status sebelumnya adalah 'Isolir' atau 'Baru'.
                </AlertDescription>
            </Alert>
          <AllPaymentsDataTable columns={paymentTableColumns} data={allPaymentsData} paymentStatuses={uniquePaymentStatuses} />
        </CardContent>
      </Card>
    </div>
  );
}
