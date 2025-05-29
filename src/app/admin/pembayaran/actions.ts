
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, Timestamp, runTransaction, query, where, arrayUnion, getDoc } from 'firebase/firestore';
import type { Customer, Payment } from '@/types/customer';
import type { PaymentWithCustomerInfo } from '@/components/payment/all-payments-table-columns';

// Helper to convert Firestore Timestamps to ISO strings for dates
const convertTimestampsToISO = (data: any): any => {
  if (!data) return data;
  const result = { ...data };
  for (const key in result) {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate().toISOString();
    } else if (Array.isArray(result[key])) {
      result[key] = result[key].map((item: any) => {
        if (typeof item === 'object' && item !== null && !(item instanceof Timestamp)) {
          return convertTimestampsToISO(item);
        }
        return item;
      });
    } else if (typeof result[key] === 'object' && result[key] !== null && !(result[key] instanceof Timestamp)) {
      result[key] = convertTimestampsToISO(result[key]);
    }
  }
  return result;
};


export async function getPaymentsForAdminAction(): Promise<PaymentWithCustomerInfo[]> {
  try {
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    const allPayments: PaymentWithCustomerInfo[] = [];

    customersSnapshot.forEach((customerDoc) => {
      const customerData = customerDoc.data() as Omit<Customer, 'paymentHistory'> & { paymentHistory?: Payment[]};
      const customerId = customerData.id; 
      const customerName = customerData.name;
      const customerFirestoreDocId = customerDoc.id; // Firestore document ID
      
      if (customerData.paymentHistory && Array.isArray(customerData.paymentHistory)) {
        customerData.paymentHistory.forEach(payment => {
          const paymentWithConvertedDates = convertTimestampsToISO(payment) as Payment;
          allPayments.push({
            ...paymentWithConvertedDates,
            customerId: customerId, 
            customerName: customerName,
            customerFirestoreDocId: customerFirestoreDocId, // Pass Firestore doc ID for updates
          });
        });
      }
    });
    return allPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  } catch (error) {
    console.error("Error fetching payments for admin: ", error);
    return [];
  }
}

interface PaymentUpdateResult {
  success: boolean;
  message: string;
}

