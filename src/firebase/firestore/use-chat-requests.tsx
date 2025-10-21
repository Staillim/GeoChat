"use client";

import { useCollection } from './use-collection';
import { useFirestore, useMemoFirebase } from '../index';
import { collection, query, where } from 'firebase/firestore';

export interface ChatRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  conversationId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  respondedAt?: any;
}

/**
 * Hook to get pending chat requests for a user (requests received)
 */
export const useChatRequests = (userId: string | undefined) => {
  const firestore = useFirestore();
  
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    const requestsRef = collection(firestore, 'chatRequests');
    return query(
      requestsRef, 
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    );
  }, [firestore, userId]);

  const { data, isLoading, error } = useCollection<ChatRequest>(requestsQuery);

  return {
    requests: data || [],
    isLoading,
    error
  };
};
