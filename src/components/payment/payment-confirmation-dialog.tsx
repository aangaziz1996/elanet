
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import { CalendarIcon, UploadCloud } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { Payment } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';

const paymentConfirmationSchema = z.object({
  paymentDate: z.date({ required_error: 'Tanggal pembayaran harus diisi.' }),
  amount: z.coerce.number().positive({ message: 'Jumlah bayar harus positif.' }),
  paymentMethod: z.enum(['transfer', 'cash', 'online', 'other'], { required_error: 'Metode pembayaran harus dipilih.' }),
  proofFile: z.any().optional(), // In a real app, use z.instanceof(File) and refine
  signatureText: z.string().optional(), // For offline/cash signature
  notes: z.string().max(255).optional(),
});

type PaymentConfirmationFormValues = z.infer<typeof paymentConfirmationSchema>;

interface PaymentConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Payment, 'id' | 'periodStart' | 'periodEnd' | 'paymentStatus' > & { proofFileName?: string; signatureDataUrl?: string }) => void;
  defaultAmount: number;
}

export default function PaymentConfirmationDialog({
  isOpen,
  onClose,
  onSubmit,
  defaultAmount,
}: PaymentConfirmationDialogProps) {
  const { toast } = useToast();
  const [fileName, setFileName] = React.useState<string | null>(null);

  const form = useForm<PaymentConfirmationFormValues>({
    resolver: zodResolver(paymentConfirmationSchema),
    defaultValues: {
      paymentDate: new Date(),
      amount: defaultAmount,
      paymentMethod: 'transfer',
      notes: '',
      signatureText: '',
    },
  });
  
  const paymentMethod = useWatch({ control: form.control, name: 'paymentMethod' });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        paymentDate: new Date(),
        amount: defaultAmount,
        paymentMethod: 'transfer',
        notes: '',
        proofFile: undefined,
        signatureText: '',
      });
      setFileName(null);
    }
  }, [isOpen, defaultAmount, form]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      form.setValue('proofFile', file); // Store file object if needed for real upload
    } else {
      setFileName(null);
      form.setValue('proofFile', undefined);
    }
  };

  const handleSubmit = (values: PaymentConfirmationFormValues) => {
    let signatureDataUrl: string | undefined = undefined;
    if (values.paymentMethod === 'cash' && values.signatureText && values.signatureText.trim() !== '') {
      signatureDataUrl = `Ditandatangani oleh: ${values.signatureText.trim()}`;
    }

    const submissionData = {
        paymentDate: values.paymentDate.toISOString(),
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
        proofFileName: fileName || undefined, // Pass fileName for mock proofOfPaymentUrl
        signatureDataUrl: signatureDataUrl,
    };
    onSubmit(submissionData);
    toast({
      title: 'Konfirmasi Terkirim',
      description: 'Bukti pembayaran Anda sedang diproses.',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
          <DialogDescription>
            Lengkapi detail pembayaran Anda dan unggah bukti jika ada. Untuk pembayaran tunai, harap isi nama penyetor sebagai tanda tangan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                          date > new Date() || date < new Date("2020-01-01")
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Bayar</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} readOnly value={defaultAmount} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metode Pembayaran</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih metode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer Bank</SelectItem>
                      <SelectItem value="cash">Tunai (ke Kolektor)</SelectItem>
                      <SelectItem value="online">Gateway Online</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {paymentMethod !== 'cash' && (
              <FormItem>
                <FormLabel>Bukti Pembayaran (Opsional)</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" asChild className="relative overflow-hidden">
                      <div>
                          <UploadCloud className="mr-2 h-4 w-4" /> Unggah File
                          <Input 
                              id="proofFile"
                              type="file" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={handleFileChange}
                              accept="image/*,.pdf"
                          />
                      </div>
                    </Button>
                      {fileName && <span className="text-sm text-muted-foreground truncate max-w-[200px]">{fileName}</span>}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}

            {paymentMethod === 'cash' && (
                 <FormField
                    control={form.control}
                    name="signatureText"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tanda Tangan (Ketik Nama Jelas Penyetor)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Contoh: Budi Doremi (Penyetor)" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}


            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Misal: Pembayaran untuk bulan Juli, transfer dari BCD an. Pengirim" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Mengirim...' : 'Kirim Konfirmasi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
