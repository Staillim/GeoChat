'use client';
import { useCollection } from './use-collection';
import { useFirestore } from '../index';
import { collection } from 'firebase/firestore';
import { useMemoFirebase } from '../index';

export interface FirestoreUser {
  uid: string;
  email: string | null;
  displayName: string;
  pin: string;
  bio?: string;
  photoURL?: string | null;
  lat?: number;
  lng?: number;
}

/**
 * Hook to get all users from Firestore
 */
export const useUsers = () => {
  const firestore = useFirestore();
  
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data, isLoading, error } = useCollection<FirestoreUser>(usersCollectionRef);

  return {
    users: data || [],
    isLoading,
    error
  };
};
