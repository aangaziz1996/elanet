
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, Timestamp, limit } from 'firebase/firestore';
import type { Customer, Payment } from '@/types/customer';
import { revalidatePath } from 'next/cache';

// Helper to convert Firestore Timestamps to ISO strings for dates
const convertTimestampsToISO = (data: any): any => {
  if (!data) return data;
  const result = { ...data }; // Create a shallow copy
  for (const key in data) { // Iterate over original data keys
    if (data[key] instanceof Timestamp) {
      result[key] = data[key].toDate().toISOString();
    } else if (Array.isArray(data[key])) {
      result[key] = data[key].map((item: any) => {
        if (typeof item === 'object' && item !== null && !(item instanceof Timestamp)) {
          // Recursively convert objects within arrays, but not Timestamps themselves
          return convertTimestampsToISO(item); 
        }
        return item; // Return item as is if it's not an object or is a Timestamp
      });
    } else if (typeof data[key] === 'object' && data[key] !== null && !(data[key] instanceof Timestamp)) {
      // Recursively convert nested objects but not Timestamps
      result[key] = convertTimestampsToISO(data[key]);
    } else {
      // Copy other types as is
      result[key] = data[key];
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
  console.log('getCustomerByFirebaseUIDAction: Called with UID -', firebaseUID);
  if (!firebaseUID) {
    console.error('getCustomerByFirebaseUIDAction: Error - Firebase UID tidak valid.');
    return { success: false, message: 'Firebase UID tidak valid.' };
  }
  try {
    const q = query(collection(db, 'customers'), where('firebaseUID', '==', firebaseUID), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn('getCustomerByFirebaseUIDAction: Pelanggan tidak ditemukan dengan Firebase UID:', firebaseUID);
      return { success: false, message: 'Pelanggan tidak ditemukan dengan Firebase UID yang terhubung.' };
    }

    const customerDoc = querySnapshot.docs[0];
    const customerData = customerDoc.data();
    console.log('getCustomerByFirebaseUIDAction: Raw customer data from Firestore:', customerData);
    
    // Make sure paymentHistory is an array, default to empty if undefined or null
    if (customerData.paymentHistory === undefined || customerData.paymentHistory === null) {
        customerData.paymentHistory = [];
    } else if (!Array.isArray(customerData.paymentHistory)) {
        console.warn('getCustomerByFirebaseUIDAction: paymentHistory is not an array, defaulting to empty. UID:', firebaseUID, 'Found:', customerData.paymentHistory);
        customerData.paymentHistory = []; // Ensure it's an array
    }
    
    const customerWithConvertedDates = convertTimestampsToISO(customerData) as Customer;
    console.log('getCustomerByFirebaseUIDAction: Converted customer data:', customerWithConvertedDates);
    
    return { success: true, customer: customerWithConvertedDates };
  } catch (error: any) {
    console.error("getCustomerByFirebaseUIDAction: Error fetching customer by Firebase UID:", firebaseUID, error);
    return { success: false, message: `Gagal mengambil data pelanggan: ${error.message || 'Kesalahan server tidak diketahui.'}` };
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

    // Re-fetch the updated customer data to return it with converted dates
    const updatedDoc = await getDoc(customerDocRef);
    if (!updatedDoc.exists()) {
        return { success: false, message: 'Gagal mengambil data pelanggan setelah pembaruan.' };
    }
    const updatedCustomer = convertTimestampsToISO(updatedDoc.data()) as Customer;


    revalidatePath(`/pelanggan/profil`); // Revalidate specific page
    revalidatePath(`/pelanggan/dashboard`); // Revalidate dashboard if name is shown there
    return { success: true, message: 'Profil berhasil diperbarui.', customer: updatedCustomer };
  } catch (error: any) {
    console.error("Error updating customer profile for UID:", firebaseUID, error);
    return { success: false, message: `Gagal memperbarui profil: ${error.message || 'Kesalahan server tidak diketahui.'}` };
  }
}

export interface AddPaymentResult {
  success: boolean;
  message: string;
  payment?: Payment;
}

export async function addPaymentConfirmationAction(
  firebaseUID: string, 
  paymentData: Payment // proofOfPaymentUrl is already removed from type if it's not needed
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
    
    // Ensure paymentData fields like paymentDate, periodStart, periodEnd are ISO strings if they come from Date objects.
    // The Payment type already defines them as string.
    const paymentToSave: Payment = {
        ...paymentData,
        // Ensure dates are ISO strings, which they should be if Payment type is followed
        paymentDate: new Date(paymentData.paymentDate).toISOString(),
        periodStart: new Date(paymentData.periodStart).toISOString(),
        periodEnd: new Date(paymentData.periodEnd).toISOString(),
    };
    
    await updateDoc(customerDocRef, {
      paymentHistory: arrayUnion(paymentToSave)
    });

    revalidatePath(`/pelanggan/tagihan`);
    revalidatePath(`/pelanggan/dashboard`);
    return { success: true, message: 'Konfirmasi pembayaran berhasil ditambahkan.', payment: paymentData };
  } catch (error: any) {
    console.error("Error adding payment confirmation for UID:", firebaseUID, error);
    return { success: false, message: `Gagal menambahkan konfirmasi pembayaran: ${error.message || 'Kesalahan server tidak diketahui.'}` };
  }
}

    