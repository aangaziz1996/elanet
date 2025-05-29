
'use client';

import * as React from 'react';
// import { useParams, useRouter } from 'next/navigation'; // No longer need useParams
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Customer } from '@/types/customer';
import type { User as FirebaseUser } from "firebase/auth";

interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: Date;
}

interface PelangganChatPageProps {
  customerDataFromLayout?: Customer | null;
  firebaseUserFromLayout?: FirebaseUser | null;
}

export default function PelangganChatPage({ customerDataFromLayout, firebaseUserFromLayout }: PelangganChatPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Auth and customer data should be handled by layout.
    // If not present, show loading or error.
    if (firebaseUserFromLayout && customerDataFromLayout) {
        // Mock loading existing messages or starting fresh
        setMessages([
            { id: '1', sender: 'admin', text: `Halo ${customerDataFromLayout.name.split(' ')[0]}! Ada yang bisa kami bantu?`, timestamp: new Date(Date.now() - 60000 * 5) },
        ]);
    }
  }, [firebaseUserFromLayout, customerDataFromLayout]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || isSending) return;
    setIsSending(true);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: newMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Mock admin response
    setTimeout(() => {
      const adminResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'admin',
        text: 'Terima kasih atas pesan Anda. Tim kami akan segera merespons (ini adalah balasan otomatis).',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, adminResponse]);
      setIsSending(false);
    }, 1500);
  };
  
  React.useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
            scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
    }
  }, [messages]);

  if (!firebaseUserFromLayout || !customerDataFromLayout) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Memuat chat...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,10rem)-env(safe-area-inset-bottom))] md:h-[calc(100vh-var(--header-height,6rem)-env(safe-area-inset-bottom))]">
      <h1 className="text-3xl font-bold mb-6">Chat Dukungan</h1>
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Hubungi Tim ELANET
          </CardTitle>
          <CardDescription>
            Sampaikan pertanyaan atau keluhan Anda melalui chat ini.
          </CardDescription>
        </CardHeader>
        <ScrollArea className="flex-1 p-0" ref={scrollAreaRef}>
            <CardContent className="space-y-4 p-4 ">
            {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70'}`}>
                    {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                </div>
            ))}
             {isSending && messages[messages.length-1]?.sender === 'user' && (
                <div className="flex justify-end">
                     <div className="max-w-[70%] p-3 rounded-lg flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                        <span className="text-xs text-muted-foreground">Mengirim...</span>
                    </div>
                </div>
            )}
            </CardContent>
        </ScrollArea>
        <CardFooter className="border-t pt-4">
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Ketik pesan Anda..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              disabled={isSending}
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Kirim</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
        <div className="mt-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 rounded-md text-sm">
            <p className="font-bold">Fitur Chat (Demo)</p>
            <p>Ini adalah simulasi fitur chat. Pesan tidak benar-benar terkirim ke admin atau disimpan di database.</p>
        </div>
    </div>
  );
}
