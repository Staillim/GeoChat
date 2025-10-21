"use client";

import { useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { initializeFirebase } from "../index";
import { useUser } from "../auth/use-user";

const { firestore } = initializeFirebase();

/**
 * Custom hook for sending chat requests to other users.
 * Creates a pending conversation and a chat request document.
 */
export function useSendChatRequest() {
  const { user: currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendRequest = async (toUserId: string): Promise<boolean> => {
    if (!currentUser) {
      setError("Debes iniciar sesión para enviar solicitudes");
      return false;
    }

    if (currentUser.uid === toUserId) {
      setError("No puedes enviarte una solicitud a ti mismo");
      return false;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("📤 Sending chat request to:", toUserId);

      // Check if there's already a conversation or request between these users
      const conversationsRef = collection(firestore, "conversations");
      const existingConvQuery = query(
        conversationsRef,
        where("participants", "array-contains", currentUser.uid)
      );
      const existingConvSnapshot = await getDocs(existingConvQuery);

      let existingConversation = false;
      existingConvSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(toUserId)) {
          existingConversation = true;
        }
      });

      if (existingConversation) {
        setError("Ya existe una conversación con este usuario");
        return false;
      }

      // Check if there's already a pending request
      const requestsRef = collection(firestore, "chatRequests");
      const existingRequestQuery = query(
        requestsRef,
        where("fromUserId", "==", currentUser.uid),
        where("toUserId", "==", toUserId),
        where("status", "==", "pending")
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      if (!existingRequestSnapshot.empty) {
        setError("Ya has enviado una solicitud a este usuario");
        return false;
      }

      // Create conversation with pending status
      const conversationData = {
        participants: [currentUser.uid, toUserId],
        createdBy: currentUser.uid,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const conversationRef = await addDoc(conversationsRef, conversationData);
      console.log("✅ Conversation created:", conversationRef.id);

      // Create chat request
      const requestData = {
        fromUserId: currentUser.uid,
        toUserId: toUserId,
        conversationId: conversationRef.id,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      const requestRef = await addDoc(requestsRef, requestData);
      console.log("✅ Chat request created:", requestRef.id);

      setSuccess(true);
      return true;
    } catch (err) {
      console.error("❌ Error sending chat request:", err);
      setError("Error al enviar la solicitud. Intenta de nuevo.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendRequest,
    loading,
    error,
    success,
  };
}
