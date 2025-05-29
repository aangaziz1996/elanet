
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wifi, AlertTriangle, DollarSign, BarChart3 } from "lucide-react";
import { getDashboardStatsAction } from "./actions"; // Import the server action

export default async function AdminDashboardPage() {
  const stats = await getDashboardStatsAction();

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
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">+2 dari bulan lalu (data statis)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* Changed title to be more generic, as 'Paket Aktif' count is complex */}
            <CardTitle className="text-sm font-medium">Pelanggan Aktif</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">Jumlah pelanggan dengan status aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pembayaran Tertunggak</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overduePayments}</div>
            <p className="text-xs text-muted-foreground">Pelanggan status 'isolir'</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats.monthlyRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">+15% dari bulan lalu (data statis)</p>
          </CardContent>
        </Card>
      </div>
      {/* Placeholder for charts or more detailed reports */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Laporan Tambahan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Grafik dan data lebih detail akan ditampilkan di sini di masa mendatang.</p>
            <div className="mt-4 p-6 border-2 border-dashed border-border rounded-lg text-center">
              <h3 className="text-lg font-semibold">Segera Hadir</h3>
              <p className="text-muted-foreground mt-1">
                Fitur laporan yang lebih komprehensif sedang dalam pengembangan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
