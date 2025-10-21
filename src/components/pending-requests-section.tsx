"use client";

import { useChatRequests } from '@/firebase/firestore/use-chat-requests';
import { useAcceptChatRequest } from '@/firebase/firestore/use-accept-chat-request';
import { useRejectChatRequest } from '@/firebase/firestore/use-reject-chat-request';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useMemo, useState } from 'react';

const { firestore } = initializeFirebase();

interface RequestItemProps {
  request: {
    id: string;
    fromUserId: string;
    conversationId: string;
  };
}

function RequestItem({ request }: RequestItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { acceptRequest } = useAcceptChatRequest();
  const { rejectRequest } = useRejectChatRequest();

  // Obtener datos del usuario que envió la solicitud
  const fromUserDocRef = useMemo(() => {
    if (!request.fromUserId) return null;
    return doc(firestore, 'users', request.fromUserId);
  }, [request.fromUserId]);

  const { data: fromUser } = useDoc(fromUserDocRef);

  const displayName = fromUser?.displayName || fromUser?.email?.split('@')[0] || 'Usuario';
  const photoURL = fromUser?.photoURL || null;
  const initials = displayName.charAt(0).toUpperCase();

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const success = await acceptRequest(request.id, request.conversationId);
      if (success) {
        console.log('✅ Solicitud aceptada');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const success = await rejectRequest(request.id);
      if (success) {
        console.log('✅ Solicitud rechazada');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={photoURL || ''} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-sm">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              Quiere chatear contigo
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700"
              onClick={handleAccept}
              disabled={isProcessing}
              title="Aceptar solicitud"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700"
              onClick={handleReject}
              disabled={isProcessing}
              title="Rechazar solicitud"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Component that displays pending chat requests.
 * Shows a list of users who want to chat with the current user.
 */
export function PendingRequestsSection() {
  const { user } = useUser();
  const { requests, isLoading } = useChatRequests(user?.uid);

  if (isLoading || !requests || requests.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-muted/50 p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        Solicitudes Pendientes
        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
          {requests.length}
        </span>
      </h3>
      <div className="space-y-2">
        {requests.map((request) => (
          <RequestItem key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}
