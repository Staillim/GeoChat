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

    return (
        <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                isActive && "bg-accent",
                isPending && "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
            )}
        >
            <div className="flex w-full items-center gap-3">
                <Avatar>
                    <AvatarImage src={photoURL || ''} alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                        <span className="truncate">{displayName}</span>
                        {isPending && (
                            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800">
                                {isCreator ? 'Pendiente' : 'Nueva'}
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                        {isPending 
                            ? (isCreator ? 'Esperando aceptación...' : '¡Nueva solicitud de chat!')
                            : (conv.lastMessage || 'Sin mensajes')
                        }
                    </p>
                </div>
                {!isPending && conv.unreadCount && conv.unreadCount[currentUserId] > 0 && (
                    <Badge>{conv.unreadCount[currentUserId]}</Badge>
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
