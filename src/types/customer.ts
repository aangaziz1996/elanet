
export interface Payment {
  id: string;
  paymentDate: string; // ISO date string
  amount: number;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  proofOfPaymentUrl?: string;
  signatureDataUrl?: string; // For digital signature, e.g., "Ditandatangani oleh: Nama Jelas"
  paymentMethod?: 'tunai_kolektor' | 'transfer' | 'online' | 'other';
  notes?: string;
  recordedBy?: string; // User ID or name
  paymentStatus: 'pending_konfirmasi' | 'lunas' | 'ditolak';
}

export type CustomerStatus = 'aktif' | 'nonaktif' | 'isolir' | 'baru' | 'berhenti';

export interface Customer {
  // Note: Firestore document ID will be different from this 'id' field.
  // This 'id' is the customer-facing ID used for login, etc.
  id: string; 
  firebaseUID?: string; // Firebase Authentication User ID
  name: string;
  address: string;
  phoneNumber: string;
  email?: string; // This email might be the one used for Firebase Auth
  wifiPackage: string; // e.g., "10 Mbps", "20 Mbps", "Custom"
  joinDate: string; // ISO date string, Firestore will store as Timestamp
  installationDate?: string; // ISO date string, Firestore will store as Timestamp
  billingCycleDay: number; 
  status: CustomerStatus;
  paymentHistory: Payment[];
  notes?: string;
  onuMacAddress?: string;
  ipAddress?: string;
  routerUsername?: string;
  routerPassword?: string;
}
