
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Customer } from '@/types/customer';

// Helper to convert Firestore Timestamps to ISO strings for dates
// Similar to the one in admin actions, but placed here for customer-specific logic if needed.
const convertTimestampsToISO = (data: any): any => {
  if (!data) return data;
  const result = { ...data };
  for (const key in result) {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate().toISOString();
    } else if (Array.isArray(result[key])) {
      result[key] = result[key].map((item: any) => {
        if (typeof item === 'object' && item !== null && !(item instanceof Timestamp)) { // Avoid re-converting if already processed
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


export interface ValidateCustomerLoginResult {
  success: boolean;
  customer?: Customer;
  message?: string;
}

export async function validateCustomerLoginAction(customerId: string): Promise<ValidateCustomerLoginResult> {
  if (!customerId) {
    return { success: false, message: 'ID Pelanggan harus diisi.' };
  }
  try {
    const q = query(collection(db, 'customers'), where('id', '==', customerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'ID Pelanggan tidak ditemukan.' };
    }

    const customerDoc = querySnapshot.docs[0];
    const customerData = convertTimestampsToISO(customerDoc.data()) as Customer;
    
    return { success: true, customer: customerData };
  } catch (error) {
    console.error("Error validating customer login: ", error);
    return { success: false, message: 'Terjadi kesalahan pada server. Silakan coba lagi.' };
  }
}
