
'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Customer } from '@/types/customer';
import { CustomerDataTable } from '@/components/customer/customer-data-table';
import { columns as customerColumns } from '@/components/customer/customer-table-columns';
import CustomerFormDialog, { type CustomerFormValues } from '@/components/customer/customer-form-dialog';
import { initialCustomers as allCustomers } from '@/lib/mock-data'; // Import from mock-data
import { useToast } from '@/hooks/use-toast';

export default function AdminPelangganPage() {
  const [customers, setCustomers] = React.useState<Customer[]>(allCustomers);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const { toast } = useToast();

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
    toast({
        title: "Pelanggan Dihapus",
        description: `Pelanggan dengan ID ${customerId} telah dihapus (secara lokal).`,
        variant: "destructive"
    });
    // Note: This only updates the local state. In a real app, you'd persist this change.
  };

  const handleSaveCustomer = (customerData: CustomerFormValues) => {
    if (editingCustomer && editingCustomer.id) {
      // Editing existing customer
      // The customerData.id from the form should be the same as editingCustomer.id because the field is disabled.
      setCustomers(
        customers.map((c) =>
          c.id === editingCustomer.id
            ? { 
                ...c, // Keep existing fields like paymentHistory
                ...customerData, // Apply form values
                joinDate: customerData.joinDate.toISOString(), // Convert Date to ISO string
                installationDate: customerData.installationDate?.toISOString(), // Convert Date to ISO string
              }
            : c
        )
      );
      toast({
        title: "Pelanggan Diperbarui",
        description: `Data pelanggan ${customerData.name} telah diperbarui.`,
      });
    } else {
      // Adding new customer. customerData.id is the new ID from the form.
      // Check if ID already exists
      if (customers.some(c => c.id === customerData.id)) {
        toast({
          title: "Error: ID Pelanggan Duplikat",
          description: `ID Pelanggan "${customerData.id}" sudah digunakan. Silakan gunakan ID lain.`,
          variant: "destructive",
        });
        return; // Prevent adding customer
      }
      
      const newCustomer: Customer = {
        ...customerData,
        id: customerData.id, // This is from the form
        joinDate: customerData.joinDate.toISOString(), // Convert Date to ISO string
        installationDate: customerData.installationDate?.toISOString(), // Convert Date to ISO string
        paymentHistory: [], // Initialize with empty payment history
      };
      setCustomers([...customers, newCustomer]);
      toast({
        title: "Pelanggan Ditambahkan",
        description: `Pelanggan baru ${newCustomer.name} dengan ID ${newCustomer.id} telah ditambahkan.`,
      });
    }
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

    