
'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSignIcon, Info, CheckCircle, XCircle, Loader2, PlusCircle } from "lucide-react"; // Removed Edit2, Added PlusCircle
import type { PaymentWithCustomerInfo } from '@/components/payment/all-payments-table-columns';
import { columns as paymentColumnsDef } from '@/components/payment/all-payments-table-columns';
import { AllPaymentsDataTable } from '@/components/payment/all-payments-data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Payment } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { 
    getPaymentsForAdminAction, 
    confirmPaymentAction, 
    rejectPaymentAction, 
    adminUpdatePaymentAction,
    getCustomersForSelectionAction, // Added
    adminAddPaymentToCustomerAction // Added
} from './actions';
import AdminEditPaymentDialog, { type AdminEditPaymentFormValues } from '@/components/payment/admin-edit-payment-dialog';
import AdminAddPaymentDialog from '@/components/payment/admin-add-payment-dialog'; // Added
import { Button } from '@/components/ui/button'; // Added


const uniquePaymentStatuses: Payment['paymentStatus'][] = ['lunas', 'pending_konfirmasi', 'ditolak'];

export default function AdminPembayaranPage() {
  const { toast } = useToast();
  const [allPaymentsData, setAllPaymentsData] = React.useState<PaymentWithCustomerInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [paymentToEdit, setPaymentToEdit] = React.useState<PaymentWithCustomerInfo | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false); // New state for add dialog
  const [customersForSelection, setCustomersForSelection] = React.useState<{ id: string; name: string; firestoreDocId: string }[]>([]); // New state for customer list


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
      setAllPaymentsData([]); 
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch customers for the selection dropdown
  const fetchCustomersForSelect = React.useCallback(async () => {
    try {
        const customers = await getCustomersForSelectionAction();
        setCustomersForSelection(customers);
    } catch (error) {
        toast({
            title: "Gagal Memuat Pelanggan",
            description: "Tidak dapat memuat daftar pelanggan untuk dipilih.",
            variant: "destructive",
        });
    }
  }, [toast]);

  React.useEffect(() => {
    fetchPayments();
    fetchCustomersForSelect(); 
  }, [fetchPayments, fetchCustomersForSelect]);
  
  const handleConfirmPayment = async (customerCustomId: string, paymentId: string) => {
    const result = await confirmPaymentAction(customerCustomId, paymentId);
    if (result.success) {
      toast({
        title: "Pembayaran Dikonfirmasi",
        description: result.message,
        action: <CheckCircle className="text-green-500" />,
      });
      fetchPayments(); 
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
        action: <XCircle className="text-white" />, 
        variant: "destructive" 
      });
      fetchPayments(); 
    } else {
      toast({
        title: "Gagal Menolak",
        description: result.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    }
  };

  const handleOpenEditPaymentModal = (payment: PaymentWithCustomerInfo) => {
    setPaymentToEdit(payment);
    setIsEditModalOpen(true);
  };

  const handleEditPaymentSubmit = async (paymentId: string, customerId: string, data: AdminEditPaymentFormValues) => {
    const paymentDataToUpdate: Partial<Payment> = {
      ...data,
      paymentDate: data.paymentDate.toISOString(),
      periodStart: data.periodStart.toISOString(),
      periodEnd: data.periodEnd.toISOString(),
    };
    
    const result = await adminUpdatePaymentAction(customerId, paymentId, paymentDataToUpdate);
    if (result.success) {
      toast({
        title: "Pembayaran Diperbarui",
        description: result.message,
      });
      fetchPayments();
      setIsEditModalOpen(false);
      setPaymentToEdit(null);
    } else {
      toast({
        title: "Gagal Memperbarui",
        description: result.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    }
  };
  
  const handleOpenAddPaymentModal = () => { // New handler to open add dialog
    setIsAddModalOpen(true);
  };

  const handleAddPaymentSubmit = async (newPayment: Payment, customerFirestoreDocId: string) => { // New handler for add dialog submit
    const result = await adminAddPaymentToCustomerAction(customerFirestoreDocId, newPayment);
    if (result.success) {
        toast({
            title: "Pembayaran Ditambahkan",
            description: result.message,
        });
        fetchPayments();
        setIsAddModalOpen(false);
    } else {
        toast({
            title: "Gagal Menambahkan Pembayaran",
            description: result.message || "Terjadi kesalahan.",
            variant: "destructive",
        });
    }
  };

  const paymentTableColumns = paymentColumnsDef({ 
    onConfirmPayment: (paymentId, custId) => handleConfirmPayment(custId, paymentId), 
    onRejectPayment: (paymentId, custId) => handleRejectPayment(custId, paymentId),
    onEditPayment: handleOpenEditPaymentModal,
  });

  if (isLoading && allPaymentsData.length === 0) {
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
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <DollarSignIcon className="w-6 h-6" />
                    Manajemen Pembayaran
                </CardTitle>
                <CardDescription>
                    Lihat dan kelola semua riwayat pembayaran pelanggan dari Firestore.
                </CardDescription>
            </div>
            <Button onClick={handleOpenAddPaymentModal}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Pembayaran Manual
            </Button>
        </CardHeader>
        <CardContent>
            <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Informasi Penting</AlertTitle>
                <AlertDescription>
                    Perubahan status atau detail pembayaran yang Anda lakukan di sini akan tersimpan permanen di database Firestore.
                    Jika status pelanggan 'isolir' atau 'baru', dan Anda mengubah status pembayaran menjadi 'lunas', status pelanggan akan otomatis menjadi 'aktif'.
                </AlertDescription>
            </Alert>
          <AllPaymentsDataTable columns={paymentTableColumns} data={allPaymentsData} paymentStatuses={uniquePaymentStatuses} />
        </CardContent>
      </Card>
      {paymentToEdit && (
        <AdminEditPaymentDialog
            isOpen={isEditModalOpen}
            onClose={() => {
                setIsEditModalOpen(false);
                setPaymentToEdit(null);
            }}
            onSubmit={handleEditPaymentSubmit}
            paymentToEdit={paymentToEdit}
        />
      )}
      {/* Render the new AdminAddPaymentDialog */}
      <AdminAddPaymentDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddPaymentSubmit}
        customers={customersForSelection}
      />
    </div>
  );
}
    
