'use client';
import { useCollection } from './use-collection';
import { useFirestore } from '../index';
import { collection, query, where } from 'firebase/firestore';
import { useMemoFirebase } from '../index';

export interface FirestoreConversation {
  participants: string[]; // Array of user IDs
  lastMessage?: string;
  lastMessageTime?: any; // Firestore Timestamp
  unreadCount?: { [userId: string]: number };
}

/**
 * Hook to get conversations for a specific user
 */
export const useConversations = (userId: string | undefined) => {
  const firestore = useFirestore();
  
  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    const conversationsRef = collection(firestore, 'conversations');
    return query(conversationsRef, where('participants', 'array-contains', userId));
  }, [firestore, userId]);

  const { data, isLoading, error } = useCollection<FirestoreConversation>(conversationsQuery);

  return {
    conversations: data || [],
    isLoading,
    error
  };
};
