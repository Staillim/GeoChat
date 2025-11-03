"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { initializeFirebase } from "../index";
import { useUser } from "../auth/use-user";

const { firestore } = initializeFirebase();

interface FirestoreUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  pin?: string;
}

/**
 * Custom hook for searching users by their PIN code.
 * Returns the found user, loading state, error message, and search function.
 */
export function useSearchUserByPin() {
  const { user: currentUser } = useUser();
  const [user, setUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByPin = async (pin: string) => {
    if (!currentUser) {
      setError("Debes iniciar sesión para buscar usuarios");
      return;
    }

    if (!pin || pin.length !== 6) {
      setError("El PIN debe tener exactamente 6 dígitos");
      return;
    }

    setLoading(true);
    setError(null);
    setUser(null);

    try {
      console.log("🔍 Searching for user with PIN:", pin);
      
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("pin", "==", pin));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("❌ No user found with PIN:", pin);
        setUser(null);
      } else {
        const foundUser = querySnapshot.docs[0];
        const userData = foundUser.data() as Omit<FirestoreUser, "uid">;
        
        console.log("✅ User found:", userData);

        // Check if it's not the current user
        if (foundUser.id === currentUser.uid) {
          setError("No puedes enviarte una solicitud a ti mismo");
          setUser(null);
        } else {
          setUser({
            uid: foundUser.id,
            ...userData,
          });
        }
      }
    } catch (err) {
      console.error("❌ Error searching user by PIN:", err);
      setError("Error al buscar el usuario. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    searchByPin,
  };
}
