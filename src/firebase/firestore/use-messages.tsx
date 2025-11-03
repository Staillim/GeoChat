'use client';
import { useCollection } from './use-collection';
import { useFirestore } from '../index';
import { collection, query, orderBy } from 'firebase/firestore';
import { useMemoFirebase } from '../index';
import { useEffect, useRef } from 'react';
import { showNotification, NotificationTypes } from '@/hooks/use-notifications';

export interface FirestoreMessage {
  text: string;
  senderId: string;
  timestamp: any; // Firestore Timestamp
  senderName?: string;
  senderPhotoURL?: string | null; // Foto del remitente (puede ser null)
  read?: boolean; // Estado de lectura
  readAt?: any; // Timestamp de lectura
  type?: 'text' | 'image' | 'location'; // Tipo de mensaje
  imageBase64?: string; // Imagen en Base64
  location?: {
    latitude: number;
    longitude: number;
    timestamp: number;
    duration?: number; // Duración en minutos
  }; // Ubicación compartida
}

/**
 * Hook to get messages for a specific conversation
 */
export const useMessages = (conversationId: string | undefined, currentUserId?: string) => {
  const firestore = useFirestore();
  const previousMessageCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
    return query(messagesRef, orderBy('timestamp', 'asc'));
  }, [firestore, conversationId]);

  const { data, isLoading, error } = useCollection<FirestoreMessage>(messagesQuery);

  // Resetear cuando cambia la conversación
  useEffect(() => {
    console.log('🔄 useMessages - Conversación cambió:', conversationId);
    previousMessageCountRef.current = 0;
    isInitialLoadRef.current = true;
  }, [conversationId]);

  // Detectar nuevos mensajes y mostrar notificación
  useEffect(() => {
    console.log('📨 useMessages - Efecto ejecutado:', {
      dataLength: data?.length,
      previousCount: previousMessageCountRef.current,
      isInitialLoad: isInitialLoadRef.current,
      currentUserId,
      conversationId
    });
    
    if (data && data.length > 0 && currentUserId) {
      // En la carga inicial, solo guardamos el contador sin notificar
      if (isInitialLoadRef.current) {
        console.log('📥 useMessages - Carga inicial, guardando', data.length, 'mensajes');
        previousMessageCountRef.current = data.length;
        isInitialLoadRef.current = false;
        return;
      }
      
      // Solo notificar si hay más mensajes que antes
      if (data.length > previousMessageCountRef.current) {
        const newMessages = data.slice(previousMessageCountRef.current);
        console.log('🆕 useMessages - Nuevos mensajes detectados:', newMessages.length);
        
        // Solo notificar mensajes que NO son del usuario actual
        newMessages.forEach((message) => {
          console.log('📝 useMessages - Procesando mensaje de:', message.senderId, 'currentUser:', currentUserId);
          
          if (message.senderId !== currentUserId) {
            console.log('✅ useMessages - Mensaje de otro usuario, enviando notificación');
            
            // Notificar siempre (sin importar si la ventana está visible o no)
            // El usuario puede estar en otra conversación
            if (message.type === 'image') {
              const notifData = NotificationTypes.newImage(message.senderName || 'Un usuario');
              showNotification(notifData.title, {
                body: notifData.body,
                tag: notifData.tag,
                requireInteraction: notifData.requireInteraction,
              });
            } else if (message.type === 'location') {
              const notifData = NotificationTypes.newLocation(message.senderName || 'Un usuario');
              showNotification(notifData.title, {
                body: notifData.body,
                tag: notifData.tag,
                requireInteraction: notifData.requireInteraction,
              });
            } else {
              const preview = message.text.length > 50 
                ? message.text.substring(0, 50) + '...' 
                : message.text;
              const notifData = NotificationTypes.newMessage(message.senderName || 'Un usuario', preview);
              showNotification(notifData.title, {
                body: notifData.body,
                tag: notifData.tag,
                requireInteraction: notifData.requireInteraction,
              });
            }
            
            console.log('🔔 Notificación enviada:', message.type, 'de', message.senderName);
          } else {
            console.log('⏭️ useMessages - Mensaje propio, no notificar');
          }
        });
      }
      
      previousMessageCountRef.current = data.length;
    }
  }, [data, currentUserId, conversationId]);

  return {
    messages: data || [],
    isLoading,
    error
  };
};
