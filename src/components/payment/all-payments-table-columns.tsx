
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Payment } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, CheckCircle, AlertCircle, Clock, XCircle, ThumbsUp, ThumbsDown, Edit2, MoreVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


export type PaymentWithCustomerInfo = Payment & { 
  customerId: string; // Custom ID
  customerName: string; 
  customerFirestoreDocId?: string; // Firestore document ID of the customer
};

interface AllPaymentsTableColumnProps {
  onConfirmPayment: (paymentId: string, customerCustomId: string) => void;
  onRejectPayment: (paymentId: string, customerCustomId: string) => void;
  onEditPayment: (payment: PaymentWithCustomerInfo) => void; // Added
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


export const columns = ({ onConfirmPayment, onRejectPayment, onEditPayment }: AllPaymentsTableColumnProps): ColumnDef<PaymentWithCustomerInfo>[] => [
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
      return date ? format(parseISO(date as string), 'dd MMM yyyy', { locale: localeId }) : '-';
    },
  },
  {
    accessorKey: 'periodStart', 
    header: 'Periode',
    cell: ({ row }) => {
      const periodStart = row.original.periodStart;
      const periodEnd = row.original.periodEnd;
      return periodStart && periodEnd 
        ? `${format(parseISO(periodStart), 'dd/MM/yy', { locale: localeId })} - ${format(parseISO(periodEnd), 'dd/MM/yy', { locale: localeId })}`
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
    accessorKey: 'signatureDataUrl',
    header: 'Tanda Tangan',
    cell: ({ row }) => {
      const signature = row.getValue('signatureDataUrl') as string | undefined;
      if (!signature) return '-';
      return (
        <div className="text-xs text-muted-foreground italic flex items-center gap-1" title={signature}>
            <Edit2 className="h-3 w-3 flex-shrink-0" /> 
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
      return (
        <div className="flex justify-center items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Buka menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi Pembayaran</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEditPayment(payment)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Pembayaran
              </DropdownMenuItem>
              {payment.paymentStatus === 'pending_konfirmasi' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onConfirmPayment(payment.id, payment.customerId)} className="text-green-600 focus:text-green-700 focus:bg-green-100">
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Konfirmasi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRejectPayment(payment.id, payment.customerId)} className="text-red-600 focus:text-red-700 focus:bg-red-100">
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Tolak
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
