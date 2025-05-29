
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, Timestamp, limit } from 'firebase/firestore';
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

export interface GetCustomerResult {
  success: boolean;
  customer?: Customer;
  message?: string;
}

export async function getCustomerByFirebaseUIDAction(firebaseUID: string): Promise<GetCustomerResult> {
  if (!firebaseUID) {
    return { success: false, message: 'Firebase UID tidak valid.' };
  }
  try {
    const q = query(collection(db, 'customers'), where('firebaseUID', '==', firebaseUID), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'Pelanggan tidak ditemukan dengan Firebase UID yang terhubung.' };
    }

    const customerDoc = querySnapshot.docs[0];
    const customerData = convertTimestampsToISO(customerDoc.data()) as Customer;
    
    return { success: true, customer: customerData };
  } catch (error) {
    console.error("Error fetching customer by Firebase UID: ", error);
    return { success: false, message: 'Gagal mengambil data pelanggan dari server.' };
  }
}

export interface UpdateCustomerProfileResult {
  success: boolean;
  message: string;
  customer?: Customer; // Return updated customer
}

// Only allow updating specific fields from profile page
type ProfileUpdateData = Pick<Customer, 'name' | 'phoneNumber' | 'address' | 'email'>;

export async function updateCustomerProfileAction(
  firebaseUID: string, // Identify customer by Firebase UID
  data: ProfileUpdateData
): Promise<UpdateCustomerProfileResult> {
  if (!firebaseUID) {
    return { success: false, message: 'Firebase UID tidak valid.' };
  }
  try {
    const q = query(collection(db, 'customers'), where('firebaseUID', '==', firebaseUID), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'Pelanggan tidak ditemukan untuk diperbarui.' };
    }
    const customerDocRef = querySnapshot.docs[0].ref;
    await updateDoc(customerDocRef, data);

    const updatedDocSnap = await getDocs(q); 
    const updatedCustomer = convertTimestampsToISO(updatedDocSnap.docs[0].data()) as Customer;


    revalidatePath(`/pelanggan/profil`);
    revalidatePath(`/pelanggan/dashboard`);
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
  firebaseUID: string, 
  paymentData: Omit<Payment, 'proofOfPaymentUrl'> // proofOfPaymentUrl tidak lagi dikirim
): Promise<AddPaymentResult> {
  if (!firebaseUID) {
    return { success: false, message: 'Firebase UID tidak valid.' };
  }
  try {
    const q = query(collection(db, 'customers'), where('firebaseUID', '==', firebaseUID), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'Pelanggan tidak ditemukan untuk menambah pembayaran.' };
    }
    const customerDocRef = querySnapshot.docs[0].ref;
    
    const paymentToSave: Payment = {
        ...paymentData,
        // proofOfPaymentUrl is not part of paymentData anymore
    };
    
    await updateDoc(customerDocRef, {
      paymentHistory: arrayUnion(paymentToSave)
    });

    revalidatePath(`/pelanggan/tagihan`);
    revalidatePath(`/pelanggan/dashboard`);
    // Mengembalikan paymentData yang asli, tanpa proofOfPaymentUrl
    return { success: true, message: 'Konfirmasi pembayaran berhasil ditambahkan.', payment: paymentData as Payment };
  } catch (error) {
    console.error("Error adding payment confirmation: ", error);
    return { success: false, message: 'Gagal menambahkan konfirmasi pembayaran.' };
  }
}
