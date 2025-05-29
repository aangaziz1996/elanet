import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Wifi } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center space-y-6">
        <div className="inline-block p-4 bg-primary/10 rounded-full">
          <Wifi className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">
          Selamat Datang di ELANET
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Sistem Manajemen Pelanggan dan Pembayaran WiFi.
        </p>
        <div className="space-x-4">
          <Button asChild size="lg">
            <Link href="/admin/pelanggan">Masuk ke Dashboard Admin</Link>
          </Button>
          {/* Nanti bisa ditambahkan link untuk login pelanggan */}
          {/* <Button variant="outline" size="lg" asChild>
            <Link href="/login/pelanggan">Login Pelanggan</Link>
          </Button> */}
        </div>
      </div>
      <footer className="absolute bottom-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} ELANET. All rights reserved.
      </footer>
    </div>
  );
}
