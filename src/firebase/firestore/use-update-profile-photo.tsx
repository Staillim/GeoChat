'use client';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export function useUpdateProfilePhoto() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firestore = useFirestore();

  const updateProfilePhoto = async (userId: string, photoBase64: string) => {
    if (!firestore) {
      setError('Firestore no está disponible');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const userDocRef = doc(firestore, 'users', userId);
      
      await updateDoc(userDocRef, {
        photoURL: photoBase64,
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Foto de perfil actualizada correctamente');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error al actualizar foto de perfil:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateProfilePhoto,
    isUpdating,
    error,
  };
}
