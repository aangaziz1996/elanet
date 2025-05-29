'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSignIcon } from "lucide-react";

export default function PembayaranPage() {
  return (
    <div className="container mx-auto py-8">
       {/* Title is handled by AdminLayout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="w-6 h-6" />
            Manajemen Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Fitur untuk mencatat pembayaran, melihat riwayat, dan mengelola tagihan akan dikembangkan di sini.
          </p>
          <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <h3 className="text-xl font-semibold">Segera Hadir</h3>
            <p className="text-muted-foreground mt-2">
              Pantau terus untuk pembaruan fitur pembayaran!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
