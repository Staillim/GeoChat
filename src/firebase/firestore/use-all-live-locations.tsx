"use client";

import { useState, useEffect } from 'react';
import { useFirestore } from '../index';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';

export interface LiveLocationData {
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
 * Hook para obtener TODAS las ubicaciones en tiempo real
 * Para mostrar en el mapa
 */
export function useAllLiveLocations(currentUserId: string | undefined) {
  const firestore = useFirestore();
  const [liveLocations, setLiveLocations] = useState<LiveLocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !currentUserId) {
      setIsLoading(false);
      return;
    }

    const locationsMap = new Map<string, LiveLocationData>();

    // Query 1: Ubicaciones que YO estoy compartiendo
    const myQuery = query(
      collection(firestore, 'liveLocations'),
      where('userId', '==', currentUserId),
      where('isActive', '==', true)
    );

    // Query 2: Ubicaciones compartidas CONMIGO
    const sharedQuery = query(
      collection(firestore, 'liveLocations'),
      where('sharedWith', '==', currentUserId),
      where('isActive', '==', true)
    );

    const updateLocations = () => {
      setLiveLocations(Array.from(locationsMap.values()));
    };

    const unsubscribe1 = onSnapshot(myQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          locationsMap.delete(change.doc.id);
        } else {
          locationsMap.set(change.doc.id, {
            id: change.doc.id,
            ...change.doc.data(),
          } as LiveLocationData);
        }
      });
      updateLocations();
      setIsLoading(false);
    });

    const unsubscribe2 = onSnapshot(sharedQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          locationsMap.delete(change.doc.id);
        } else {
          locationsMap.set(change.doc.id, {
            id: change.doc.id,
            ...change.doc.data(),
          } as LiveLocationData);
        }
      });
      updateLocations();
      setIsLoading(false);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [firestore, currentUserId]);

  return {
    liveLocations,
    isLoading,
  };
}
