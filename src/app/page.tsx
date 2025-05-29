
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Wifi, Users, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center space-y-8">
        <div className="inline-block p-4 bg-primary/10 rounded-full">
          <Wifi className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Selamat Datang di ELANET Admin
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Sistem Pembukuan dan Laporan Pelanggan WiFi.
        </p>
        <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto">
          <Button asChild size="lg" className="w-full">
            <Link href="/admin/dashboard">
              <Users className="mr-2 h-5 w-5" />
              Dashboard Admin
            </Link>
          </Button>
           <Button variant="outline" size="lg" asChild className="w-full">
            <Link href="/login/admin">
              <ShieldCheck className="mr-2 h-5 w-5" />
              Login Admin
            </Link>
          </Button>
        </div>
      </div>
      <footer className="absolute bottom-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} ELANET. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
}
