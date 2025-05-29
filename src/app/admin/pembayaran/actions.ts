
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, Timestamp, runTransaction, WriteBatch, writeBatch } from 'firebase/firestore';
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
      const customerData = customerDoc.data() as Omit<Customer, 'paymentHistory'> & { paymentHistory?: Payment[]}; // Firestore data might not have paymentHistory initially
      const customerId = customerData.id; // This is the custom ID
      const customerName = customerData.name;
      
      if (customerData.paymentHistory && Array.isArray(customerData.paymentHistory)) {
        customerData.paymentHistory.forEach(payment => {
          // Ensure payment dates are strings for consistent handling
          const paymentWithConvertedDates = convertTimestampsToISO(payment) as Payment;
          allPayments.push({
            ...paymentWithConvertedDates,
            customerId: customerId, // Custom ID of the customer
            customerName: customerName,
            // Store firestoreDocId to make updates easier, if needed.
            // We'll use runTransaction and customer's custom ID to find the doc.
          });
        });
      }
    });
    // Sort by paymentDate descending
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
    const customerDocRef = doc(db, 'customers', customerCustomId); // Assuming customerCustomId is the Firestore document ID.
                                                                    // This needs to be corrected if customId is not the doc ID.
                                                                    // We need to query for the document if customId is a field.
                                                                    // For now, let's assume we have a way to get the doc ref.

    // Find the customer document based on the custom 'id' field
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

      // Update customer status if needed
      if (customerData.status === 'isolir' || customerData.status === 'baru') {
        updates.status = 'aktif';
      }
      
      transaction.update(actualCustomerDocRef, updates);
    });

    revalidatePath('/admin/pembayaran');
    revalidatePath(`/pelanggan/dashboard`); // Revalidate customer dashboard
    revalidatePath(`/pelanggan/tagihan`);   // Revalidate customer billing page
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

// Action to handle multiple payment confirmations or rejections if needed in future
// For now, we focus on single operations.

// Helper to get customer document reference by custom ID
// This is slightly redundant given the query inside actions, but could be a separate utility
// async function getCustomerDocRefByCustomId(customId: string): Promise<DocumentReference<DocumentData> | null> {
//   const customersCollection = collection(db, 'customers');
//   const q = query(customersCollection, where('id', '==', customId), limit(1));
//   const snapshot = await getDocs(q);
//   if (!snapshot.empty) {
//     return snapshot.docs[0].ref;
//   }
//   return null;
// }
    