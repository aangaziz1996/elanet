
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';

const CUSTOMER_TABLE_VISIBILITY_KEY = 'customerTableColumnVisibility';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function CustomerDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  
  // Load initial column visibility from localStorage
  const getInitialVisibility = (): VisibilityState => {
    if (typeof window !== 'undefined') {
      const storedVisibility = localStorage.getItem(CUSTOMER_TABLE_VISIBILITY_KEY);
      if (storedVisibility) {
        try {
          return JSON.parse(storedVisibility);
        } catch (e) {
          console.error("Error parsing column visibility from localStorage", e);
          return {}; // Default to showing all columns on error
        }
      }
    }
    return {}; // Default to showing all columns if nothing stored or SSR
  };

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(getInitialVisibility());
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: (newVisibilityUpdater) => {
      // newVisibilityUpdater can be a function or an object
      // We need to resolve it to an object before saving
      const newVisibility = typeof newVisibilityUpdater === 'function' 
        ? newVisibilityUpdater(columnVisibility) 
        : newVisibilityUpdater;

      setColumnVisibility(newVisibility);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CUSTOMER_TABLE_VISIBILITY_KEY, JSON.stringify(newVisibility));
      }
    },
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      // We manage columnVisibility through useState initialized from localStorage
      // so we don't need to set it here in initialState if using that approach.
      // If we weren't using useState for initial visibility, we'd put it here.
    }
  });

  // Effect to update localStorage when columnVisibility changes
  // This is an alternative way to handle it if onColumnVisibilityChange doesn't directly set localStorage
  // React.useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     localStorage.setItem(CUSTOMER_TABLE_VISIBILITY_KEY, JSON.stringify(columnVisibility));
  //   }
  // }, [columnVisibility]);


  return (
    <div>
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Cari berdasarkan nama..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Kolom <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === 'name' ? 'Nama' : 
                     column.id === 'wifiPackage' ? 'Paket WiFi' :
                     column.id === 'joinDate' ? 'Tgl Gabung' :
                     column.id === 'status' ? 'Status' :
                     column.id === 'phoneNumber' ? 'No. Telepon' :
                     column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} dari{" "}
          {table.getFilteredRowModel().rows.length} baris terpilih.
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
