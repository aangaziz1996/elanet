
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { Customer, Payment } from '@/types/customer';
import type { CustomerFormValues } from '@/components/customer/customer-form-dialog';

// Helper to convert Firestore Timestamps to ISO strings for dates
const convertTimestampsToISO = (data: any): any => {
  const result = { ...data };
  for (const key in result) {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate().toISOString();
    } else if (Array.isArray(result[key])) {
      result[key] = result[key].map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return convertTimestampsToISO(item); // Recursively convert for objects in arrays (like paymentHistory)
        }
        return item;
      });
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = convertTimestampsToISO(result[key]); // Recursively convert for nested objects
    }
  }
  return result;
};


export async function addCustomerAction(data: CustomerFormValues) {
  try {
    // Check for duplicate ID
    const q = query(collection(db, 'customers'), where('id', '==', data.id));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, message: `ID Pelanggan "${data.id}" sudah digunakan.` };
    }

    const customerToAdd: Omit<Customer, 'paymentHistory'> & { paymentHistory?: Payment[] } = {
      ...data,
      joinDate: data.joinDate.toISOString(),
      installationDate: data.installationDate?.toISOString(),
      paymentHistory: [], // Initialize with empty payment history
    };

    // Firestore will convert ISO strings to Timestamps automatically for date fields
    await addDoc(collection(db, 'customers'), customerToAdd);
    revalidatePath('/admin/pelanggan');
    return { success: true, message: `Pelanggan ${data.name} berhasil ditambahkan.` };
  } catch (error) {
    console.error("Error adding customer: ", error);
    return { success: false, message: 'Gagal menambahkan pelanggan.' };
  }
}

export async function updateCustomerAction(originalCustomerId: string, data: CustomerFormValues) {
  try {
    // Find the document by originalCustomerId (which is the 'id' field in Firestore)
    const q = query(collection(db, 'customers'), where('id', '==', originalCustomerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'Pelanggan tidak ditemukan.' };
    }

    const customerDocRef = querySnapshot.docs[0].ref;
    const existingData = querySnapshot.docs[0].data() as Customer;

    // Note: The 'id' field from the form (data.id) should be the same as originalCustomerId
    // because it's disabled during edit. We primarily use originalCustomerId to find the doc.
    const customerToUpdate: Partial<Customer> = {
      ...data, // spread new form values
      joinDate: data.joinDate.toISOString(),
      installationDate: data.installationDate?.toISOString(),
      // Preserve existing paymentHistory, as the form doesn't manage it directly
      paymentHistory: existingData.paymentHistory, 
    };
    
    await updateDoc(customerDocRef, customerToUpdate);
    revalidatePath('/admin/pelanggan');
    return { success: true, message: `Pelanggan ${data.name} berhasil diperbarui.` };
  } catch (error) {
    console.error("Error updating customer: ", error);
    return { success: false, message: 'Gagal memperbarui pelanggan.' };
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
      // Convert Firestore Timestamps to ISO strings for date fields
      // The 'id' field is from the document data itself, not doc.id (which is Firestore's internal ID)
      const customerWithConvertedDates = convertTimestampsToISO(data) as Customer;
      return customerWithConvertedDates;
    });
    return customers;
  } catch (error) {
    console.error("Error fetching customers: ", error);
    return [];
  }
}
