
import type { Customer } from '@/types/customer';

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
      { id: 'pay_1', paymentDate: new Date('2024-06-15').toISOString(), amount: 150000, periodStart: new Date('2024-06-15').toISOString(), periodEnd: new Date('2024-07-14').toISOString(), paymentMethod: 'transfer' },
      { id: 'pay_2', paymentDate: new Date('2024-05-15').toISOString(), amount: 150000, periodStart: new Date('2024-05-15').toISOString(), periodEnd: new Date('2024-06-14').toISOString(), paymentMethod: 'transfer' },
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
       { id: 'pay_3', paymentDate: new Date('2024-04-20').toISOString(), amount: 100000, periodStart: new Date('2024-04-20').toISOString(), periodEnd: new Date('2024-05-19').toISOString(), paymentMethod: 'cash' },
    ],
    notes: 'Sering telat bayar.',
    onuMacAddress: 'AA:BB:CC:DD:EE:02',
    ipAddress: '192.168.1.102',
  },
  {
    id: 'cust_3',
    name: 'Budi Santoso',
    address: 'Jl. Kebangsaan No. 1, Surabaya',
    phoneNumber: '087812345678',
    wifiPackage: '50 Mbps',
    joinDate: new Date('2024-01-10').toISOString(),
    billingCycleDay: 10,
    status: 'baru',
    paymentHistory: [],
    onuMacAddress: 'AA:BB:CC:DD:EE:03',
    ipAddress: '192.168.1.103',
  },
];

export const findCustomerById = (id: string): Customer | undefined => {
  return initialCustomers.find(customer => customer.id === id);
};
