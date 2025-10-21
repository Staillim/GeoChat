'use client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useMessages } from '@/firebase/firestore/use-messages';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

export default function ChatPage() {
  const params = useParams();
  const slug = params.slug as string[] | undefined;
  const conversationId = slug?.[0];
  const { user } = useUser();
  const firestore = useFirestore();
  const [messageText, setMessageText] = useState('');

  // Obtener la conversación
  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return doc(firestore, 'conversations', conversationId);
  }, [firestore, conversationId]);

  const { data: conversation, isLoading: isConversationLoading } = useDoc(conversationRef);
  
  // Obtener los mensajes
  const { messages, isLoading: isMessagesLoading } = useMessages(conversationId);

  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Selecciona una conversación para empezar a chatear</p>
        </div>
      </div>
    );
  }

  if (isConversationLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex-shrink-0 flex items-center gap-4 border-b bg-card px-4 h-14 lg:h-[60px]">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Conversación no encontrada</p>
          <Link href="/chat">
            <Button variant="outline" className="mt-4">Volver a conversaciones</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Obtener el ID del otro participante
  const otherParticipantId = conversation.participants?.find((p: string) => p !== user?.uid);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    // TODO: Implementar envío de mensajes a Firestore
    console.log('Enviar mensaje:', messageText);
    console.log('A conversación:', conversationId);
    console.log('De usuario:', user?.uid);
    
    setMessageText('');
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 flex items-center gap-4 border-b bg-card px-4 h-14 lg:h-[60px]">
        <Link href="/chat" className="md:hidden">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
            </Button>
        </Link>
        <Avatar>
          <AvatarFallback>{otherParticipantId?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <h2 className="font-semibold text-lg">{otherParticipantId || 'Usuario'}</h2>
      </header>
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
            {isMessagesLoading ? (
              <div className="text-center text-muted-foreground">
                <p>Cargando mensajes...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground">
                <p>No hay mensajes aún</p>
                <p className="text-sm mt-2">Sé el primero en enviar un mensaje</p>
              </div>
            ) : (
              messages.map((message) => {
                const isSender = message.senderId === user?.uid;
                const senderName = isSender ? 'Tú' : (message.senderName || 'Usuario');

                return (
                <div key={message.id} className={cn('flex items-end gap-2', isSender ? 'justify-end' : 'justify-start')}>
                    {!isSender && (
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{senderName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    )}
                    <div
                    className={cn(
                        'max-w-xs rounded-lg p-3 text-sm md:max-w-md',
                        isSender
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card'
                    )}
                    >
                    <p>{message.text}</p>
                    <p className={cn("text-xs mt-1", isSender ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Ahora'}
                    </p>
                    </div>
                    {isSender && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL || ''} />
                        <AvatarFallback>{senderName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    )}
                </div>
                );
            }))}
            </div>
        </ScrollArea>
      </div>
      <footer className="flex-shrink-0 border-t p-4 bg-card">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
          <Input 
            placeholder="Escribe un mensaje..." 
            className="pr-12" 
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" 
            style={{backgroundColor: 'hsl(var(--accent))'}}
            disabled={!messageText.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
