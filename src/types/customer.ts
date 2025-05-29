export interface Payment {
  id: string;
  paymentDate: string; // ISO date string
  amount: number;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  proofOfPaymentUrl?: string;
  signatureDataUrl?: string; // For digital signature, e.g., "Ditandatangani oleh: Nama Jelas"
  paymentMethod?: 'cash' | 'transfer' | 'online' | 'other';
  notes?: string;
  recordedBy?: string; // User ID or name
  paymentStatus: 'pending_konfirmasi' | 'lunas' | 'ditolak'; // Added new status
}

export type CustomerStatus = 'aktif' | 'nonaktif' | 'isolir' | 'baru' | 'berhenti';

export interface Customer {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email?: string;
  wifiPackage: string; // e.g., "10 Mbps", "20 Mbps", "Custom"
  joinDate: string; // ISO date string
  installationDate?: string; // ISO date string
  billingCycleDay: number; // e.g., 1 for 1st of month, 15 for 15th of month. Used to calculate due date.
  status: CustomerStatus;
  paymentHistory: Payment[];
  notes?: string;
  // Technical details (optional, can be a separate object/table in a real DB)
  onuMacAddress?: string;
  ipAddress?: string;
  routerUsername?: string;
  routerPassword?: string;
}
