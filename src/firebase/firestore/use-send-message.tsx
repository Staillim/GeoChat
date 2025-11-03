"use client";

import { useState } from "react";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { initializeFirebase } from "../index";

const { firestore } = initializeFirebase();

export interface MessageData {
  text?: string;
  imageBase64?: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: number;
    duration?: number; // Duración en minutos
  };
  type: 'text' | 'image' | 'location';
  senderName?: string; // Nombre del remitente
  senderPhotoURL?: string | null; // Foto del remitente (puede ser null)
}

/**
 * Custom hook for sending messages in a conversation.
 * Sends a message and updates the conversation's lastMessage.
 * Supports text, images (Base64), and location sharing.
 */
export function useSendMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    conversationId: string,
    senderId: string,
    messageData: MessageData
  ): Promise<boolean> => {
    // Validación según el tipo de mensaje
    if (messageData.type === 'text' && !messageData.text?.trim()) {
      setError("El mensaje no puede estar vacío");
      return false;
    }
    if (messageData.type === 'image' && !messageData.imageBase64) {
      setError("La imagen no puede estar vacía");
      return false;
    }
    if (messageData.type === 'location' && !messageData.location) {
      setError("La ubicación no puede estar vacía");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📤 Sending message to conversation:', conversationId);

      // Obtener los participantes de la conversación
      const conversationRef = doc(firestore, 'conversations', conversationId);
      const conversationSnap = await (await import('firebase/firestore')).getDoc(conversationRef);
      const conversationData = conversationSnap.data();
      const participants = conversationData?.participants || [];
      
      // Encontrar al otro participante (el receptor)
      const recipientId = participants.find((p: string) => p !== senderId);

      // Preparar el objeto del mensaje
      const messageObj: any = {
        senderId: senderId,
        senderName: messageData.senderName || null,
        senderPhotoURL: messageData.senderPhotoURL || null,
        type: messageData.type,
        timestamp: serverTimestamp(),
        read: false,
        readAt: null,
      };

      // Agregar datos según el tipo
      if (messageData.type === 'text') {
        messageObj.text = messageData.text?.trim();
      } else if (messageData.type === 'image') {
        messageObj.imageBase64 = messageData.imageBase64;
        messageObj.text = '📷 Imagen';
      } else if (messageData.type === 'location') {
        messageObj.location = messageData.location;
        messageObj.text = '📍 Ubicación compartida';
      }

      // Crear el mensaje en la subcolección
      const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, messageObj);

      // Preparar las actualizaciones de la conversación
      const updates: any = {
        lastMessage: messageObj.text,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: senderId, // Guardar quién envió el último mensaje
        updatedAt: serverTimestamp(),
        // Limpiar estado pendiente del sender (acaba de responder)
        [`pendingFor.${senderId}`]: false,
      };

      // Incrementar el contador de no leídos para el receptor
      // Y marcar como "pendiente" para el receptor (tiene mensajes sin responder)
      if (recipientId) {
        const currentUnreadCount = conversationData?.unreadCount?.[recipientId] || 0;
        updates[`unreadCount.${recipientId}`] = currentUnreadCount + 1;
        // Estado pendiente para el receptor = tiene mensajes sin leer
        updates[`pendingFor.${recipientId}`] = true;
      }

      // Actualizar la conversación
      await updateDoc(conversationRef, updates);

      console.log('✅ Message sent successfully');
      return true;
    } catch (err) {
      console.error('❌ Error sending message:', err);
      setError('Error al enviar el mensaje. Intenta de nuevo.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendMessage,
    loading,
    error,
  };
}