export async function confirmPaymentAction(customerCustomId: string, paymentId: string): Promise<PaymentUpdateResult> {
  try {
    const customersCol = collection(db, 'customers');
    const q = query(customersCol, where('id', '==', customerCustomId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: `Pelanggan dengan ID ${customerCustomId} tidak ditemukan.` };
    }
    const actualCustomerDocRef = querySnapshot.docs[0].ref;

    await runTransaction(db, async (transaction) => {
      const customerDoc = await transaction.get(actualCustomerDocRef);
      if (!customerDoc.exists()) {
        throw new Error("Dokumen pelanggan tidak ditemukan!");
      }

      const customerData = customerDoc.data() as Customer;
      const paymentHistory = customerData.paymentHistory || [];
      const paymentIndex = paymentHistory.findIndex(p => p.id === paymentId);

      if (paymentIndex === -1) {
        throw new Error("Pembayaran tidak ditemukan dalam riwayat pelanggan.");
      }

      if (paymentHistory[paymentIndex].paymentStatus !== 'pending_konfirmasi') {
        throw new Error("Hanya pembayaran dengan status 'pending_konfirmasi' yang bisa dikonfirmasi.");
      }

      paymentHistory[paymentIndex].paymentStatus = 'lunas';
      const updates: Partial<Customer> = { paymentHistory };

      if (customerData.status === 'isolir' || customerData.status === 'baru') {
        updates.status = 'aktif';
      }
      
      transaction.update(actualCustomerDocRef, updates);
    });

    revalidatePath('/admin/pembayaran');
    revalidatePath(`/pelanggan/dashboard`); 
    revalidatePath(`/pelanggan/tagihan`);   
    return { success: true, message: `Pembayaran ${paymentId} untuk pelanggan ${customerCustomId} berhasil dikonfirmasi.` };

  } catch (error) {
    console.error("Error confirming payment: ", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui.";
    return { success: false, message: `Gagal mengkonfirmasi pembayaran: ${errorMessage}` };
  }
}


export async function rejectPaymentAction(customerCustomId: string, paymentId: string): Promise<PaymentUpdateResult> {
  try {
    const customersCol = collection(db, 'customers');
    const q = query(customersCol, where('id', '==', customerCustomId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: `Pelanggan dengan ID ${customerCustomId} tidak ditemukan.` };
    }
    const actualCustomerDocRef = querySnapshot.docs[0].ref;

    await runTransaction(db, async (transaction) => {
      const customerDoc = await transaction.get(actualCustomerDocRef);
      if (!customerDoc.exists()) {
        throw new Error("Dokumen pelanggan tidak ditemukan!");
      }

      const customerData = customerDoc.data() as Customer;
      const paymentHistory = customerData.paymentHistory || [];
      const paymentIndex = paymentHistory.findIndex(p => p.id === paymentId);

      if (paymentIndex === -1) {
        throw new Error("Pembayaran tidak ditemukan dalam riwayat pelanggan.");
      }

       if (paymentHistory[paymentIndex].paymentStatus !== 'pending_konfirmasi') {
        throw new Error("Hanya pembayaran dengan status 'pending_konfirmasi' yang bisa ditolak.");
      }

      paymentHistory[paymentIndex].paymentStatus = 'ditolak';
      
      transaction.update(actualCustomerDocRef, { paymentHistory });
    });
    
    revalidatePath('/admin/pembayaran');
    return { success: true, message: `Pembayaran ${paymentId} untuk pelanggan ${customerCustomId} berhasil ditolak.` };

  } catch (error) {
    console.error("Error rejecting payment: ", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui.";
    return { success: false, message: `Gagal menolak pembayaran: ${errorMessage}` };
  }
}

export async function adminUpdatePaymentAction(
  customerCustomId: string, 
  paymentId: string, 
  updatedPaymentData: Partial<Payment>
): Promise<PaymentUpdateResult> {
  try {
    const customersCol = collection(db, 'customers');
    const q = query(customersCol, where('id', '==', customerCustomId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: `Pelanggan dengan ID ${customerCustomId} tidak ditemukan.` };
    }
    const actualCustomerDocRef = querySnapshot.docs[0].ref;

    await runTransaction(db, async (transaction) => {
      const customerDoc = await transaction.get(actualCustomerDocRef);
      if (!customerDoc.exists()) {
        throw new Error("Dokumen pelanggan tidak ditemukan!");
      }

      const customerData = customerDoc.data() as Customer;
      const paymentHistory = customerData.paymentHistory || [];
      const paymentIndex = paymentHistory.findIndex(p => p.id === paymentId);

      if (paymentIndex === -1) {
        throw new Error("Pembayaran tidak ditemukan dalam riwayat pelanggan.");
      }

      // Merge updated fields into the existing payment record
      paymentHistory[paymentIndex] = { 
        ...paymentHistory[paymentIndex], 
        ...updatedPaymentData,
        // Ensure dates are stored as ISO strings if they come from form as Date objects
        paymentDate: updatedPaymentData.paymentDate ? new Date(updatedPaymentData.paymentDate).toISOString() : paymentHistory[paymentIndex].paymentDate,
        periodStart: updatedPaymentData.periodStart ? new Date(updatedPaymentData.periodStart).toISOString() : paymentHistory[paymentIndex].periodStart,
        periodEnd: updatedPaymentData.periodEnd ? new Date(updatedPaymentData.periodEnd).toISOString() : paymentHistory[paymentIndex].periodEnd,
      };
      
      const updates: Partial<Customer> = { paymentHistory };

      // If payment status is changed to 'lunas', update customer status if needed
      if (updatedPaymentData.paymentStatus === 'lunas' && (customerData.status === 'isolir' || customerData.status === 'baru')) {
        updates.status = 'aktif';
      }
      
      transaction.update(actualCustomerDocRef, updates);
    });

    revalidatePath('/admin/pembayaran');
    revalidatePath(`/pelanggan/dashboard`); 
    revalidatePath(`/pelanggan/tagihan`);   
    return { success: true, message: `Pembayaran ${paymentId} untuk pelanggan ${customerCustomId} berhasil diperbarui.` };

  } catch (error) {
    console.error("Error updating payment by admin: ", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui.";
    return { success: false, message: `Gagal memperbarui pembayaran: ${errorMessage}` };
  }
}


export async function getCustomersForSelectionAction(): Promise<{ id: string; name: string; firestoreDocId: string }[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'customers'));
    const customers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id, // custom ID
        name: data.name,
        firestoreDocId: doc.id // Firestore document ID
      };
    });
    return customers.sort((a,b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching customers for selection: ", error);
    return [];
  }
}

export async function adminAddPaymentToCustomerAction(
  customerFirestoreDocId: string, // Use Firestore Doc ID for direct access
  newPayment: Payment
): Promise<PaymentUpdateResult> {
  try {
    const customerDocRef = doc(db, 'customers', customerFirestoreDocId);

    await updateDoc(customerDocRef, {
      paymentHistory: arrayUnion(newPayment)
    });

    // Check if this new payment makes the customer active
    const customerSnap = await getDoc(customerDocRef); // Re-fetch for current status
    if (customerSnap.exists()) {
      const customerData = customerSnap.data() as Customer;
      if (newPayment.paymentStatus === 'lunas' && (customerData.status === 'isolir' || customerData.status === 'baru')) {
        await updateDoc(customerDocRef, { status: 'aktif' });
      }
    }

    revalidatePath('/admin/pembayaran');
    revalidatePath(`/pelanggan/dashboard`); // Revalidate customer dashboard
    revalidatePath(`/pelanggan/tagihan`);   // Revalidate customer billing page
    return { success: true, message: `Pembayaran baru berhasil ditambahkan untuk pelanggan.` };
  } catch (error) {
    console.error("Error adding new payment by admin: ", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui.";
    return { success: false, message: `Gagal menambahkan pembayaran baru: ${errorMessage}` };
  }
}

