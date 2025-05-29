'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function PengaturanPage() {
  return (
    <div className="container mx-auto py-8">
      {/* Title is handled by AdminLayout */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Pengaturan Umum
            </CardTitle>
            <CardDescription>
              Kelola pengaturan dasar aplikasi ELANET Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="appName">Nama Aplikasi</Label>
              <Input id="appName" defaultValue="ELANET Customer Management" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Nama Perusahaan</Label>
              <Input id="companyName" defaultValue="ELANET WiFi Provider" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="dark-mode" />
              <Label htmlFor="dark-mode">Mode Gelap (Segera Hadir)</Label>
            </div>
             <div className="flex items-center space-x-2">
              <Switch id="notifications-enabled" disabled />
              <Label htmlFor="notifications-enabled">Aktifkan Notifikasi Email (Segera Hadir)</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button disabled>Simpan Perubahan (Segera Hadir)</Button>
          </CardFooter>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Pengaturan Paket WiFi</CardTitle>
            <CardDescription>
              Kelola daftar paket WiFi yang ditawarkan. Fitur ini akan dikembangkan.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
                <h3 className="text-xl font-semibold">Segera Hadir</h3>
                <p className="text-muted-foreground mt-2">
                Manajemen paket WiFi akan tersedia di sini.
                </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
