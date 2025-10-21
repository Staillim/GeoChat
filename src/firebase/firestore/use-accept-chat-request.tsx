"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { initializeFirebase } from "../index";

const { firestore } = initializeFirebase();

/**
 * Custom hook for accepting chat requests.
 * Updates both the request status and conversation status to active.
 */
export function useAcceptChatRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const acceptRequest = async (requestId: string, conversationId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('✅ Accepting chat request:', requestId);

      // Actualizar el estado de la solicitud
      const requestRef = doc(firestore, 'chatRequests', requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        respondedAt: serverTimestamp()
      });

      // Actualizar el estado de la conversación a activa
      const conversationRef = doc(firestore, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        status: 'active',
        acceptedAt: serverTimestamp()
      });

      console.log('✅ Chat request accepted successfully');
      setSuccess(true);
      return true;
    } catch (err) {
      console.error('❌ Error accepting chat request:', err);
      setError('Error al aceptar la solicitud. Intenta de nuevo.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    acceptRequest,
    loading,
    error,
    success,
  };
}
