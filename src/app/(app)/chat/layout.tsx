'use client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useConversations } from '@/firebase/firestore/use-conversations';
import { useUser } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchUserFab } from '@/components/search-user-fab';
import { PendingRequestsSection } from '@/components/pending-requests-section';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useMemo } from 'react';

const { firestore } = initializeFirebase();

interface ConversationItemProps {
    conv: any;
    isActive: boolean;
    currentUserId: string;
}

function ConversationItem({ conv, isActive, currentUserId }: ConversationItemProps) {
    const participantId = conv.participants.find((p: string) => p !== currentUserId);
    
    const participantDocRef = useMemo(() => {
        if (!participantId) return null;
        return doc(firestore, 'users', participantId);
    }, [participantId]);

    const { data: participantData } = useDoc(participantDocRef);

    const displayName = participantData?.displayName || participantData?.email?.split('@')[0] || 'Usuario';
    const photoURL = participantData?.photoURL || null;
    const initials = displayName.charAt(0).toUpperCase();

    // Estados de la conversación
    const isPending = conv.status === 'pending';
    const isCreator = conv.createdBy === currentUserId;
    const unreadCount = conv.unreadCount?.[currentUserId] || 0;
    const hasUnread = unreadCount > 0;

    return (
        <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent relative group",
                "animate-in fade-in slide-in-from-left-2 duration-300",
                isActive && "bg-accent",
                isPending && "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20",
                hasUnread && !isActive && "border-primary/50 bg-primary/5"
            )}
        >
            {/* Indicador de mensajes no leídos */}
            {hasUnread && !isActive && (
                <div className="absolute top-2 right-2 animate-in zoom-in duration-200">
                    <div className="relative">
                        <Badge variant="destructive" className="h-5 min-w-[20px] px-1 flex items-center justify-center text-xs animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    </div>
                </div>
            )}
            <div className="flex w-full items-center gap-3">
                <div className="relative">
                    <Avatar className="transition-transform group-hover:scale-110">
                        <AvatarImage src={photoURL || ''} alt={displayName} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    {/* Indicador de punto rojo con animación */}
                    {hasUnread && !isActive && (
                        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                        <span className="truncate">{displayName}</span>
                        {isPending && (
                            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800">
                                {isCreator ? 'Pendiente' : 'Nueva'}
                            </Badge>
                        )}
                    </div>
                    <p className={cn(
                        "text-xs truncate",
                        hasUnread && !isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                    )}>
                        {isPending 
                            ? (isCreator ? 'Esperando aceptación...' : '¡Nueva solicitud de chat!')
                            : (conv.lastMessage || 'Sin mensajes')
                        }
                    </p>
                </div>
                {!isPending && hasUnread && !isActive && (
                    <div className="flex-shrink-0">
                        {/* Badge ya está en la esquina superior derecha */}
                    </div>
                )}
            </div>
        </Link>
    );
}

function ConversationList() {
    const params = useParams();
    const { user } = useUser();
    const { conversations, isLoading } = useConversations(user?.uid);
    const activeConversationId = params.slug?.[0];

    if (isLoading) {
        return (
            <ScrollArea className="h-full">
                <div className="flex flex-col gap-2 p-4 pt-0">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        );
    }

    if (!conversations || conversations.length === 0) {
        return (
            <div className="flex h-full items-center justify-center p-4">
                <div className="text-center text-muted-foreground">
                    <p>No tienes conversaciones aún</p>
                    <p className="text-sm mt-2">Ve al mapa para conectar con otros usuarios</p>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-4 pt-0">
            {conversations.map((conv) => {
                const isActive = activeConversationId === conv.id;
                
                return (
                    <ConversationItem 
                        key={conv.id}
                        conv={conv}
                        isActive={isActive}
                        currentUserId={user?.uid || ''}
                    />
                );
            })}
            </div>
      </ScrollArea>
    )
}


export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams();
  const slug = params.slug as string[] | undefined;

  return (
    <div className="grid h-full w-full md:grid-cols-[280px_1fr] relative">
      <div className={cn("border-r bg-card", slug && slug.length > 0 ? "hidden md:block" : "block")}>
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <h2 className="font-semibold text-lg">Conversaciones</h2>
            </div>
            {/* Sección de solicitudes pendientes */}
            <PendingRequestsSection />
            <ConversationList/>
        </div>
      </div>
      <div className={cn("flex-col", slug && slug.length > 0 ? "flex" : "hidden md:flex")}>
        {children}
      </div>
      
      {/* Floating Action Button for searching users - only show when not in a chat */}
      {(!slug || slug.length === 0) && <SearchUserFab />}
    </div>
  )
}
