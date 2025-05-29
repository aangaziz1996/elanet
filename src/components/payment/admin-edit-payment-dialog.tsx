
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
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { Payment } from '@/types/customer';
import type { PaymentWithCustomerInfo } from './all-payments-table-columns';

const paymentSchema = z.object({
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

export type AdminEditPaymentFormValues = z.infer<typeof paymentSchema>;

interface AdminEditPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentId: string, customerId: string, data: AdminEditPaymentFormValues) => Promise<void>;
  paymentToEdit: PaymentWithCustomerInfo | null;
}

const paymentMethods: Payment['paymentMethod'][] = ['transfer', 'tunai_kolektor', 'online', 'other'];
const paymentStatuses: Payment['paymentStatus'][] = ['pending_konfirmasi', 'lunas', 'ditolak'];

export default function AdminEditPaymentDialog({
  isOpen,
  onClose,
  onSubmit,
  paymentToEdit,
}: AdminEditPaymentDialogProps) {
  const form = useForm<AdminEditPaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: new Date(),
      amount: 0,
      periodStart: new Date(),
      periodEnd: new Date(),
      paymentMethod: 'transfer',
      paymentStatus: 'pending_konfirmasi',
      notes: '',
      signatureDataUrl: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (paymentToEdit && isOpen) {
      form.reset({
        paymentDate: paymentToEdit.paymentDate ? parseISO(paymentToEdit.paymentDate) : new Date(),
        amount: paymentToEdit.amount || 0,
        periodStart: paymentToEdit.periodStart ? parseISO(paymentToEdit.periodStart) : new Date(),
        periodEnd: paymentToEdit.periodEnd ? parseISO(paymentToEdit.periodEnd) : new Date(),
        paymentMethod: paymentToEdit.paymentMethod || 'transfer',
        paymentStatus: paymentToEdit.paymentStatus || 'pending_konfirmasi',
        notes: paymentToEdit.notes || '',
        signatureDataUrl: paymentToEdit.signatureDataUrl || '',
      });
    }
  }, [paymentToEdit, isOpen, form]);

  const handleSubmit = async (values: AdminEditPaymentFormValues) => {
    if (!paymentToEdit) return;
    setIsSubmitting(true);
    await onSubmit(paymentToEdit.id, paymentToEdit.customerId, values);
    setIsSubmitting(false);
  };

  if (!paymentToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pembayaran untuk {paymentToEdit.customerName}</DialogTitle>
          <DialogDescription>
            ID Pembayaran: {paymentToEdit.id}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                  <FormLabel>Tanda Tangan (Opsional)</FormLabel>
                  <FormControl><Input placeholder="Contoh: Ditandatangani oleh: Budi" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
