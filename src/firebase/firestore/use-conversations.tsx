'use client';
import { useCollection } from './use-collection';
import { useFirestore } from '../index';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemoFirebase } from '../index';
import { useMemo } from 'react';

export interface FirestoreConversation {
  participants: string[]; // Array of user IDs
  lastMessage?: string;
  lastMessageTime?: any; // Firestore Timestamp
  unreadCount?: { [userId: string]: number };
  status?: 'pending' | 'active' | 'blocked';
  createdBy?: string;
  updatedAt?: any;
}

/**
 * Hook to get conversations for a specific user
 * Conversations are automatically sorted by last update time
 */
export const useConversations = (userId: string | undefined) => {
  const firestore = useFirestore();
  
  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    const conversationsRef = collection(firestore, 'conversations');
    // Query conversations where user is participant, ordered by update time
    return query(
      conversationsRef, 
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );
  }, [firestore, userId]);

  const { data, isLoading, error } = useCollection<FirestoreConversation>(conversationsQuery);

  // Sort conversations in memory as fallback (in case lastMessageTime is null)
  const sortedConversations = useMemo(() => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      const timeA = a.lastMessageTime?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
      const timeB = b.lastMessageTime?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
      return timeB - timeA; // Most recent first
    });
  }, [data]);

  return {
    conversations: sortedConversations,
    isLoading,
    error
  };
};
