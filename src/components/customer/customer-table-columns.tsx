'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Customer, CustomerStatus } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';


const getStatusVariant = (status: CustomerStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'aktif':
      return 'default'; // Greenish or bluish (default primary)
    case 'baru':
      return 'outline'; // Neutral
    case 'isolir':
      return 'destructive'; // Reddish
    case 'nonaktif':
    case 'berhenti':
      return 'secondary'; // Grayish
    default:
      return 'secondary';
  }
};

const getStatusText = (status: CustomerStatus): string => {
    switch (status) {
      case 'aktif': return 'Aktif';
      case 'baru': return 'Baru';
      case 'isolir': return 'Isolir';
      case 'nonaktif': return 'Nonaktif';
      case 'berhenti': return 'Berhenti';
      default: return status;
    }
};


export const columns = ({
  onEdit,
  onDelete,
  onViewDetails, // Optional: for a dedicated detail view
}: {
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onViewDetails?: (customer: Customer) => void;
}): ColumnDef<Customer>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nama
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'wifiPackage',
    header: 'Paket WiFi',
  },
  {
    accessorKey: 'joinDate',
    header: 'Tgl Gabung',
    cell: ({ row }) => {
      const date = row.getValue('joinDate');
      return date ? format(new Date(date as string), 'dd MMM yyyy', { locale: id }) : '-';
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as CustomerStatus;
      return (
        <Badge variant={getStatusVariant(status)}>
          {getStatusText(status)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'phoneNumber',
    header: 'No. Telepon',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            {onViewDetails && (
                 <DropdownMenuItem onClick={() => onViewDetails(customer)}>
                 <Eye className="mr-2 h-4 w-4" />
                 Lihat Detail
               </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(customer)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(customer.id)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
