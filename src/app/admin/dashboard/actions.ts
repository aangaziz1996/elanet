
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import type { Customer, Payment } from '@/types/customer';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number; // Changed from activePackages to activeCustomers for clarity
  overduePayments: number; // Number of customers with 'isolir' status
  monthlyRevenue: number;
}

// Helper to convert Firestore Timestamps
const convertTimestampsForDashboard = (data: any): any => {
  if (!data) return data;
  const result = { ...data };
  for (const key in result) {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate().toISOString();
    } else if (Array.isArray(result[key])) {
      result[key] = result[key].map((item: any) => {
        if (typeof item === 'object' && item !== null && !(item instanceof Timestamp)) {
          return convertTimestampsForDashboard(item);
        }
        return item;
      });
    } else if (typeof result[key] === 'object' && result[key] !== null && !(result[key] instanceof Timestamp)) {
      result[key] = convertTimestampsForDashboard(result[key]);
    }
  }
  return result;
};

export async function getDashboardStatsAction(): Promise<DashboardStats> {
  try {
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    const customers: Customer[] = customersSnapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure paymentHistory is an array and properly converted
        const customerDataWithConvertedDates = convertTimestampsForDashboard(data) as Customer;
        customerDataWithConvertedDates.paymentHistory = Array.isArray(customerDataWithConvertedDates.paymentHistory) 
            ? customerDataWithConvertedDates.paymentHistory.map(p => convertTimestampsForDashboard(p) as Payment) 
            : [];
        return customerDataWithConvertedDates;
    });

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'aktif').length;
    const overduePayments = customers.filter(c => c.status === 'isolir').length;

    let monthlyRevenue = 0;
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    customers.forEach(customer => {
      if (customer.paymentHistory && Array.isArray(customer.paymentHistory)) {
        customer.paymentHistory.forEach(payment => {
          if (payment.paymentStatus === 'lunas' && payment.paymentDate) {
            try {
                const paymentDate = parseISO(payment.paymentDate); // paymentDate is already ISO string
                if (isWithinInterval(paymentDate, { start: currentMonthStart, end: currentMonthEnd })) {
                    monthlyRevenue += payment.amount;
                }
            } catch (e) {
                console.error("Error parsing payment date:", payment.paymentDate, e);
            }
          }
        });
      }
    });

    return {
      totalCustomers,
      activeCustomers,
      overduePayments,
      monthlyRevenue,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats: ", error);
    // Return default/zero values in case of an error
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      overduePayments: 0,
      monthlyRevenue: 0,
    };
  }
}
