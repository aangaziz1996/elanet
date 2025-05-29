
'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSignIcon, Info } from "lucide-react";
import { getAllPayments } from '@/lib/mock-data'; // Import function to get all payments
import type { PaymentWithCustomerInfo } from '@/components/payment/all-payments-table-columns';
import { columns as paymentColumns } from '@/components/payment/all-payments-table-columns';
import { AllPaymentsDataTable } from '@/components/payment/all-payments-data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Payment } from '@/types/customer';

const uniquePaymentStatuses: Payment['paymentStatus'][] = ['lunas', 'pending_konfirmasi', 'ditolak'];


export default function AdminPembayaranPage() {
  const [allPaymentsData, setAllPaymentsData] = React.useState<PaymentWithCustomerInfo[]>([]);
  
  React.useEffect(() => {
    // In a real app, you'd fetch this data. For now, we use mock data.
    setAllPaymentsData(getAllPayments());
  }, []);

  // TODO: Add functionality to record new payments, confirm/reject pending payments.

  return (
    <div className="container mx-auto py-2">
       {/* Title is handled by AdminLayout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="w-6 h-6" />
            Manajemen Pembayaran
          </CardTitle>
          <CardDescription>
            Lihat semua riwayat pembayaran pelanggan. Fitur untuk menambah dan mengelola pembayaran akan ditambahkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Informasi</AlertTitle>
                <AlertDescription>
                    Saat ini halaman ini hanya menampilkan data pembayaran. Fitur untuk mengelola (konfirmasi/tolak) pembayaran atau mencatat pembayaran baru oleh admin belum diimplementasikan.
                    Status pelanggan (misalnya 'isolir') belum otomatis diperbarui berdasarkan status pembayaran di tabel ini.
                </AlertDescription>
            </Alert>
          <AllPaymentsDataTable columns={paymentColumns} data={allPaymentsData} paymentStatuses={uniquePaymentStatuses} />
        </CardContent>
      </Card>
    </div>
  );
}
