
'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Customer } from '@/types/customer';
import { CustomerDataTable } from '@/components/customer/customer-data-table';
import { columns as customerColumns } from '@/components/customer/customer-table-columns';
import CustomerFormDialog from '@/components/customer/customer-form-dialog';
import { initialCustomers as allCustomers } from '@/lib/mock-data'; // Import from mock-data

export default function AdminPelangganPage() {
  const [customers, setCustomers] = React.useState<Customer[]>(allCustomers);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    // Add confirmation dialog here in a real app
    setCustomers(customers.filter((c) => c.id !== customerId));
    // Note: This only updates the local state. In a real app, you'd persist this change.
  };

  const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'paymentHistory'> | Customer) => {
    if ('id' in customerData && customerData.id) {
      // Editing existing customer
      setCustomers(customers.map((c) => (c.id === customerData.id ? { ...c, ...customerData } : c)));
    } else {
      // Adding new customer
      const newId = `cust_${Math.random().toString(36).substring(2, 9)}`;
      const newCustomerWithId = { ...customerData, id: newId, paymentHistory: customerData.paymentHistory || [] };
      setCustomers([...customers, newCustomerWithId]);
    }
    // Note: This only updates the local state. In a real app, you'd persist this change.
    // Also, initialCustomers in lib/mock-data.ts won't be updated by this action.
    // For a persistent demo, you might need to manage initialCustomers state more globally or use localStorage for it too.
    setIsFormOpen(false);
    setEditingCustomer(null);
  };
  
  const columns = customerColumns({ onEdit: handleEditCustomer, onDelete: handleDeleteCustomer });

  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center justify-between mb-6">
        {/* Title is handled by AdminLayout */}
      </div>

      <div className="bg-card p-6 rounded-lg shadow">
        <div className="flex justify-end mb-4">
          <Button onClick={handleAddCustomer}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pelanggan
          </Button>
        </div>
        <CustomerDataTable columns={columns} data={customers} />
      </div>

      <CustomerFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleSaveCustomer}
        customerToEdit={editingCustomer}
      />
    </div>
  );
}
