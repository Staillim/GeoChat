'use client';
import Link from 'next/link';
import { getMockConversations } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

function ConversationList() {
    const params = useParams();
    const conversations = getMockConversations();
    const activeConversationId = params.slug?.[0] ? `conv-${params.slug[0].split('-')[1]}` : null;

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-4 pt-0">
            {conversations.map((conv) => {
                const avatar = PlaceHolderImages.find(p => p.id === conv.participant.avatar)
                const isActive = activeConversationId === conv.id;
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
                            <AvatarImage src={avatar?.imageUrl} alt={conv.participant.name} />
                            <AvatarFallback>{conv.participant.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="font-semibold">{conv.participant.name}</div>
                            <p className="text-xs text-muted-foreground truncate">
                                {conv.messages[conv.messages.length - 1].text}
                            </p>
                        </div>
                        {conv.unreadCount > 0 && <Badge>{conv.unreadCount}</Badge>}
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
    <div className="grid h-full w-full md:grid-cols-[280px_1fr]">
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
    </div>
  )
}
