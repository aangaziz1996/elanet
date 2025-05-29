
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, addMonths, setDate } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { Payment } from '@/types/customer';
import { ScrollArea } from '@/components/ui/scroll-area';

const paymentSchema = z.object({
  customerFirestoreDocId: z.string().min(1, { message: 'Pelanggan harus dipilih.' }),
  paymentDate: z.date({ required_error: 'Tanggal pembayaran harus diisi.' }),
  amount: z.coerce.number().positive({ message: 'Jumlah bayar harus positif.' }),
  periodStart: z.date({ required_error: 'Tanggal mulai periode harus diisi.'}),
  periodEnd: z.date({ required_error: 'Tanggal akhir periode harus diisi.'}),
  paymentMethod: z.enum(['tunai_kolektor', 'transfer', 'online', 'other'], { required_error: 'Metode pembayaran harus dipilih.' }),
  paymentStatus: z.enum(['pending_konfirmasi', 'lunas', 'ditolak'], { required_error: 'Status pembayaran harus dipilih.'}),
  notes: z.string().max(500).optional().or(z.literal('')),
  signatureDataUrl: z.string().max(255).optional().or(z.literal('')),
}).refine(data => data.periodEnd >= data.periodStart, {
  message: "Tanggal akhir periode tidak boleh sebelum tanggal mulai.",
  path: ["periodEnd"],
});

export type AdminAddPaymentFormValues = z.infer<typeof paymentSchema>;

interface AdminAddPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Payment, customerFirestoreDocId: string) => Promise<void>;
  customers: { id: string; name: string; firestoreDocId: string }[];
}

const paymentMethods: Payment['paymentMethod'][] = ['transfer', 'tunai_kolektor', 'online', 'other'];
const paymentStatuses: Payment['paymentStatus'][] = ['lunas', 'pending_konfirmasi', 'ditolak'];

export default function AdminAddPaymentDialog({
  isOpen,
  onClose,
  onSubmit,
  customers,
}: AdminAddPaymentDialogProps) {
  const form = useForm<AdminAddPaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customerFirestoreDocId: '',
      paymentDate: new Date(),
      amount: 0,
      periodStart: new Date(),
      periodEnd: addMonths(new Date(), 1), // Default period end 1 month from now
      paymentMethod: 'transfer',
      paymentStatus: 'lunas',
      notes: '',
      signatureDataUrl: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const firstDayOfMonth = setDate(today, 1); // Default period start to 1st of current month
      const lastDayOfMonth = addMonths(firstDayOfMonth, 1); // Default period end to 1st of next month
      lastDayOfMonth.setDate(lastDayOfMonth.getDate() -1); // then subtract one day

      form.reset({ 
        customerFirestoreDocId: '',
        paymentDate: today,
        amount: 100000, 
        periodStart: firstDayOfMonth,
        periodEnd: lastDayOfMonth, 
        paymentMethod: 'transfer',
        paymentStatus: 'lunas',
        notes: '',
        signatureDataUrl: '',
      });
    }
  }, [isOpen, form]);

  const handleSubmit = async (values: AdminAddPaymentFormValues) => {
    setIsSubmitting(true);
    const newPayment: Payment = {
      id: uuidv4(),
      paymentDate: values.paymentDate.toISOString(),
      amount: values.amount,
      periodStart: values.periodStart.toISOString(),
      periodEnd: values.periodEnd.toISOString(),
      paymentMethod: values.paymentMethod,
      paymentStatus: values.paymentStatus,
      notes: values.notes || undefined, // Ensure empty string becomes undefined
      signatureDataUrl: values.signatureDataUrl || undefined, // Ensure empty string becomes undefined
    };
    await onSubmit(newPayment, values.customerFirestoreDocId);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Tambah Pembayaran Manual</DialogTitle>
          <DialogDescription>
            Pilih pelanggan dan masukkan detail pembayaran baru.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[65vh] pr-6"> 
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="customerFirestoreDocId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilih Pelanggan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Pilih pelanggan..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.length > 0 ? (
                          customers.map(customer => (
                            <SelectItem key={customer.firestoreDocId} value={customer.firestoreDocId}>
                              {customer.name} (ID: {customer.id})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-customers" disabled>Tidak ada pelanggan tersedia</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal Pembayaran</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP", { locale: localeId }) : <span>Pilih tanggal</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Bayar (Rp)</FormLabel>
                      <FormControl><Input type="number" placeholder="150000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="periodStart"
                      render={({ field }) => (
                      <FormItem className="flex flex-col">
                          <FormLabel>Periode Mulai</FormLabel>
                          <Popover>
                          <PopoverTrigger asChild>
                              <FormControl>
                              <Button
                                  variant={"outline"}
                                  className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                                  {field.value ? format(field.value, "PPP", { locale: localeId }) : <span>Pilih tanggal</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                              </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                          </Popover>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="periodEnd"
                      render={({ field }) => (
                      <FormItem className="flex flex-col">
                          <FormLabel>Periode Akhir</FormLabel>
                          <Popover>
                          <PopoverTrigger asChild>
                              <FormControl>
                              <Button
                                  variant={"outline"}
                                  className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                                  {field.value ? format(field.value, "PPP", { locale: localeId }) : <span>Pilih tanggal</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                              </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                  name="paymentMethod"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Metode Pembayaran</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                          <SelectTrigger><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {paymentMethods.map(method => (
                              <SelectItem key={method} value={method} className="capitalize">
                              {method.replace(/_/g, ' ')}
                              </SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Status Pembayaran</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                          <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {paymentStatuses.map(status => (
                              <SelectItem key={status} value={status} className="capitalize">
                              {status.replace(/_/g, ' ')}
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
                    <FormControl><Textarea placeholder="Catatan tambahan" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="signatureDataUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanda Tangan (Opsional, jika tunai)</FormLabel>
                    <FormControl><Input placeholder="Contoh: Ditandatangani oleh: Budi (Admin)" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tambah Pembayaran
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
