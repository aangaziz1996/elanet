
'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Customer } from '@/types/customer';
import { CustomerDataTable } from '@/components/customer/customer-data-table';
import { columns as customerColumnsDef } from '@/components/customer/customer-table-columns';
import CustomerFormDialog, { type CustomerFormValues } from '@/components/customer/customer-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { addCustomerAction, updateCustomerAction, deleteCustomerAction, getCustomersAction } from './actions';
import { Loader2 } from 'lucide-react';

// This page is now a client component to manage local UI state (dialogs, editingCustomer)
// but fetches initial data via a server action called in useEffect.
// Mutations are handled by server actions.

export default function AdminPelangganPage() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const { toast } = useToast();

  const fetchCustomers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCustomers = await getCustomersAction();
      setCustomers(fetchedCustomers);
    } catch (error) {
      toast({
        title: "Gagal Memuat Pelanggan",
        description: "Terjadi kesalahan saat mengambil data pelanggan dari server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    // TODO: Add confirmation dialog here in a real app
    const result = await deleteCustomerAction(customerId);
    if (result.success) {
      toast({
        title: "Pelanggan Dihapus",
        description: result.message,
      });
      fetchCustomers(); // Re-fetch to update the list
    } else {
      toast({
        title: "Gagal Menghapus",
        description: result.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    }
  };

  const handleSaveCustomer = async (customerData: CustomerFormValues) => {
    let result;
    if (editingCustomer && editingCustomer.id) {
      // Editing existing customer
      // Pass the original customer ID (editingCustomer.id) for lookup, 
      // and the full customerData from the form.
      result = await updateCustomerAction(editingCustomer.id, customerData);
    } else {
      // Adding new customer
      result = await addCustomerAction(customerData);
    }

    if (result.success) {
      toast({
        title: editingCustomer ? "Pelanggan Diperbarui" : "Pelanggan Ditambahkan",
        description: result.message,
      });
      setIsFormOpen(false);
      setEditingCustomer(null);
      fetchCustomers(); // Re-fetch to update the list
    } else {
      toast({
        title: `Error: ${editingCustomer ? "Gagal Memperbarui" : "Gagal Menambahkan"}`,
        description: result.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
      // Keep form open if ID was duplicate for new customer
      if (!editingCustomer && result.message && result.message.includes("ID Pelanggan")) {
        // Don't close form
      } else {
        // setIsFormOpen(false); // Optionally close form on other errors
      }
    }
  };
  
  const columns = customerColumnsDef({ onEdit: handleEditCustomer, onDelete: handleDeleteCustomer });

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Memuat data pelanggan...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      {/* Title is handled by AdminLayout */}
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
