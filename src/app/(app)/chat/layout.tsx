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
                // TODO: Obtener información del otro participante
                const participantId = conv.participants.find(p => p !== user?.uid);
                
                return (
                <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    className={cn(
                        "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                        isActive && "bg-accent"
                    )}
                    >
                    <div className="flex w-full items-center gap-3">
                        <Avatar>
                            <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="font-semibold">{participantId}</div>
                            <p className="text-xs text-muted-foreground truncate">
                                {conv.lastMessage || 'Sin mensajes'}
                            </p>
                        </div>
                        {conv.unreadCount && conv.unreadCount[user?.uid || ''] > 0 && (
                            <Badge>{conv.unreadCount[user?.uid || '']}</Badge>
                        )}
                    </div>
                </Link>
            )})}
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
            <ConversationList/>
        </div>
      </div>
      <div className={cn("flex-col", slug && slug.length > 0 ? "flex" : "hidden md:flex")}>
        {children}
      </div>
      
      {/* Floating Action Button for searching users */}
      <SearchUserFab />
    </div>
  )
}
