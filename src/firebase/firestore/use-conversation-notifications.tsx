"use client";

import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '../index';
import { showNotification, NotificationTypes } from '@/hooks/use-notifications';

interface ConversationData {
  participants: string[];
  lastMessage: string;
  lastMessageSenderId?: string;
  lastMessageTime: any;
  pendingFor?: { [userId: string]: boolean };
  unreadCount?: { [userId: string]: number };
}

/**
 * Hook para escuchar notificaciones de conversaciones basadas en el estado "pendiente"
 * Se activa cuando otra persona te envía un mensaje (pendingFor[userId] = true)
 */
export function useConversationNotifications(currentUserId: string | undefined) {
  const firestore = useFirestore();
  const processedNotificationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!firestore || !currentUserId) {
      console.log('🔕 No se puede escuchar notificaciones: firestore o userId no disponible');
      return;
    }

    console.log('👂 Iniciando listener de notificaciones para usuario:', currentUserId);

    // Escuchar conversaciones donde el usuario participa Y tiene mensajes pendientes
    const conversationsRef = collection(firestore, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUserId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📬 Snapshot de conversaciones recibido:', snapshot.size, 'conversaciones');
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const conversationData = change.doc.data() as ConversationData;
          const conversationId = change.doc.id;
          
          console.log('🔄 Conversación modificada:', conversationId, {
            lastMessageSenderId: conversationData.lastMessageSenderId,
            currentUserId,
            pendingFor: conversationData.pendingFor?.[currentUserId],
            unreadCount: conversationData.unreadCount?.[currentUserId]
          });
          
          // Verificar si el usuario tiene mensajes pendientes (no respondidos)
          const isPendingForUser = conversationData.pendingFor?.[currentUserId] === true;
          const lastMessageFromOther = conversationData.lastMessageSenderId !== currentUserId;
          const hasUnreadMessages = (conversationData.unreadCount?.[currentUserId] || 0) > 0;
          
          // Crear una clave única para esta notificación
          const notificationKey = `${conversationId}-${conversationData.lastMessageTime?.seconds || Date.now()}`;
          
          console.log('🔍 Evaluando notificación:', {
            conversationId,
            isPendingForUser,
            lastMessageFromOther,
            hasUnreadMessages,
            notificationKey,
            alreadyProcessed: processedNotificationsRef.current.has(notificationKey)
          });
          
          // Solo notificar si:
          // 1. El estado está pendiente para este usuario
          // 2. El último mensaje NO es del usuario actual
          // 3. Hay mensajes sin leer
          // 4. No hemos notificado ya este mensaje
          if (isPendingForUser && lastMessageFromOther && hasUnreadMessages && !processedNotificationsRef.current.has(notificationKey)) {
            // Marcar como procesada
            processedNotificationsRef.current.add(notificationKey);
            
            // Obtener el otro participante para mostrar su nombre
            const otherParticipantId = conversationData.participants.find(p => p !== currentUserId);
            
            console.log('✅ Condiciones cumplidas, enviando notificación');
            
            // Determinar el tipo de mensaje desde lastMessage
            let messageType: 'text' | 'image' | 'location' = 'text';
            if (conversationData.lastMessage?.includes('📷')) {
              messageType = 'image';
            } else if (conversationData.lastMessage?.includes('📍')) {
              messageType = 'location';
            }
            
            // Enviar notificación según el tipo
            if (messageType === 'image') {
              const notifData = NotificationTypes.newImage('Un contacto');
              showNotification(notifData.title, {
                body: notifData.body,
                tag: `conversation-${conversationId}`,
                requireInteraction: notifData.requireInteraction,
              });
            } else if (messageType === 'location') {
              const notifData = NotificationTypes.newLocation('Un contacto');
              showNotification(notifData.title, {
                body: notifData.body,
                tag: `conversation-${conversationId}`,
                requireInteraction: notifData.requireInteraction,
              });
            } else {
              const notifData = NotificationTypes.newMessage('Un contacto', conversationData.lastMessage || 'Nuevo mensaje');
              showNotification(notifData.title, {
                body: notifData.body,
                tag: `conversation-${conversationId}`,
                requireInteraction: notifData.requireInteraction,
              });
            }
            
            console.log('🔔 Notificación de conversación enviada para:', conversationId);
          } else {
            console.log('⏭️ No se cumplen las condiciones para notificar');
          }
        }
      });
    }, (error) => {
      console.error('❌ Error en listener de conversaciones:', error);
    });

    // Cleanup
    return () => {
      console.log('🛑 Deteniendo listener de notificaciones');
      unsubscribe();
    };
  }, [firestore, currentUserId]);
}
