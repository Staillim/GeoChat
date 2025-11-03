'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SharedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  duration?: number; // en minutos
  senderName: string;
  senderPhotoURL?: string | null; // puede ser null
  expiresAt?: number;
}

interface SharedLocationContextType {
  sharedLocation: SharedLocation | null;
  setSharedLocation: (location: SharedLocation | null) => void;
  clearSharedLocation: () => void;
  isExpired: () => boolean;
}

const SharedLocationContext = createContext<SharedLocationContextType | undefined>(undefined);

export function SharedLocationProvider({ children }: { children: ReactNode }) {
  const [sharedLocation, setSharedLocationState] = useState<SharedLocation | null>(null);

  const setSharedLocation = (location: SharedLocation | null) => {
    if (location && location.duration) {
      // Calcular tiempo de expiración
      const expiresAt = location.timestamp + (location.duration * 60 * 1000);
      setSharedLocationState({ ...location, expiresAt });
    } else {
      setSharedLocationState(location);
    }
  };

  const clearSharedLocation = () => setSharedLocationState(null);

  const isExpired = () => {
    if (!sharedLocation || !sharedLocation.expiresAt) return false;
    return Date.now() > sharedLocation.expiresAt;
  };

  return (
    <SharedLocationContext.Provider
      value={{
        sharedLocation,
        setSharedLocation,
        clearSharedLocation,
        isExpired,
      }}
    >
      {children}
    </SharedLocationContext.Provider>
  );
}

export function useSharedLocation() {
  const context = useContext(SharedLocationContext);
  if (context === undefined) {
    throw new Error('useSharedLocation must be used within a SharedLocationProvider');
  }
  return context;
}
