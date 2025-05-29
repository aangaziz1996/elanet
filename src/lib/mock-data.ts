
// This file is now mostly for reference or if you need to switch back to mock data temporarily.
// Core customer data management is moving to Firestore.

import type { Customer, Payment } from '@/types/customer';

// Mock data for now
export const initialCustomers: Customer[] = [
  {
    id: 'cust_1',
    name: 'Andi Budiman',
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
        proofOfPaymentUrl: 'https://placehold.co/100x50.png?text=BuktiAndi1'
      },
      { 
        id: 'pay_2', 
        paymentDate: new Date('2024-06-15').toISOString(), 
        amount: 150000, 
        periodStart: new Date('2024-06-15').toISOString(), 
        periodEnd: new Date('2024-07-14').toISOString(), 
        paymentMethod: 'transfer',
        paymentStatus: 'lunas',
        proofOfPaymentUrl: 'https://placehold.co/100x50.png?text=BuktiAndi2'
      },
    ],
    notes: 'Pelanggan lama, pembayaran selalu tepat waktu.',
    onuMacAddress: 'AA:BB:CC:DD:EE:01',
    ipAddress: '192.168.1.101',
  },
  {
    id: 'cust_2',
    name: 'Siti Aminah',
    address: 'Jl. Pahlawan No. 5, Bandung',
    phoneNumber: '085678901234',
    email: 'siti.a@example.com',
    wifiPackage: '10 Mbps',
    joinDate: new Date('2023-03-20').toISOString(),
    billingCycleDay: 20,
    status: 'isolir', 
    paymentHistory: [
       { 
        id: 'pay_3', 
        paymentDate: new Date('2024-05-20').toISOString(), 
        amount: 100000, 
        periodStart: new Date('2024-05-20').toISOString(), 
        periodEnd: new Date('2024-06-19').toISOString(), 
        paymentMethod: 'tunai_kolektor',
        paymentStatus: 'lunas',
        signatureDataUrl: 'Ditandatangani oleh: Siti Aminah (via Kolektor Budi)'
       },
       {
        id: 'pay_4',
        paymentDate: new Date('2024-07-21').toISOString(), 
        amount: 100000,
        periodStart: new Date('2024-06-20').toISOString(), 
        periodEnd: new Date('2024-07-19').toISOString(),
        paymentMethod: 'transfer',
        paymentStatus: 'pending_konfirmasi',
        proofOfPaymentUrl: 'https://placehold.co/100x50.png?text=BuktiSitiPending',
        notes: 'Transfer via ATM BCD'
       }
    ],
    notes: 'Sering telat bayar. Status isolir karena tagihan Juni-Juli belum lunas.',
    onuMacAddress: 'AA:BB:CC:DD:EE:02',
    ipAddress: '192.168.1.102',
  },
  // Add more customers if needed for initial Firestore population by hand, or use the app to add them.
];

// These functions will need to be adapted to use Firestore if other parts of the app still use them.
// For now, admin/pelanggan page uses server actions.
export const getInitialCustomers = (): Customer[] => {
  console.warn("getInitialCustomers from mock-data.ts is being called. Ensure this is intended if Firestore is integrated.");
  if (typeof structuredClone === 'function') {
    return structuredClone(initialCustomers);
  }
  return JSON.parse(JSON.stringify(initialCustomers));
};


export const findCustomerById = (id: string, customersData?: Customer[]): Customer | undefined => {
  console.warn("findCustomerById from mock-data.ts is being called. Ensure this is intended if Firestore is integrated.");
  const source = customersData || initialCustomers; 
  const customer = source.find(customer => customer.id === id);
  if (customer) {
    if (typeof structuredClone === 'function') {
      return structuredClone(customer);
    }
    return JSON.parse(JSON.stringify(customer));
  }
  return undefined;
};

export const getAllPaymentsFromCustomers = (customers: Customer[]): (Payment & { customerId: string, customerName: string })[] => {
  console.warn("getAllPaymentsFromCustomers from mock-data.ts is being called. Ensure this is intended if Firestore is integrated.");
  const allPayments: (Payment & { customerId: string, customerName: string })[] = [];
  customers.forEach(customer => {
    customer.paymentHistory.forEach(payment => {
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
