'use client';
import { useCollection } from './use-collection';
import { useFirestore } from '../index';
import { collection, query, orderBy } from 'firebase/firestore';
import { useMemoFirebase } from '../index';

export interface FirestoreMessage {
  text: string;
  senderId: string;
  timestamp: any; // Firestore Timestamp
  senderName?: string;
}

/**
 * Hook to get messages for a specific conversation
 */
export const useMessages = (conversationId: string | undefined) => {
  const firestore = useFirestore();
  
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
    return query(messagesRef, orderBy('timestamp', 'asc'));
  }, [firestore, conversationId]);

  const { data, isLoading, error } = useCollection<FirestoreMessage>(messagesQuery);

  return {
    messages: data || [],
    isLoading,
    error
  };
};
