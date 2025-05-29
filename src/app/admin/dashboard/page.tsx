import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wifi, AlertTriangle, DollarSign } from "lucide-react";

export default function AdminDashboardPage() {
  // In a real app, these values would come from data fetching
  const totalCustomers = 125;
  const activePackages = 5;
  const overduePayments = 12;
  const monthlyRevenue = 5500000; // Example in IDR

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">+2 dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paket Aktif</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePackages}</div>
            <p className="text-xs text-muted-foreground">Jenis paket tersedia</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pembayaran Tertunggak</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overduePayments}</div>
            <p className="text-xs text-muted-foreground">Pelanggan belum bayar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {monthlyRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">+15% dari bulan lalu</p>
          </CardContent>
        </Card>
      </div>
      {/* Placeholder for charts or more detailed reports */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Laporan Tambahan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Grafik dan data lebih detail akan ditampilkan di sini.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
