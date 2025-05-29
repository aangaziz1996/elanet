
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, Timestamp, writeBatch } from 'firebase/firestore';
import type { Customer, Payment } from '@/types/customer';
import type { CustomerFormValues } from '@/components/customer/customer-form-dialog';

// Helper to convert Firestore Timestamps to ISO strings for dates
const convertTimestampsToISO = (data: any): any => {
  if (!data) return data; // Handle null or undefined input
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


export async function addCustomerAction(data: CustomerFormValues) {
  try {
    // Check for duplicate custom ID
    const qId = query(collection(db, 'customers'), where('id', '==', data.id));
    const idSnapshot = await getDocs(qId);
    if (!idSnapshot.empty) {
      return { success: false, message: `ID Pelanggan (Custom) "${data.id}" sudah digunakan.` };
    }

    // Check for duplicate Firebase UID if provided
    if (data.firebaseUID && data.firebaseUID.trim() !== '') {
      const qFbUID = query(collection(db, 'customers'), where('firebaseUID', '==', data.firebaseUID));
      const fbUIDSnapshot = await getDocs(qFbUID);
      if (!fbUIDSnapshot.empty) {
        return { success: false, message: `Firebase User ID "${data.firebaseUID}" sudah terhubung dengan pelanggan lain.` };
      }
    }
    
    const customerToAdd: Omit<Customer, 'paymentHistory'> & { paymentHistory?: Payment[] } = {
      ...data,
      firebaseUID: data.firebaseUID || undefined, // Store as undefined if empty
      email: data.email || undefined,
      installationDate: data.installationDate?.toISOString(),
      joinDate: data.joinDate.toISOString(), // Already a Date object from form
      paymentHistory: [], 
    };

    await addDoc(collection(db, 'customers'), customerToAdd);
    revalidatePath('/admin/pelanggan');
    return { success: true, message: `Pelanggan ${data.name} berhasil ditambahkan.` };
  } catch (error)
 {
    console.error("Error adding customer: ", error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
    return { success: false, message: `Gagal menambahkan pelanggan: ${errorMessage}` };
  }
}

export async function updateCustomerAction(originalCustomerId: string, data: CustomerFormValues) {
  try {
    const q = query(collection(db, 'customers'), where('id', '==', originalCustomerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'Pelanggan tidak ditemukan.' };
    }
    const customerDocRef = querySnapshot.docs[0].ref;
    const existingData = querySnapshot.docs[0].data() as Customer;

    // Check if Firebase UID is being changed and if the new one is already in use by another customer
    if (data.firebaseUID && data.firebaseUID.trim() !== '' && data.firebaseUID !== existingData.firebaseUID) {
      const qFbUID = query(collection(db, 'customers'), where('firebaseUID', '==', data.firebaseUID));
      const fbUIDSnapshot = await getDocs(qFbUID);
      if (!fbUIDSnapshot.empty && fbUIDSnapshot.docs[0].id !== customerDocRef.id) { // Check if it's not the current document
        return { success: false, message: `Firebase User ID "${data.firebaseUID}" sudah terhubung dengan pelanggan lain.` };
      }
    }

    const customerToUpdate: Partial<Customer> = {
      ...data,
      firebaseUID: data.firebaseUID || undefined,
      email: data.email || undefined,
      joinDate: data.joinDate.toISOString(),
      installationDate: data.installationDate?.toISOString(),
      paymentHistory: existingData.paymentHistory, 
    };
    
    await updateDoc(customerDocRef, customerToUpdate);
    revalidatePath('/admin/pelanggan');
    revalidatePath(`/pelanggan/profil`); // Revalidate customer profile page if they are logged in
    revalidatePath(`/pelanggan/dashboard`);
    return { success: true, message: `Pelanggan ${data.name} berhasil diperbarui.` };
  } catch (error) {
    console.error("Error updating customer: ", error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
    return { success: false, message: `Gagal memperbarui pelanggan: ${errorMessage}` };
  }
}

export async function deleteCustomerAction(customerIdToDelete: string) {
  try {
    const q = query(collection(db, 'customers'), where('id', '==', customerIdToDelete));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'Pelanggan tidak ditemukan untuk dihapus.' };
    }

    const customerDocRef = querySnapshot.docs[0].ref;
    await deleteDoc(customerDocRef);
    revalidatePath('/admin/pelanggan');
    return { success: true, message: `Pelanggan dengan ID ${customerIdToDelete} berhasil dihapus.` };
  } catch (error) {
    console.error("Error deleting customer: ", error);
    return { success: false, message: 'Gagal menghapus pelanggan.' };
  }
}

export async function getCustomersAction(): Promise<Customer[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'customers'));
    const customers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const customerWithConvertedDates = convertTimestampsToISO(data) as Customer;
      return customerWithConvertedDates;
    });
    return customers;
  } catch (error) {
    console.error("Error fetching customers: ", error);
    return [];
  }
}
