'use client';
import { useFirebase, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * Hook specifically for accessing the authenticated user's state from both Auth and Firestore.
 * This provides the User object from Auth, loading status, and the user profile from Firestore.
 * @returns Object with user, isUserLoading, userError, and userProfile.
 */
export const useUser = () => {
    const { user, isUserLoading: authLoading, userError } = useFirebase();
    const firestore = useFirestore();
    
    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useDoc(userDocRef);

    // Solo consideramos cargando si auth está cargando
    // El perfil puede no existir, pero eso no debería bloquear
    return { 
        user, // The raw Firebase Auth user object
        userProfile, // The user data from the /users/{uid} document in Firestore (puede ser null)
        isUserLoading: authLoading, // Solo usar el estado de auth, no el de profile
        userError: userError || profileError // Combined error state
    };
};
