"use client";

import { useState } from "react";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { initializeFirebase } from "../index";

const { firestore } = initializeFirebase();

/**
 * Custom hook for sending messages in a conversation.
 * Sends a message and updates the conversation's lastMessage.
 */
export function useSendMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    conversationId: string,
    senderId: string,
    text: string
  ): Promise<boolean> => {
    if (!text.trim()) {
      setError("El mensaje no puede estar vacío");
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

      // Crear el mensaje en la subcolección
      const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: senderId,
        text: text.trim(),
        timestamp: serverTimestamp(),
      });

      // Preparar las actualizaciones de la conversación
      const updates: any = {
        lastMessage: text.trim(),
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Incrementar el contador de no leídos para el receptor
      if (recipientId) {
        const currentUnreadCount = conversationData?.unreadCount?.[recipientId] || 0;
        updates[`unreadCount.${recipientId}`] = currentUnreadCount + 1;
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
