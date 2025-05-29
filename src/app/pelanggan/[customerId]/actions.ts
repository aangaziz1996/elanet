
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import type { Customer, Payment } from '@/types/customer';
import { revalidatePath } from 'next/cache';

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

export interface GetCustomerDetailsResult {
  success: boolean;
  customer?: Customer;
  message?: string;
}

export async function getCustomerDetailsAction(customerId: string): Promise<GetCustomerDetailsResult> {
  if (!customerId) {
    return { success: false, message: 'ID Pelanggan tidak valid.' };
  }
  try {
    const q = query(collection(db, 'customers'), where('id', '==', customerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'Pelanggan tidak ditemukan.' };
    }

    const customerDoc = querySnapshot.docs[0];
    const customerData = convertTimestampsToISO(customerDoc.data()) as Customer;
    
    return { success: true, customer: customerData };
  } catch (error) {
    console.error("Error fetching customer details: ", error);
    return { success: false, message: 'Gagal mengambil data pelanggan dari server.' };
  }
}

export interface UpdateCustomerProfileResult {
  success: boolean;
  message: string;
  customer?: Customer;
}

// Only allow updating specific fields from profile page
type ProfileUpdateData = Pick<Customer, 'name' | 'phoneNumber' | 'address' | 'email'>;

export async function updateCustomerProfileAction(
  customerId: string,
  data: ProfileUpdateData
): Promise<UpdateCustomerProfileResult> {
  if (!customerId) {
    return { success: false, message: 'ID Pelanggan tidak valid.' };
  }
  try {
    const q = query(collection(db, 'customers'), where('id', '==', customerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'Pelanggan tidak ditemukan.' };
    }
    const customerDocRef = querySnapshot.docs[0].ref;
    await updateDoc(customerDocRef, data);

    // Re-fetch the updated customer to return
    const updatedDocSnap = await getDocs(q); // Re-query to get the updated document
    const updatedCustomer = convertTimestampsToISO(updatedDocSnap.docs[0].data()) as Customer;

    revalidatePath(`/pelanggan/${customerId}/profil`);
    revalidatePath(`/pelanggan/${customerId}/dashboard`); // Also revalidate dashboard if name is shown there
    return { success: true, message: 'Profil berhasil diperbarui.', customer: updatedCustomer };
  } catch (error) {
    console.error("Error updating customer profile: ", error);
    return { success: false, message: 'Gagal memperbarui profil.' };
  }
}

export interface AddPaymentResult {
  success: boolean;
  message: string;
  payment?: Payment;
}

export async function addPaymentConfirmationAction(
  customerId: string,
  paymentData: Payment 
): Promise<AddPaymentResult> {
  if (!customerId) {
    return { success: false, message: 'ID Pelanggan tidak valid.' };
  }
  try {
    const q = query(collection(db, 'customers'), where('id', '==', customerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'Pelanggan tidak ditemukan.' };
    }
    const customerDocRef = querySnapshot.docs[0].ref;
    
    // Firestore will convert ISO date strings in paymentData to Timestamps if fields are Date types in rules,
    // or store as strings. Ensure your Customer type and Firestore structure are consistent.
    // For arrayUnion, the exact structure including date strings is fine.
    await updateDoc(customerDocRef, {
      paymentHistory: arrayUnion(paymentData)
    });

    revalidatePath(`/pelanggan/${customerId}/tagihan`);
    revalidatePath(`/pelanggan/${customerId}/dashboard`); // Update dashboard if it shows recent payments
    return { success: true, message: 'Konfirmasi pembayaran berhasil ditambahkan.', payment: paymentData };
  } catch (error) {
    console.error("Error adding payment confirmation: ", error);
    return { success: false, message: 'Gagal menambahkan konfirmasi pembayaran.' };
  }
}

