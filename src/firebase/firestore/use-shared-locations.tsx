"use client";

import { useState, useEffect } from 'react';
import { useFirestore } from '../index';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface SharedLocation {
  userId: string;
  userName: string;
  userPhoto: string | null;
  latitude: number;
  longitude: number;
  timestamp: number;
  conversationId: string;
}

/**
 * Hook para obtener las últimas ubicaciones compartidas en las conversaciones del usuario
 */
export function useSharedLocations(userId: string | undefined) {
  const firestore = useFirestore();
  const [locations, setLocations] = useState<SharedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !userId) {
      setIsLoading(false);
      return;
    }

    const fetchSharedLocations = async () => {
      try {
        setIsLoading(true);
        
        // 1. Obtener todas las conversaciones del usuario
        const conversationsRef = collection(firestore, 'conversations');
        const conversationsQuery = query(
          conversationsRef,
          where('participants', 'array-contains', userId),
          where('status', '==', 'active')
        );
        const conversationsSnapshot = await getDocs(conversationsQuery);
        
        const sharedLocations: SharedLocation[] = [];

        // 2. Para cada conversación, buscar mensajes de tipo ubicación
        for (const conversationDoc of conversationsSnapshot.docs) {
          const conversationData = conversationDoc.data();
          const participants = conversationData.participants || [];
          
          // Buscar en los mensajes de esta conversación - SIN orderBy para evitar índice
          const messagesRef = collection(firestore, 'conversations', conversationDoc.id, 'messages');
          const messagesQuery = query(
            messagesRef,
            where('type', '==', 'location')
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          
          // Agrupar por senderId y tomar el más reciente de cada uno (ordenar manualmente)
          const locationsBySender = new Map<string, any>();
          
          // Convertir a array y ordenar manualmente por timestamp
          const messagesArray = messagesSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a: any, b: any) => {
              // Ordenar descendente (más reciente primero)
              const timestampA = a.timestamp?.toMillis?.() || 0;
              const timestampB = b.timestamp?.toMillis?.() || 0;
              return timestampB - timestampA;
            });
          
          messagesArray.forEach((messageData: any) => {
            const senderId = messageData.senderId;
            
            // Solo agregar si es de otro usuario (no del usuario actual)
            // y si no tenemos una ubicación de este remitente (ya está ordenado, el primero es el más reciente)
            if (senderId !== userId && !locationsBySender.has(senderId)) {
              locationsBySender.set(senderId, {
                ...messageData,
                conversationId: conversationDoc.id
              });
            }
          });
          
          // Agregar las ubicaciones encontradas
          locationsBySender.forEach((messageData) => {
            if (messageData.location) {
              sharedLocations.push({
                userId: messageData.senderId,
                userName: messageData.senderName || 'Usuario',
                userPhoto: messageData.senderPhotoURL || null, // Obtener la foto del mensaje
                latitude: messageData.location.latitude,
                longitude: messageData.location.longitude,
                timestamp: messageData.location.timestamp,
                conversationId: messageData.conversationId,
              });
            }
          });
        }
        
        setLocations(sharedLocations);
      } catch (error) {
        console.error('Error fetching shared locations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedLocations();
  }, [firestore, userId]);

  return {
    locations,
    isLoading,
  };
}
