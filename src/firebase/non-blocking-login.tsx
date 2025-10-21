'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Firestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from './non-blocking-updates';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, firestore: Firestore, email: string, password: string, displayName: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
      // User created, now create their document in Firestore.
      const user = userCredential.user;
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const pin = Math.floor(100000 + Math.random() * 900000).toString();

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        pin: pin
      };

      // Use the non-blocking function to create the document
      setDocumentNonBlocking(userDocRef, userData, { merge: false });
    })
    .catch(error => {
      // The onAuthStateChanged listener will handle the overall state,
      // but you might want to log creation-specific errors or show a toast.
      console.error("Error during sign up:", error);
    });
}


/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, firestore?: Firestore): Promise<void> {
  return signInWithEmailAndPassword(authInstance, email, password)
    .then(async userCredential => {
      console.log("Usuario autenticado exitosamente:", userCredential.user);
      
      // Verificar si el documento del usuario existe en Firestore
      if (firestore) {
        try {
          const userDocRef = doc(firestore, 'users', userCredential.user.uid);
          const userDoc = await getDoc(userDocRef);
          
          // Si el documento no existe, crearlo
          if (!userDoc.exists()) {
            console.log("Documento de usuario no existe, creándolo...");
            const pin = Math.floor(100000 + Math.random() * 900000).toString();
            const userData = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'Usuario',
              pin: pin
            };
            await setDoc(userDocRef, userData);
            console.log("Documento de usuario creado exitosamente");
          }
        } catch (error) {
          console.error("Error al verificar/crear documento de usuario:", error);
          // No lanzar el error, permitir que el login continúe
        }
      }
    })
    .catch(error => {
      console.error("Error durante el inicio de sesión:", error);
      throw error; // Re-lanzar el error para que pueda ser manejado por el componente
    });
}
