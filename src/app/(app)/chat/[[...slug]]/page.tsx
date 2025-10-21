'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useMessages } from '@/firebase/firestore/use-messages';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useMarkAsRead } from '@/firebase/firestore/use-mark-as-read';
import { useMarkMessagesRead } from '@/firebase/firestore/use-mark-messages-read';
import { doc } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { CheckCheck } from 'lucide-react';

export default function ChatPage() {
  const params = useParams();
  const slug = params.slug as string[] | undefined;
  const conversationId = slug?.[0];
  const { user } = useUser();
  const firestore = useFirestore();
  const { markAsRead } = useMarkAsRead();
  const { markMessagesRead } = useMarkMessagesRead();
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
        // Marcar el contador de conversación como leído
        markAsRead(conversationId, user.uid);
      }
    }
  }, [conversationId, user?.uid, conversation, markAsRead]);

  // Marcar mensajes individuales como leídos cuando hay mensajes
  useEffect(() => {
    if (conversationId && user?.uid && messages && messages.length > 0) {
      // Marcar todos los mensajes del otro usuario como leídos
      markMessagesRead(conversationId, user.uid);
    }
  }, [conversationId, user?.uid, messages, markMessagesRead]);

  if (!conversationId) {
    return null;
  }

  if (isConversationLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando conversación...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Conversación no encontrada</p>
      </div>
    );
  }

  return (
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
                        "text-xs mt-1 relative z-10 flex items-center gap-1.5",
                        isSender ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'
                      )}>
                        <span>{message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Ahora'}</span>
                        {/* Indicadores de lectura tipo WhatsApp - solo para mensajes enviados */}
                        {isSender && (
                          <span className="flex items-center">
                            {message.read ? (
                              // Doble check azul cuando está leído
                              <CheckCheck className={cn(
                                "h-3.5 w-3.5 transition-colors duration-300",
                                "text-blue-400 dark:text-blue-500"
                              )} />
                            ) : (
                              // Doble check gris cuando está enviado pero no leído
                              <CheckCheck className={cn(
                                "h-3.5 w-3.5",
                                "text-primary-foreground/50"
                              )} />
                            )}
                          </span>
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
  );
}
