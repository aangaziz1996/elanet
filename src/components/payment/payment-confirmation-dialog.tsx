
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
import { CalendarIcon, UploadCloud, Info, Image as ImageIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { Payment } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Max file size for Base64 conversion (e.g., 200KB for original image)
// Base64 string will be ~33% larger. 200KB * 1.33 ~= 266KB string.
// Firestore doc limit is 1MiB. Be very conservative.
const MAX_ORIGINAL_FILE_SIZE_BYTES = 200 * 1024; // 200KB

const paymentConfirmationSchema = z.object({
  paymentDate: z.date({ required_error: 'Tanggal pembayaran harus diisi.' }),
  amount: z.coerce.number().positive({ message: 'Jumlah bayar harus positif.' }),
  paymentMethod: z.enum(['transfer', 'tunai_kolektor', 'online', 'other'], { required_error: 'Metode pembayaran harus dipilih.' }),
  proofImage: z.any().optional(), // Will hold File object for image
  signatureText: z.string().optional(),
  notes: z.string().max(255).optional(),
});

type PaymentConfirmationFormValues = z.infer<typeof paymentConfirmationSchema>;

interface PaymentConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Payment, 'id' | 'periodStart' | 'periodEnd' | 'paymentStatus' > & { proofOfPaymentUrl?: string; signatureDataUrl?: string }) => void;
  defaultAmount: number;
}

export default function PaymentConfirmationDialog({
  isOpen,
  onClose,
  onSubmit,
  defaultAmount,
}: PaymentConfirmationDialogProps) {
  const { toast } = useToast();
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null);
  const [imageBase64, setImageBase64] = React.useState<string | null>(null);
  const [isConvertingImage, setIsConvertingImage] = React.useState(false);

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
  
  const showProofUpload = paymentMethod === 'transfer' || paymentMethod === 'other' || paymentMethod === 'tunai_kolektor';
  const showSignatureInput = paymentMethod === 'tunai_kolektor';
  const isOnlinePayment = paymentMethod === 'online';

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        paymentDate: new Date(),
        amount: defaultAmount,
        paymentMethod: 'transfer',
        notes: '',
        proofImage: undefined,
        signatureText: '',
      });
      setSelectedFileName(null);
      setImageBase64(null);
      setIsConvertingImage(false);
    }
  }, [isOpen, defaultAmount, form]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFileName(null); // Reset previous selection
    setImageBase64(null);
    form.setValue('proofImage', undefined);


    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipe File Tidak Diizinkan",
          description: "Hanya file gambar (JPG, PNG, GIF) yang diizinkan untuk disimpan langsung.",
          variant: "destructive",
        });
        event.target.value = ''; // Clear the input
        return;
      }

      if (file.size > MAX_ORIGINAL_FILE_SIZE_BYTES) {
         toast({
          title: "Ukuran File Terlalu Besar",
          description: `Ukuran file gambar maksimal ${MAX_ORIGINAL_FILE_SIZE_BYTES / 1024}KB untuk disimpan langsung. Harap kompres gambar Anda.`,
          variant: "destructive",
        });
        event.target.value = '';
        return;
      }
      
      setIsConvertingImage(true);
      setSelectedFileName(file.name);
      form.setValue('proofImage', file); // Keep file object for now if needed

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
        setIsConvertingImage(false);
      };
      reader.onerror = () => {
        toast({ title: "Error", description: "Gagal membaca file gambar.", variant: "destructive" });
        setIsConvertingImage(false);
        setSelectedFileName(null);
        setImageBase64(null);
        form.setValue('proofImage', undefined);
      }
      reader.readAsDataURL(file);

    }
  };

  const handleSubmit = (values: PaymentConfirmationFormValues) => {
    if (isConvertingImage) {
      toast({ title: "Harap Tunggu", description: "Gambar sedang diproses...", variant: "default" });
      return;
    }

    let signatureDataUrl: string | undefined = undefined;
    let proofOfPaymentUrlValue: string | undefined = undefined;

    if (values.paymentMethod === 'tunai_kolektor' && values.signatureText && values.signatureText.trim() !== '') {
      signatureDataUrl = `Ditandatangani oleh: ${values.signatureText.trim()}`;
    }
    
    // Only use imageBase64 if the method allows proof and image is actually converted
    if (showProofUpload && imageBase64 && !isOnlinePayment) {
        proofOfPaymentUrlValue = imageBase64;
    }
    
    const submissionData = {
        paymentDate: values.paymentDate.toISOString(),
        amount: values.amount,
        paymentMethod: values.paymentMethod as Payment['paymentMethod'], 
        notes: values.notes,
        proofOfPaymentUrl: proofOfPaymentUrlValue,
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
            <Alert variant="destructive" className="mt-2 text-xs">
                <ImageIcon className="h-4 w-4" />
                <AlertTitle>Penting Mengenai Bukti Gambar!</AlertTitle>
                <AlertDescription>
                    Jika Anda mengunggah gambar, pastikan ukurannya **sangat kecil (dibawah {MAX_ORIGINAL_FILE_SIZE_BYTES / 1024}KB)**. Gambar besar dapat menyebabkan kegagalan penyimpanan.
                </AlertDescription>
            </Alert>
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset proof if method changes
                      setSelectedFileName(null);
                      setImageBase64(null);
                      form.setValue('proofImage', undefined);
                    }} 
                    value={field.value} // Use value from field
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

            {showProofUpload && !isOnlinePayment && (
              <FormItem>
                <FormLabel>Bukti Pembayaran (Gambar Kecil)</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" asChild className="relative overflow-hidden">
                      <div>
                          <UploadCloud className="mr-2 h-4 w-4" /> Unggah Gambar
                          <Input 
                              id="proofImage"
                              type="file" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={handleFileChange}
                              accept="image/jpeg,image/png,image/gif" // Only image types
                              disabled={isConvertingImage}
                          />
                      </div>
                    </Button>
                      {isConvertingImage && <span className="text-sm text-muted-foreground">Memproses...</span>}
                      {selectedFileName && !isConvertingImage && <span className="text-sm text-muted-foreground truncate max-w-[200px]">{selectedFileName}</span>}
                  </div>
                </FormControl>
                {paymentMethod === 'tunai_kolektor' && <p className="text-xs text-muted-foreground mt-1">(Opsional: Unggah foto kuitansi kecil dari kolektor jika ada).</p>}
                {paymentMethod === 'transfer' && <p className="text-xs text-muted-foreground mt-1">Unggah bukti transfer Anda (gambar kecil).</p>}
                {paymentMethod === 'other' && <p className="text-xs text-muted-foreground mt-1">Unggah bukti jika metode 'Lainnya' memerlukan bukti (gambar kecil).</p>}
                {imageBase64 && (
                  <div className="mt-2">
                    <FormLabel className="text-xs">Preview:</FormLabel>
                    <img src={imageBase64} alt="Preview bukti" className="max-w-xs max-h-32 border rounded-md object-contain" />
                  </div>
                )}
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
              <Button type="submit" disabled={form.formState.isSubmitting || isConvertingImage}>
                {form.formState.isSubmitting || isConvertingImage ? 'Memproses...' : 'Kirim Konfirmasi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
    
    