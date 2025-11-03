"use client";

import { useState, useEffect } from 'react';
import { useFirestore } from '../index';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface PermissionStatus {
  hasPermission: boolean; // Permiso mutuo (ambos han aceptado)
  hasSentRequest: boolean; // He enviado solicitud
  hasReceivedRequest: boolean; // He recibido solicitud
  isLoading: boolean;
}

/**
 * Hook para gestionar el sistema de permisos de ubicación en tiempo real
 * Maneja el flujo: solicitud → aceptación → permiso mutuo
 */
export function useLocationSharingPermission(
  currentUserId: string | undefined,
  otherUserId: string | undefined
) {
  const firestore = useFirestore();
  const [status, setStatus] = useState<PermissionStatus>({
    hasPermission: false,
    hasSentRequest: false,
    hasReceivedRequest: false,
    isLoading: true,
  });

  // Verificar estado de permisos
  useEffect(() => {
    const checkPermissions = async () => {
      if (!firestore || !currentUserId || !otherUserId) {
        setStatus({
          hasPermission: false,
          hasSentRequest: false,
          hasReceivedRequest: false,
          isLoading: false,
        });
        return;
      }

      try {
        // Leer documento del usuario actual
        const myDoc = await getDoc(doc(firestore, 'users', currentUserId));
        const myData = myDoc.data();

        // Leer documento del otro usuario
        const otherDoc = await getDoc(doc(firestore, 'users', otherUserId));
        const otherData = otherDoc.data();

        const mySharing = myData?.locationSharingWith || [];
        const myRequests = myData?.locationSharingRequests || [];
        const otherSharing = otherData?.locationSharingWith || [];
        const otherRequests = otherData?.locationSharingRequests || [];

        // Verificar estado
        const iHaveAcceptedThem = mySharing.includes(otherUserId);
        const theyHaveAcceptedMe = otherSharing.includes(currentUserId);
        const iHaveSentRequest = otherRequests.includes(currentUserId);
        const theyHaveSentRequest = myRequests.includes(otherUserId);

        setStatus({
          hasPermission: iHaveAcceptedThem && theyHaveAcceptedMe,
          hasSentRequest: iHaveSentRequest,
          hasReceivedRequest: theyHaveSentRequest,
          isLoading: false,
        });

        console.log('🔐 Estado de permisos:', {
          hasPermission: iHaveAcceptedThem && theyHaveAcceptedMe,
          hasSentRequest: iHaveSentRequest,
          hasReceivedRequest: theyHaveSentRequest,
        });
      } catch (error) {
        console.error('Error checking permissions:', error);
        setStatus((prev) => ({ ...prev, isLoading: false }));
      }
    };

    checkPermissions();

    // Recargar cada 3 segundos
    const interval = setInterval(checkPermissions, 3000);
    return () => clearInterval(interval);
  }, [firestore, currentUserId, otherUserId]);

  // Enviar solicitud
  const sendRequest = async (): Promise<boolean> => {
    if (!firestore || !currentUserId || !otherUserId) return false;

    try {
      const otherUserRef = doc(firestore, 'users', otherUserId);
      await updateDoc(otherUserRef, {
        locationSharingRequests: arrayUnion(currentUserId),
      });

      setStatus((prev) => ({ ...prev, hasSentRequest: true }));
      console.log('✅ Solicitud enviada');
      return true;
    } catch (error) {
      console.error('Error sending request:', error);
      return false;
    }
  };

  // Aceptar solicitud
  const acceptRequest = async (): Promise<boolean> => {
    if (!firestore || !currentUserId || !otherUserId) return false;

    try {
      const myRef = doc(firestore, 'users', currentUserId);
      const otherRef = doc(firestore, 'users', otherUserId);
      
      // Actualizar MI documento: quitar solicitud y agregar permiso
      await updateDoc(myRef, {
        locationSharingRequests: arrayRemove(otherUserId),
        locationSharingWith: arrayUnion(otherUserId),
      });

      // Actualizar documento del OTRO: agregar permiso mutuo
      await updateDoc(otherRef, {
        locationSharingWith: arrayUnion(currentUserId),
      });

      console.log('✅ Solicitud aceptada - Permiso mutuo establecido');
      
      // Actualizar estado inmediatamente
      setTimeout(async () => {
        const myDoc = await getDoc(doc(firestore, 'users', currentUserId));
        const otherDoc = await getDoc(doc(firestore, 'users', otherUserId));
        
        const mySharing = myDoc.data()?.locationSharingWith || [];
        const otherSharing = otherDoc.data()?.locationSharingWith || [];
        
        setStatus({
          hasPermission: mySharing.includes(otherUserId) && otherSharing.includes(currentUserId),
          hasSentRequest: status.hasSentRequest,
          hasReceivedRequest: false,
          isLoading: false,
        });
      }, 500);
      
      return true;
    } catch (error) {
      console.error('Error accepting request:', error);
      return false;
    }
  };

  // Rechazar solicitud
  const rejectRequest = async (): Promise<boolean> => {
    if (!firestore || !currentUserId || !otherUserId) return false;

    try {
      const myRef = doc(firestore, 'users', currentUserId);
      await updateDoc(myRef, {
        locationSharingRequests: arrayRemove(otherUserId),
      });

      setStatus((prev) => ({ ...prev, hasReceivedRequest: false }));
      console.log('❌ Solicitud rechazada');
      return true;
    } catch (error) {
      console.error('Error rejecting request:', error);
      return false;
    }
  };

  return {
    ...status,
    sendRequest,
    acceptRequest,
    rejectRequest,
  };
}
