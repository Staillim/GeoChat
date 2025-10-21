'use client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useSendMessage } from '@/firebase/firestore/use-send-message';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

export default function ChatIndividualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = params.slug as string[] | undefined;
  const conversationId = slug?.[0];
  const { user } = useUser();
  const firestore = useFirestore();
  const [messageText, setMessageText] = useState('');
  const { sendMessage, loading: isSending } = useSendMessage();

  // Obtener la conversación
  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return doc(firestore, 'conversations', conversationId);
  }, [firestore, conversationId]);

  const { data: conversation, isLoading: isConversationLoading } = useDoc(conversationRef);

  // Obtener el ID del otro participante
  const otherParticipantId = conversation?.participants?.find((p: string) => p !== user?.uid);

  // Obtener los datos del otro participante
  const otherParticipantRef = useMemoFirebase(() => {
    if (!firestore || !otherParticipantId) return null;
    return doc(firestore, 'users', otherParticipantId);
  }, [firestore, otherParticipantId]);

  const { data: otherParticipant } = useDoc(otherParticipantRef);

  const otherUserDisplayName = otherParticipant?.displayName || otherParticipant?.email?.split('@')[0] || 'Usuario';
  const otherUserPhotoURL = otherParticipant?.photoURL || null;
  const otherUserInitials = otherUserDisplayName.charAt(0).toUpperCase();

  // Estados de la conversación
  const isPending = conversation?.status === 'pending';
  const isActive = conversation?.status === 'active';
  const isCreator = conversation?.createdBy === user?.uid;
  const canSendMessages = isActive;

  const handleSendMessage = async () => {
    if (!messageText.trim() || !canSendMessages || !user || !conversationId) return;
    
    const success = await sendMessage(conversationId, user.uid, messageText);
    
    if (success) {
      setMessageText('');
    }
  };

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

  return (
    <div className="flex flex-col h-full">
      {/* HEADER FIJO - Completamente fuera del scroll */}
      <header className="flex-shrink-0 flex items-center gap-4 border-b bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-md px-4 h-14 lg:h-[60px] relative overflow-hidden group">
        {/* Orbe decorativo de fondo */}
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <Link href="/chat" className="md:hidden relative z-10">
          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:scale-110 transition-all duration-300 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="relative z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Avatar className="relative ring-2 ring-background shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
            <AvatarImage src={otherUserPhotoURL || ''} alt={otherUserDisplayName} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
              {otherUserInitials}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 relative z-10">
          <h2 className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{otherUserDisplayName}</h2>
          {isPending && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
              {isCreator ? 'Solicitud enviada' : 'Solicitud pendiente'}
            </p>
          )}
        </div>
      </header>

      {/* Mensaje de estado pendiente */}
      {isPending && (
        <div className="flex-shrink-0 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-200 dark:border-amber-800 p-4 relative overflow-hidden">
          {/* Orbe animado */}
          <div className="absolute -left-4 top-0 w-16 h-16 bg-amber-400/20 rounded-full blur-2xl animate-pulse" />
          <p className="text-sm text-amber-900 dark:text-amber-200 text-center font-medium relative z-10 flex items-center justify-center gap-2">
            <span className="text-xl">{isCreator ? '⏳' : '📩'}</span>
            {isCreator 
              ? 'Esperando que el usuario acepte tu solicitud de chat...'
              : 'Este usuario quiere chatear contigo. Acepta la solicitud arriba para comenzar.'
            }
          </p>
        </div>
      )}

      {/* ÁREA DE MENSAJES CON SCROLL - Esta es la única parte con scroll */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>

      {/* FOOTER FIJO - Completamente fuera del scroll */}
      <footer className="flex-shrink-0 border-t p-4 bg-card/80 backdrop-blur-md">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative group">
          <Input 
            placeholder={canSendMessages ? "Escribe un mensaje..." : "Acepta la solicitud para enviar mensajes"}
            className="pr-12 rounded-full border-2 focus:border-primary transition-all duration-300 bg-background/50 backdrop-blur-sm hover:bg-background/80" 
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={!canSendMessages || isSending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full transition-all duration-300",
              "bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90",
              "shadow-lg hover:shadow-xl hover:scale-110 hover:rotate-12",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0"
            )}
            disabled={!messageText.trim() || !canSendMessages || isSending}
          >
            <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
