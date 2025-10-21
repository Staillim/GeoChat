'use client';
import Link from 'next/link';
import { getMockConversationById, getMockCurrentUser } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

export default function ChatPage() {
  const params = useParams();
  const slug = params.slug as string[] | undefined;
  const conversationId = slug?.[0];
  const conversation = conversationId ? getMockConversationById(conversationId) : null;
  const currentUser = getMockCurrentUser();

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Selecciona una conversación para empezar a chatear</p>
        </div>
      </div>
    );
  }

  const participantAvatar = PlaceHolderImages.find(p => p.id === conversation.participant.avatar);
  const currentUserAvatar = PlaceHolderImages.find(p => p.id === currentUser.avatar);

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 flex items-center gap-4 border-b bg-card px-4 h-14 lg:h-[60px]">
        <Link href="/chat" className="md:hidden">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
            </Button>
        </Link>
        <Avatar>
          <AvatarImage src={participantAvatar?.imageUrl} alt={conversation.participant.name} />
          <AvatarFallback>{conversation.participant.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="font-semibold text-lg">{conversation.participant.name}</h2>
      </header>
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
            {conversation.messages.map((message) => {
                const isSender = message.senderId === currentUser.id;
                const avatarSrc = isSender ? currentUserAvatar?.imageUrl : participantAvatar?.imageUrl;
                const senderName = isSender ? currentUser.name : conversation.participant.name;

                return (
                <div key={message.id} className={cn('flex items-end gap-2', isSender ? 'justify-end' : 'justify-start')}>
                    {!isSender && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarSrc} alt={senderName} />
                        <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
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
                    <p className={cn("text-xs mt-1", isSender ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{message.timestamp}</p>
                    </div>
                    {isSender && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarSrc} alt={senderName} />
                        <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    )}
                </div>
                );
            })}
            </div>
        </ScrollArea>
      </div>
      <footer className="flex-shrink-0 border-t p-4 bg-card">
        <div className="relative">
          <Input placeholder="Escribe un mensaje..." className="pr-12" />
          <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" style={{backgroundColor: 'hsl(var(--accent))'}}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}
