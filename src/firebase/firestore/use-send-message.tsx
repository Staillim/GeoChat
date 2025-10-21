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

      // Crear el mensaje en la subcolección
      const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: senderId,
        text: text.trim(),
        timestamp: serverTimestamp(),
      });

      // Actualizar la conversación con el último mensaje
      const conversationRef = doc(firestore, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: text.trim(),
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

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
