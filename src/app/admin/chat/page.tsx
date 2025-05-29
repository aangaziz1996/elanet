'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="container mx-auto py-8">
      {/* Title is handled by AdminLayout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Chat Pelanggan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Fitur chat dengan pelanggan akan tersedia di halaman ini.
          </p>
           <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <h3 className="text-xl font-semibold">Segera Hadir</h3>
            <p className="text-muted-foreground mt-2">
              Kami sedang mengembangkan fitur chat untuk interaksi yang lebih baik dengan pelanggan Anda.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
