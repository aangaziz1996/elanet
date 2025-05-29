
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Payment } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Eye, CheckCircle, AlertCircle, Clock, XCircle, ThumbsUp, ThumbsDown, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image'; // Import next/image
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Import Popover

export type PaymentWithCustomerInfo = Payment & { 
  customerId: string; 
  customerName: string; 
};

interface AllPaymentsTableColumnProps {
  onConfirmPayment: (paymentId: string, customerCustomId: string) => void;
  onRejectPayment: (paymentId: string, customerCustomId: string) => void;
}

const getPaymentStatusBadgeVariant = (status: Payment['paymentStatus']): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'lunas':
      return 'default'; 
    case 'pending_konfirmasi':
      return 'outline'; 
    case 'ditolak':
      return 'destructive'; 
    default:
      return 'secondary';
  }
};
const getPaymentStatusText = (status: Payment['paymentStatus']): string => {
    switch (status) {
      case 'lunas': return 'Lunas';
      case 'pending_konfirmasi': return 'Pending';
      case 'ditolak': return 'Ditolak';
      default: return status;
    }
};
const getPaymentStatusIcon = (status: Payment['paymentStatus']): React.ElementType => {
    switch (status) {
      case 'lunas': return CheckCircle;
      case 'pending_konfirmasi': return Clock;
      case 'ditolak': return XCircle;
      default: return AlertCircle;
    }
};


export const columns = ({ onConfirmPayment, onRejectPayment }: AllPaymentsTableColumnProps): ColumnDef<PaymentWithCustomerInfo>[] => [
  {
    accessorKey: 'customerName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Nama Pelanggan
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
        const customerSearchId = row.original.customerId; 
        return (
            <Link href={`/admin/pelanggan?search=${customerSearchId}`} className="hover:underline text-primary">
                {row.getValue('customerName')}
            </Link>
        )
    }
  },
  {
    accessorKey: 'paymentDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Tgl Bayar
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('paymentDate');
      return date ? format(new Date(date as string), 'dd MMM yyyy', { locale: localeId }) : '-';
    },
  },
  {
    accessorKey: 'periodStart', 
    header: 'Periode',
    cell: ({ row }) => {
      const periodStart = row.original.periodStart;
      const periodEnd = row.original.periodEnd;
      return periodStart && periodEnd 
        ? `${format(new Date(periodStart), 'dd/MM/yy', { locale: localeId })} - ${format(new Date(periodEnd), 'dd/MM/yy', { locale: localeId })}`
        : '-';
    },
  },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Jumlah</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      return <div className="text-right font-medium">Rp {amount.toLocaleString('id-ID')}</div>;
    },
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Metode',
    cell: ({row}) => <span className="capitalize">{row.original.paymentMethod?.replace(/_/g, ' ')}</span>
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Status Bayar',
    cell: ({ row }) => {
      const status = row.getValue('paymentStatus') as Payment['paymentStatus'];
      const Icon = getPaymentStatusIcon(status);
      return (
        <Badge variant={getPaymentStatusBadgeVariant(status)} 
               className={cn(
                status === 'lunas' && 'bg-green-500 hover:bg-green-600 text-white',
                status === 'pending_konfirmasi' && 'border-yellow-500 text-yellow-600',
                status === 'ditolak' && '' 
               )}>
          <Icon className="mr-1 h-3 w-3" />
          {getPaymentStatusText(status)}
        </Badge>
      );
    },
    filterFn: (row, id, value: string[]) => { 
      return value.includes(row.getValue(id) as string);
    }
  },
  {
    accessorKey: 'proofOfPaymentUrl',
    header: 'Bukti',
    cell: ({ row }) => {
      const { toast } = useToast();
      const proofUrl = row.getValue('proofOfPaymentUrl') as string | undefined;
      if (!proofUrl) return '-';
      
      if (proofUrl.startsWith('data:image')) {
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="link" size="sm" className="h-auto p-0 text-primary hover:underline">
                <Eye className="mr-1 h-3 w-3" /> Lihat Gambar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              {/* Using <img> for Base64 data URI to avoid Next/Image config for remote patterns */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proofUrl} alt="Bukti Pembayaran" style={{maxWidth: '300px', maxHeight: '400px', objectFit: 'contain'}} className="rounded-md" data-ai-hint="payment proof" />
            </PopoverContent>
          </Popover>
        );
      }
      
      // Fallback for non-DataURI URLs or mock filenames
      const isHttpUrl = proofUrl.startsWith('http://') || proofUrl.startsWith('https://');
      const isPlaceholderCo = proofUrl.startsWith('https://placehold.co');

      return (
        <Button 
            variant="link" 
            size="sm" 
            className="h-auto p-0"
            onClick={(e) => {
                if (isHttpUrl || isPlaceholderCo) { 
                    window.open(proofUrl, '_blank');
                } else { 
                     e.preventDefault();
                     toast({ title: "Info Bukti Pembayaran", description: `File: ${proofUrl}`});
                }
            }}
        >
            <Eye className="mr-1 h-3 w-3" /> 
            {isHttpUrl || isPlaceholderCo ? 'Lihat Tautan' : 'Lihat Info'}
        </Button>
      );
    },
  },
  {
    accessorKey: 'signatureDataUrl',
    header: 'Tanda Tangan',
    cell: ({ row }) => {
      const signature = row.getValue('signatureDataUrl') as string | undefined;
      if (!signature) return '-';
      return (
        <div className="text-xs text-muted-foreground italic flex items-center gap-1" title={signature}>
            <Edit className="h-3 w-3 flex-shrink-0" /> 
            <span className="truncate">
                {signature.split(': ')[1] || signature}
            </span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Aksi</div>,
    cell: ({ row }) => {
      const payment = row.original;
      if (payment.paymentStatus === 'pending_konfirmasi') {
        return (
          <div className="flex justify-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-700 hover:bg-green-100 h-8 px-2"
              onClick={() => onConfirmPayment(payment.id, payment.customerId)}
              title="Konfirmasi Pembayaran"
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 px-2"
              onClick={() => onRejectPayment(payment.id, payment.customerId)}
              title="Tolak Pembayaran"
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
        );
      }
      return <div className="text-center">-</div>;
    },
  },
];
    

    