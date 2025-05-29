
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
import { CalendarIcon, Info } from 'lucide-react'; // Dihapus: UploadCloud, ImageIcon
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { Payment } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const paymentConfirmationSchema = z.object({
  paymentDate: z.date({ required_error: 'Tanggal pembayaran harus diisi.' }),
  amount: z.coerce.number().positive({ message: 'Jumlah bayar harus positif.' }),
  paymentMethod: z.enum(['transfer', 'tunai_kolektor', 'online', 'other'], { required_error: 'Metode pembayaran harus dipilih.' }),
  signatureText: z.string().optional(),
  notes: z.string().max(255).optional(),
});

type PaymentConfirmationFormValues = z.infer<typeof paymentConfirmationSchema>;

interface PaymentConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Payment, 'id' | 'periodStart' | 'periodEnd' | 'paymentStatus' > & { signatureDataUrl?: string }) => void;
  defaultAmount: number;
}

export default function PaymentConfirmationDialog({
  isOpen,
  onClose,
  onSubmit,
  defaultAmount,
}: PaymentConfirmationDialogProps) {
  const { toast } = useToast();

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
  
  const showSignatureInput = paymentMethod === 'tunai_kolektor';
  const isOnlinePayment = paymentMethod === 'online';

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        paymentDate: new Date(),
        amount: defaultAmount,
        paymentMethod: 'transfer',
        notes: '',
        signatureText: '',
      });
    }
  }, [isOpen, defaultAmount, form]);

  const handleSubmit = (values: PaymentConfirmationFormValues) => {
    let signatureDataUrl: string | undefined = undefined;

    if (values.paymentMethod === 'tunai_kolektor' && values.signatureText && values.signatureText.trim() !== '') {
      signatureDataUrl = `Ditandatangani oleh: ${values.signatureText.trim()}`;
    }
    
    const submissionData = {
        paymentDate: values.paymentDate.toISOString(),
        amount: values.amount,
        paymentMethod: values.paymentMethod as Payment['paymentMethod'], 
        notes: values.notes,
        signatureDataUrl: signatureDataUrl,
    };
    onSubmit(submissionData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
          <DialogDescription>
            Lengkapi detail pembayaran Anda. Pilih metode yang sesuai.
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
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih metode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer Bank</SelectItem>
                      <SelectItem value="tunai_kolektor">Tunai (Kolektor/di Tempat)</SelectItem>
                      <SelectItem value="online">Online (via DANA Admin)</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isOnlinePayment && (
                <Alert variant="default" className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 text-xs">
                        Untuk pembayaran online, pastikan Anda telah melakukan pembayaran melalui DANA ke akun Admin. Formulir ini dapat digunakan untuk mencatat konfirmasi dan ID transaksi Anda jika diperlukan pada bagian catatan.
                    </AlertDescription>
                </Alert>
            )}

            {showSignatureInput && (
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
                    <Textarea 
                      placeholder={
                        paymentMethod === 'tunai_kolektor' 
                        ? "Contoh: Pembayaran diterima oleh kolektor Budi di rumah pada tanggal DD/MM/YYYY."
                        : paymentMethod === 'online'
                        ? "Contoh: Pembayaran melalui DANA, Ref ID Transaksi: XXXXXYYYYY"
                        : paymentMethod === 'transfer'
                        ? "Misal: Pembayaran untuk bulan Juli, transfer dari BCD an. Pengirim"
                        : "Catatan tambahan terkait pembayaran."
                      } 
                      {...field} 
                    />
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
                {form.formState.isSubmitting ? 'Memproses...' : 'Kirim Konfirmasi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
