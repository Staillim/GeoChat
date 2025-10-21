'use client';
import { useState } from 'react';
import { collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '../index';

/**
 * Hook to mark all unread messages in a conversation as read
 */
export const useMarkMessagesRead = () => {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);

  const markMessagesRead = async (conversationId: string, userId: string) => {
    if (!firestore || !conversationId || !userId) {
      console.error('Missing required parameters for markMessagesRead');
      return false;
    }

    setLoading(true);
    try {
      // Obtener todos los mensajes no leídos (sin filtro de senderId para evitar índice compuesto)
      const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
      const q = query(
        messagesRef,
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      
      // Filtrar en memoria los mensajes que NO fueron enviados por el usuario actual
      const unreadMessagesFromOthers = snapshot.docs.filter(
        (doc) => doc.data().senderId !== userId
      );

      if (unreadMessagesFromOthers.length === 0) {
        // No hay mensajes para marcar como leídos
        return true;
      }

      // Usar batch para actualizar múltiples documentos de manera eficiente
      const batch = writeBatch(firestore);
      
      unreadMessagesFromOthers.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });

      await batch.commit();
      console.log(`✅ Marked ${unreadMessagesFromOthers.length} messages as read`);
      
      return true;
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { markMessagesRead, loading };
};
