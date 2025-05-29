
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
import { CalendarIcon, UploadCloud, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { Payment } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const paymentConfirmationSchema = z.object({
  paymentDate: z.date({ required_error: 'Tanggal pembayaran harus diisi.' }),
  amount: z.coerce.number().positive({ message: 'Jumlah bayar harus positif.' }),
  paymentMethod: z.enum(['transfer', 'tunai_kolektor', 'online', 'other'], { required_error: 'Metode pembayaran harus dipilih.' }),
  proofFile: z.any().optional(),
  signatureText: z.string().optional(),
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
  
  // Determine visibility based on payment method
  const showProofUpload = paymentMethod === 'transfer' || paymentMethod === 'tunai_kolektor' || (paymentMethod === 'other' && !form.getValues('signatureText'));
  const showSignatureInput = paymentMethod === 'tunai_kolektor';
  const isOnlinePayment = paymentMethod === 'online';

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        paymentDate: new Date(),
        amount: defaultAmount,
        paymentMethod: 'transfer', // Default to transfer
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
      // Basic file type validation (optional, but good practice)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipe File Tidak Diizinkan",
          description: "Hanya file gambar (JPG, PNG, GIF) atau PDF yang diizinkan.",
          variant: "destructive",
        });
        setFileName(null);
        form.setValue('proofFile', undefined);
        event.target.value = ''; // Clear the input
        return;
      }

      if (file.size > maxSize) {
         toast({
          title: "Ukuran File Terlalu Besar",
          description: `Ukuran file maksimal adalah ${maxSize / (1024*1024)}MB.`,
          variant: "destructive",
        });
        setFileName(null);
        form.setValue('proofFile', undefined);
        event.target.value = ''; // Clear the input
        return;
      }

      setFileName(file.name);
      form.setValue('proofFile', file);
    } else {
      setFileName(null);
      form.setValue('proofFile', undefined);
    }
  };

  const handleSubmit = (values: PaymentConfirmationFormValues) => {
    let signatureDataUrl: string | undefined = undefined;
    let proofFileName: string | undefined = undefined;

    if (values.paymentMethod === 'tunai_kolektor' && values.signatureText && values.signatureText.trim() !== '') {
      signatureDataUrl = `Ditandatangani oleh: ${values.signatureText.trim()}`;
    }
    
    if ((values.paymentMethod === 'transfer' || values.paymentMethod === 'other' || values.paymentMethod === 'tunai_kolektor') && fileName) {
        // For now, we are just storing the file name.
        // In a real app, `values.proofFile` (the File object) would be uploaded here.
        proofFileName = fileName; 
    }
    
    if (values.paymentMethod === 'online') {
        proofFileName = undefined;
        signatureDataUrl = undefined;
    }

    const submissionData = {
        paymentDate: values.paymentDate.toISOString(),
        amount: values.amount,
        paymentMethod: values.paymentMethod as Payment['paymentMethod'], 
        notes: values.notes,
        proofFileName: proofFileName, // This is just the name for now
        signatureDataUrl: signatureDataUrl,
    };
    onSubmit(submissionData);
    // Toast is now handled by the calling component (e.g. TagihanPage) after Firestore operation result
    // onClose(); // Also handled by calling component
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        Untuk pembayaran online, pastikan Anda telah melakukan pembayaran melalui DANA ke akun Admin. Formulir ini digunakan untuk mencatat konfirmasi dan ID transaksi jika diperlukan.
                    </AlertDescription>
                </Alert>
            )}

            {showProofUpload && !isOnlinePayment && (
              <FormItem>
                <FormLabel>Bukti Pembayaran</FormLabel>
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
                {paymentMethod === 'tunai_kolektor' && <p className="text-xs text-muted-foreground mt-1">(Opsional: Unggah foto kuitansi dari kolektor jika ada).</p>}
                {paymentMethod === 'transfer' && <p className="text-xs text-muted-foreground mt-1">Unggah bukti transfer Anda (gambar atau PDF).</p>}
                {paymentMethod === 'other' && <p className="text-xs text-muted-foreground mt-1">Unggah bukti jika metode 'Lainnya' memerlukan bukti transfer.</p>}
                <FormMessage />
              </FormItem>
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
                {form.formState.isSubmitting ? 'Mengirim...' : 'Kirim Konfirmasi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


    