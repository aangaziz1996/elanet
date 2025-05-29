
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription as ShadcnFormDescription, // Renamed to avoid conflict
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Customer, CustomerStatus } from '@/types/customer';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const customerFormSchema = z.object({
  id: z.string().min(3, { message: 'ID Pelanggan minimal 3 karakter.' }).max(50, {message: 'ID Pelanggan maksimal 50 karakter.'}),
  firebaseUID: z.string().max(128, {message: "Firebase UID terlalu panjang."}).optional().or(z.literal('')),
  name: z.string().min(3, { message: 'Nama minimal 3 karakter.' }).max(100),
  address: z.string().min(5, { message: 'Alamat minimal 5 karakter.' }).max(255),
  phoneNumber: z.string().min(10, { message: 'Nomor telepon minimal 10 digit.' }).max(15)
    .regex(/^\+?[0-9\s-()]*$/, { message: 'Format nomor telepon tidak valid.' }),
  email: z.string().email({ message: 'Format email tidak valid.' }).optional().or(z.literal('')),
  wifiPackage: z.string().min(1, { message: 'Paket WiFi harus diisi.' }),
  joinDate: z.date({ required_error: 'Tanggal bergabung harus diisi.' }),
  installationDate: z.date().optional(),
  billingCycleDay: z.coerce.number().min(1).max(28, {message: "Hari siklus penagihan antara 1-28"}), // Max 28 for simplicity
  status: z.enum(['aktif', 'nonaktif', 'isolir', 'baru', 'berhenti']),
  notes: z.string().max(500).optional().or(z.literal('')),
  // Technical details - keep them optional
  onuMacAddress: z.string().optional().or(z.literal('')),
  ipAddress: z.string().optional().or(z.literal('')),
  routerUsername: z.string().optional().or(z.literal('')),
  routerPassword: z.string().optional().or(z.literal('')),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

const defaultWifiPackages = ["5 Mbps", "10 Mbps", "20 Mbps", "30 Mbps", "50 Mbps", "100 Mbps", "Custom"];
const customerStatuses: CustomerStatus[] = ['baru', 'aktif', 'nonaktif', 'isolir', 'berhenti'];


interface CustomerFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormValues) => void;
  customerToEdit?: Customer | null;
}

export default function CustomerFormDialog({
  isOpen,
  onClose,
  onSubmit,
  customerToEdit,
}: CustomerFormDialogProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      id: '',
      firebaseUID: '',
      name: '',
      address: '',
      phoneNumber: '',
      email: '',
      wifiPackage: '',
      joinDate: new Date(),
      installationDate: undefined,
      billingCycleDay: 1,
      status: 'baru',
      notes: '',
      onuMacAddress: '',
      ipAddress: '',
      routerUsername: '',
      routerPassword: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) { // Ensure form reset only happens when dialog is opened or customerToEdit changes
      if (customerToEdit) {
        form.reset({
          ...customerToEdit,
          id: customerToEdit.id, // Should always be present
          firebaseUID: customerToEdit.firebaseUID || '',
          name: customerToEdit.name || '', // Should always be present
          address: customerToEdit.address || '', // Should always be present
          phoneNumber: customerToEdit.phoneNumber || '', // Should always be present
          email: customerToEdit.email || '',
          wifiPackage: customerToEdit.wifiPackage || defaultWifiPackages[0], // Should always be present
          joinDate: customerToEdit.joinDate ? parseISO(customerToEdit.joinDate) : new Date(),
          installationDate: customerToEdit.installationDate ? parseISO(customerToEdit.installationDate) : undefined,
          billingCycleDay: customerToEdit.billingCycleDay || 1,
          status: customerToEdit.status || 'baru', // Should always be present
          notes: customerToEdit.notes || '',
          onuMacAddress: customerToEdit.onuMacAddress || '',
          ipAddress: customerToEdit.ipAddress || '',
          routerUsername: customerToEdit.routerUsername || '',
          routerPassword: customerToEdit.routerPassword || '',
        });
      } else {
        form.reset({
          id: '',
          firebaseUID: '',
          name: '',
          address: '',
          phoneNumber: '',
          email: '',
          wifiPackage: defaultWifiPackages[0],
          joinDate: new Date(),
          installationDate: undefined,
          billingCycleDay: 1,
          status: 'baru',
          notes: '',
          onuMacAddress: '',
          ipAddress: '',
          routerUsername: '',
          routerPassword: '',
        });
      }
    }
  }, [customerToEdit, form, isOpen]);

  const handleSubmit = (values: CustomerFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customerToEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
          </DialogTitle>
          <DialogDescription>
            Lengkapi informasi pelanggan di bawah ini.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Pelanggan (Custom)</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: cust_xyz001" {...field} disabled={!!customerToEdit} />
                  </FormControl>
                  <ShadcnFormDescription>
                    ID unik internal untuk referensi. Tidak dapat diubah setelah dibuat.
                  </ShadcnFormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firebaseUID"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firebase User ID (UID)</FormLabel>
                  <FormControl>
                    <Input placeholder="UID dari Firebase Authentication" {...field} />
                  </FormControl>
                  <ShadcnFormDescription>
                    Link ke akun Firebase Authentication pelanggan. Diperlukan agar pelanggan bisa login.
                  </ShadcnFormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama pelanggan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Telepon</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="08xxxxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Lengkap</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Alamat pemasangan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Pelanggan)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                     <ShadcnFormDescription>Email ini sebaiknya sama dengan email login Firebase pelanggan.</ShadcnFormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wifiPackage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paket WiFi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''} >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih paket WiFi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {defaultWifiPackages.map((pkg) => (
                          <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="joinDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Bergabung</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: localeId })
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="installationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Instalasi (Opsional)</FormLabel>
                     <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: localeId })
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                           disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="billingCycleDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hari Siklus Tagihan</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="28" placeholder="1-28" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Pelanggan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'baru'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customerStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Catatan tambahan mengenai pelanggan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-primary hover:underline list-none group-open:mb-2">
                Detail Teknis (Opsional)
              </summary>
              <div className="space-y-4 p-4 border rounded-md">
                <FormField
                  control={form.control}
                  name="onuMacAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MAC Address ONU</FormLabel>
                      <FormControl><Input placeholder="XX:XX:XX:XX:XX:XX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ipAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat IP</FormLabel>
                      <FormControl><Input placeholder="192.168.x.x" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="routerUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username Router</FormLabel>
                      <FormControl><Input placeholder="Username login router" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="routerPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Router</FormLabel>
                      <FormControl><Input placeholder="Password login router" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </details>


            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Menyimpan...' : (customerToEdit ? 'Simpan Perubahan' : 'Tambah Pelanggan')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Renaming Shadcn's FormDescription to avoid conflict with local variable.
export { FormDescription as ShadcnFormDescription } from '@/components/ui/form';
