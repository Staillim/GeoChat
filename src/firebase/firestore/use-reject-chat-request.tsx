"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { initializeFirebase } from "../index";

const { firestore } = initializeFirebase();

/**
 * Custom hook for rejecting chat requests.
 * Updates the request status to rejected.
 */
export function useRejectChatRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const rejectRequest = async (requestId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('❌ Rejecting chat request:', requestId);

      // Actualizar el estado de la solicitud
      const requestRef = doc(firestore, 'chatRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        respondedAt: serverTimestamp()
      });

      console.log('✅ Chat request rejected successfully');
      setSuccess(true);
      return true;
    } catch (err) {
      console.error('❌ Error rejecting chat request:', err);
      setError('Error al rechazar la solicitud. Intenta de nuevo.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    rejectRequest,
    loading,
    error,
    success,
  };
}
