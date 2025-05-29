
import type { Customer, Payment } from '@/types/customer';

// This file is now mostly for reference or if you need to switch back to mock data temporarily.
// Core customer data management is now handled by Firestore.

export const initialCustomers: Customer[] = [
  {
    id: 'cust_1',
    firebaseUID: 'mock_firebase_uid_1_admin_linked', // UID linked by admin, customer doesn't login
    name: 'Andi Budiman (Admin Entry)',
    address: 'Jl. Merdeka No. 10, Jakarta',
    phoneNumber: '081234567890',
    email: 'andi.b@example.com',
    wifiPackage: '20 Mbps',
    joinDate: new Date('2023-01-15').toISOString(),
    installationDate: new Date('2023-01-17').toISOString(),
    billingCycleDay: 15,
    status: 'aktif',
    paymentHistory: [
      { 
        id: 'pay_1', 
        paymentDate: new Date('2024-07-15').toISOString(), 
        amount: 150000, 
        periodStart: new Date('2024-07-15').toISOString(), 
        periodEnd: new Date('2024-08-14').toISOString(), 
        paymentMethod: 'transfer', 
        paymentStatus: 'lunas',
      },
    ],
    notes: 'Pelanggan lama, pembayaran selalu tepat waktu.',
    onuMacAddress: 'AA:BB:CC:DD:EE:01',
    ipAddress: '192.168.1.101',
  },
];

// These functions will likely not be used much as admin pages now use Firestore server actions.
export const getInitialCustomers = (): Customer[] => {
  console.warn("getInitialCustomers from mock-data.ts is being called. Data should come from Firestore.");
  if (typeof structuredClone === 'function') {
    return structuredClone(initialCustomers);
  }
  return JSON.parse(JSON.stringify(initialCustomers));
};

export const getAllPaymentsFromCustomers = (customers: Customer[]): (Payment & { customerId: string, customerName: string })[] => {
  console.warn("getAllPaymentsFromCustomers from mock-data.ts is being called. Data should come from Firestore.");
  const allPayments: (Payment & { customerId: string, customerName: string })[] = [];
  customers.forEach(customer => {
    (customer.paymentHistory || []).forEach(payment => {
      allPayments.push({
        ...payment,
        customerId: customer.id,
        customerName: customer.name,
      });
    });
  });
  return allPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
};

export const getAllPayments = (): (Payment & { customerId: string, customerName: string })[] => {
    return getAllPaymentsFromCustomers(getInitialCustomers());
}
