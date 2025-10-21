'use client';
import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '../index';

/**
 * Hook to mark messages as read in a conversation
 */
export const useMarkAsRead = () => {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);

  const markAsRead = async (conversationId: string, userId: string) => {
    if (!firestore || !conversationId || !userId) {
      console.error('Missing required parameters for markAsRead');
      return false;
    }

    setLoading(true);
    try {
      const conversationRef = doc(firestore, 'conversations', conversationId);
      
      // Resetear el contador de no leídos para este usuario
      await updateDoc(conversationRef, {
        [`unreadCount.${userId}`]: 0,
        [`lastReadAt.${userId}`]: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { markAsRead, loading };
};
