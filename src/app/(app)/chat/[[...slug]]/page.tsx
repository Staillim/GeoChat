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
import { useSendMessage } from '@/firebase/firestore/use-send-message';
import { useMarkAsRead } from '@/firebase/firestore/use-mark-as-read';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useRef } from 'react';

export default function ChatPage() {
  const params = useParams();
  const slug = params.slug as string[] | undefined;
  const conversationId = slug?.[0];
  const { user } = useUser();
  const firestore = useFirestore();
  const [messageText, setMessageText] = useState('');
  const { sendMessage, loading: isSending } = useSendMessage();
  const { markAsRead } = useMarkAsRead();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);

  // Obtener la conversación
  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return doc(firestore, 'conversations', conversationId);
  }, [firestore, conversationId]);

  const { data: conversation, isLoading: isConversationLoading } = useDoc(conversationRef);
  
  // Obtener los mensajes
  const { messages, isLoading: isMessagesLoading } = useMessages(conversationId);

  // Auto-scroll mejorado - detecta mensajes nuevos
  useEffect(() => {
    if (messages && messages.length > 0) {
      const isNewMessage = messages.length > previousMessageCountRef.current;
      previousMessageCountRef.current = messages.length;

      if (isNewMessage) {
        // Usar setTimeout para asegurar que el DOM se actualice
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      }
    }
  }, [messages]);

  // Scroll inicial cuando se cargan los mensajes por primera vez
  useEffect(() => {
    if (!isMessagesLoading && messages && messages.length > 0 && previousMessageCountRef.current === 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
      }, 100);
    }
  }, [isMessagesLoading, messages]);

  // Marcar mensajes como leídos cuando se abre el chat
  useEffect(() => {
    if (conversationId && user?.uid && conversation) {
      const unreadCount = conversation.unreadCount?.[user.uid] || 0;
      if (unreadCount > 0) {
        markAsRead(conversationId, user.uid);
      }
    }
  }, [conversationId, user?.uid, conversation, markAsRead]);

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

  const handleSendMessage = async () => {
    if (!messageText.trim() || !canSendMessages || !user || !conversationId) return;
    
    const success = await sendMessage(conversationId, user.uid, messageText);
    
    if (success) {
      setMessageText('');
    }
  };

  return (
    <div className="flex flex-col h-full">
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
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-200 dark:border-amber-800 p-4 relative overflow-hidden">
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

      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
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
              <>
                {messages.map((message, index) => {
                  const isSender = message.senderId === user?.uid;
                  const senderName = isSender ? 'Tú' : (message.senderName || 'Usuario');
                  const isLastMessage = index === messages.length - 1;

                  return (
                  <div 
                    key={message.id} 
                    className={cn(
                      'flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 group',
                      isSender ? 'justify-end' : 'justify-start'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                      {!isSender && (
                      <Avatar className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 ring-2 ring-background shadow-md">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                            {senderName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                      </Avatar>
                      )}
                      <div
                      className={cn(
                          'max-w-xs rounded-2xl p-3 text-sm md:max-w-md relative overflow-hidden group/message',
                          'transition-all duration-300 hover:scale-[1.02]',
                          isSender
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40'
                          : 'bg-gradient-to-br from-card to-card/90 border border-border/50 shadow-md hover:shadow-lg backdrop-blur-sm',
                          isLastMessage && !isSender && 'ring-2 ring-accent/30 animate-pulse'
                      )}
                      >
                      {/* Shimmer effect para mensajes */}
                      <div className="absolute inset-0 opacity-0 group-hover/message:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer-effect" />
                      </div>
                      
                      {/* Orbe flotante en hover */}
                      <div className="absolute -top-2 -right-2 w-12 h-12 bg-white/20 rounded-full blur-xl opacity-0 group-hover/message:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      
                      <p className="break-words relative z-10 leading-relaxed">{message.text}</p>
                      <p className={cn(
                        "text-xs mt-1 relative z-10 flex items-center gap-1",
                        isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}>
                        <span>{message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Ahora'}</span>
                        {isLastMessage && isSender && (
                          <span className="inline-block w-1 h-1 rounded-full bg-current animate-pulse" />
                        )}
                      </p>
                      </div>
                      {isSender && (
                      <Avatar className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 ring-2 ring-background shadow-md">
                          <AvatarImage src={user?.photoURL || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-accent to-accent/90 text-white font-semibold">
                            {senderName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                      </Avatar>
                      )}
                  </div>
                  );
                })}
                {/* Elemento invisible para auto-scroll */}
                <div ref={messagesEndRef} />
              </>
            )}
            </div>
        </ScrollArea>
      </div>
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
