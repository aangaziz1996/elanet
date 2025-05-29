
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
    status: 'isolir', // Still isolir, implies payment for current/last cycle is missing or pending
    paymentHistory: [
       { 
        id: 'pay_3', 
        paymentDate: new Date('2024-05-20').toISOString(), // Older payment
        amount: 100000, 
        periodStart: new Date('2024-05-20').toISOString(), 
        periodEnd: new Date('2024-06-19').toISOString(), 
        paymentMethod: 'cash',
        paymentStatus: 'lunas',
        signatureDataUrl: 'Ditandatangani oleh: Siti Aminah (via Kolektor Budi)'
       },
       // No payment for June/July, hence 'isolir'
       // Let's add a pending one to demonstrate
       {
        id: 'pay_4',
        paymentDate: new Date('2024-07-21').toISOString(), // User submitted this
        amount: 100000,
        periodStart: new Date('2024-06-20').toISOString(), // For period June-July
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
  {
    id: 'cust_3',
    name: 'Budi Santoso',
    address: 'Jl. Kebangsaan No. 1, Surabaya',
    phoneNumber: '087812345678',
    wifiPackage: '50 Mbps',
    joinDate: new Date('2024-06-10').toISOString(), // Relatively new
    billingCycleDay: 10,
    status: 'aktif', // Let's assume they paid their first bill
    paymentHistory: [
        {
            id: 'pay_5',
            paymentDate: new Date('2024-07-09').toISOString(),
            amount: 250000, // 50 Mbps
            periodStart: new Date('2024-07-10').toISOString(),
            periodEnd: new Date('2024-08-09').toISOString(),
            paymentMethod: 'online',
            paymentStatus: 'lunas'
        }
    ],
    onuMacAddress: 'AA:BB:CC:DD:EE:03',
    ipAddress: '192.168.1.103',
  },
   {
    id: 'cust_4',
    name: 'Dewi Lestari',
    address: 'Jl. Kenanga No. 8, Yogyakarta',
    phoneNumber: '081122334455',
    email: 'dewi.l@example.com',
    wifiPackage: '30 Mbps',
    joinDate: new Date('2024-05-01').toISOString(),
    billingCycleDay: 1,
    status: 'aktif',
    paymentHistory: [
      { 
        id: 'pay_6', 
        paymentDate: new Date('2024-07-01').toISOString(), 
        amount: 200000, 
        periodStart: new Date('2024-07-01').toISOString(), 
        periodEnd: new Date('2024-07-31').toISOString(), 
        paymentMethod: 'transfer', 
        paymentStatus: 'lunas',
      },
      { 
        id: 'pay_7', 
        paymentDate: new Date('2024-06-01').toISOString(), 
        amount: 200000, 
        periodStart: new Date('2024-06-01').toISOString(), 
        periodEnd: new Date('2024-06-30').toISOString(), 
        paymentMethod: 'cash',
        paymentStatus: 'lunas',
        proofOfPaymentUrl: 'https://placehold.co/100x50.png?text=BuktiDewiJuni',
        signatureDataUrl: 'Ditandatangani oleh: Dewi Lestari (Kolektor Ani)'
      },
    ],
    notes: 'Pembayaran selalu lancar.',
    onuMacAddress: 'AA:BB:CC:DD:EE:04',
    ipAddress: '192.168.1.104',
  },
  {
    id: 'cust_5',
    name: 'Eko Prasetyo',
    address: 'Jl. Mawar No. 12, Medan',
    phoneNumber: '081298765432',
    email: 'eko.p@example.com',
    wifiPackage: '10 Mbps',
    joinDate: new Date('2024-07-05').toISOString(),
    billingCycleDay: 5,
    status: 'baru', // New customer, payment might be pending for first bill
    paymentHistory: [
      {
        id: 'pay_8',
        paymentDate: new Date('2024-07-06').toISOString(),
        amount: 100000,
        periodStart: new Date('2024-07-05').toISOString(),
        periodEnd: new Date('2024-08-04').toISOString(),
        paymentMethod: 'transfer',
        paymentStatus: 'pending_konfirmasi',
        proofOfPaymentUrl: 'https://placehold.co/100x50.png?text=BuktiEkoBaru',
        notes: 'Pembayaran tagihan pertama.'
      }
    ],
    notes: 'Pelanggan baru.',
    onuMacAddress: 'AA:BB:CC:DD:EE:05',
    ipAddress: '192.168.1.105',
  }
];

// Function to get a deep copy of initial customers
export const getInitialCustomers = (): Customer[] => {
  // Use structuredClone for a more robust deep copy if available, otherwise fallback to JSON method
  if (typeof structuredClone === 'function') {
    return structuredClone(initialCustomers);
  }
  return JSON.parse(JSON.stringify(initialCustomers));
};


export const findCustomerById = (id: string, customersData?: Customer[]): Customer | undefined => {
  const source = customersData || initialCustomers; // Use provided data or fallback to initial
  const customer = source.find(customer => customer.id === id);
  if (customer) {
    if (typeof structuredClone === 'function') {
      return structuredClone(customer);
    }
    return JSON.parse(JSON.stringify(customer));
  }
  return undefined;
};

// Helper function to get all payments from a given set of customers
export const getAllPaymentsFromCustomers = (customers: Customer[]): (Payment & { customerId: string, customerName: string })[] => {
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

// Initial fetcher using the static data
export const getAllPayments = (): (Payment & { customerId: string, customerName: string })[] => {
    return getAllPaymentsFromCustomers(getInitialCustomers()); // Use the copying function
}
