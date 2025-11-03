"use client";

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '../index';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
  getDoc,
} from 'firebase/firestore';

interface LiveLocation {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  latitude: number;
  longitude: number;
  lastUpdated: Timestamp;
  sharedWith: string;
  isActive: boolean;
}

/**
 * Hook para activar/desactivar ubicación en tiempo real
 * SOLO SE ACTIVA SI HAY PERMISO MUTUO
 */
export function useLiveLocationSharing(
  currentUserId: string | undefined,
  recipientId: string | undefined,
  hasPermission: boolean // REQUERIDO: debe haber permiso mutuo
) {
  const firestore = useFirestore();
  const [isSharing, setIsSharing] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [receivedLocation, setReceivedLocation] = useState<LiveLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Escuchar ubicación del otro usuario (SOLO SI HAY PERMISO)
  useEffect(() => {
    if (!firestore || !currentUserId || !recipientId || !hasPermission) {
      setReceivedLocation(null);
      return;
    }

    const q = query(
      collection(firestore, 'liveLocations'),
      where('userId', '==', recipientId),
      where('sharedWith', '==', currentUserId),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setReceivedLocation({
            id: snapshot.docs[0].id,
            ...data,
          } as LiveLocation);
        } else {
          setReceivedLocation(null);
        }
      },
      (err) => {
        console.error('Error listening to location:', err);
      }
    );

    return () => unsubscribe();
  }, [firestore, currentUserId, recipientId, hasPermission]);

  // Actualizar ubicación en Firestore
  const updateLocation = useCallback(
    async (latitude: number, longitude: number) => {
      if (!firestore || !currentUserId || !recipientId || !hasPermission) {
        console.warn('⚠️ No se puede actualizar: falta permiso o datos');
        return;
      }

      try {
        const userDoc = await getDoc(doc(firestore, 'users', currentUserId));
        const userData = userDoc.data();

        const locationRef = doc(
          firestore,
          'liveLocations',
          `${currentUserId}_${recipientId}`
        );

        await setDoc(locationRef, {
          userId: currentUserId,
          userName: userData?.displayName || 'Usuario',
          userPhoto: userData?.photoURL || null,
          latitude,
          longitude,
          lastUpdated: serverTimestamp(),
          sharedWith: recipientId,
          isActive: true,
        });

        console.log('📍 Ubicación actualizada');
      } catch (err: any) {
        console.error('❌ Error actualizando ubicación:', err);
        setError(err.message);
      }
    },
    [firestore, currentUserId, recipientId, hasPermission]
  );

  // Activar compartir
  const startSharing = useCallback(async () => {
    if (!hasPermission) {
      setError('No hay permiso mutuo para compartir ubicación');
      return Promise.reject(new Error('Sin permiso'));
    }

    if (!navigator.geolocation) {
      setError('Geolocalización no disponible');
      return Promise.reject(new Error('No geolocation'));
    }

    setError(null);

    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            await updateLocation(latitude, longitude);
            setIsSharing(true);

            // Configurar actualizaciones cada 1 minuto (60000 ms)
            const intervalId = setInterval(() => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  updateLocation(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                  console.error('Error obteniendo ubicación:', error);
                },
                {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0,
                }
              );
            }, 60000); // 1 minuto

            // Guardar el ID del intervalo (convertir a number para compatibilidad)
            setWatchId(intervalId as unknown as number);
            console.log('🚀 Ubicación en tiempo real activada (actualización cada 1 minuto)');
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        (error) => {
          let msg = 'No se pudo obtener ubicación';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Permiso de ubicación denegado';
          }
          setError(msg);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [hasPermission, updateLocation]);

  // Detener compartir
  const stopSharing = useCallback(async () => {
    if (watchId !== null) {
      clearInterval(watchId); // Cambiar clearWatch por clearInterval
      setWatchId(null);
    }

    if (firestore && currentUserId && recipientId) {
      try {
        await deleteDoc(
          doc(firestore, 'liveLocations', `${currentUserId}_${recipientId}`)
        );
        console.log('🛑 Ubicación en tiempo real desactivada');
      } catch (err) {
        console.error('Error stopping sharing:', err);
      }
    }

    setIsSharing(false);
  }, [firestore, currentUserId, recipientId, watchId]);

  // Verificar si ya estoy compartiendo
  useEffect(() => {
    if (!firestore || !currentUserId || !recipientId || !hasPermission) {
      setIsSharing(false);
      return;
    }

    const q = query(
      collection(firestore, 'liveLocations'),
      where('userId', '==', currentUserId),
      where('sharedWith', '==', recipientId),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const isActive = !snapshot.empty;
      setIsSharing(isActive);

      if (isActive && !watchId && navigator.geolocation) {
        // Restaurar intervalo de actualización cada 1 minuto
        const intervalId = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              updateLocation(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
              console.error('Error obteniendo ubicación:', error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        }, 60000); // 1 minuto
        setWatchId(intervalId as unknown as number);
      }
    });

    return () => unsubscribe();
  }, [firestore, currentUserId, recipientId, hasPermission, watchId, updateLocation]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        clearInterval(watchId); // Cambiar clearWatch por clearInterval
      }
    };
  }, [watchId]);

  return {
    isSharing,
    receivedLocation,
    error,
    startSharing,
    stopSharing,
  };
}
