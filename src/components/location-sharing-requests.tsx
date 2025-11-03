"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navigation, Check, X, Users } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, arrayRemove, arrayUnion, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import { showNotification, NotificationTypes } from '@/hooks/use-notifications';

interface LocationRequest {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  email?: string | null;
}

export function LocationSharingRequests() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [requests, setRequests] = useState<LocationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!firestore || !user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        const userData = userDoc.data();
        const requestUids = userData?.locationSharingRequests || [];
        
        if (requestUids.length === 0) {
          setRequests([]);
          setIsLoading(false);
          return;
        }
        
        // Obtener información de cada usuario que solicita
        const requestsData: LocationRequest[] = [];
        for (const uid of requestUids) {
          const requesterDoc = await getDoc(doc(firestore, 'users', uid));
          if (requesterDoc.exists()) {
            const data = requesterDoc.data();
            requestsData.push({
              uid: uid,
              displayName: data.displayName || data.email?.split('@')[0] || 'Usuario',
              photoURL: data.photoURL || null,
              email: data.email || null,
            });
          }
        }
        
        setRequests(requestsData);
      } catch (error) {
        console.error('Error fetching location requests:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequests();
  }, [firestore, user?.uid]);

  const handleAccept = async (requesterUid: string) => {
    if (!firestore || !user?.uid) return;
    
    setProcessingUid(requesterUid);
    
    try {
      const userRef = doc(firestore, 'users', user.uid);
      
      // Remover de solicitudes y agregar a compartidos
      await updateDoc(userRef, {
        locationSharingRequests: arrayRemove(requesterUid),
        locationSharingWith: arrayUnion(requesterUid)
      });
      
      // Encontrar el nombre del solicitante para la notificación
      const requester = requests.find(r => r.uid === requesterUid);
      if (requester) {
        showNotification(
          NotificationTypes.locationSharingAccepted(requester.displayName).title,
          NotificationTypes.locationSharingAccepted(requester.displayName)
        );
      }
      
      // Actualizar estado local
      setRequests(prev => prev.filter(r => r.uid !== requesterUid));
      
      console.log(`✅ Solicitud aceptada de ${requesterUid}`);
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
      alert('Error al aceptar la solicitud');
    } finally {
      setProcessingUid(null);
    }
  };

  const handleReject = async (requesterUid: string) => {
    if (!firestore || !user?.uid) return;
    
    setProcessingUid(requesterUid);
    
    try {
      const userRef = doc(firestore, 'users', user.uid);
      
      // Solo remover de solicitudes
      await updateDoc(userRef, {
        locationSharingRequests: arrayRemove(requesterUid)
      });
      
      // Actualizar estado local
      setRequests(prev => prev.filter(r => r.uid !== requesterUid));
      
      console.log(`❌ Solicitud rechazada de ${requesterUid}`);
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      alert('Error al rechazar la solicitud');
    } finally {
      setProcessingUid(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-sky-200 dark:border-sky-800 shimmer-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
            <Navigation className="h-5 w-5" />
            Solicitudes de Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null; // No mostrar la card si no hay solicitudes
  }

  return (
    <Card className="border-2 border-sky-200 dark:border-sky-800 shimmer-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
          <Navigation className="h-5 w-5" />
          Solicitudes de Ubicación en Tiempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Estos usuarios quieren ver tu ubicación automáticamente en el mapa
        </p>
        
        {requests.map((request) => (
          <div 
            key={request.uid}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <Avatar className="h-12 w-12 ring-2 ring-sky-400">
              <AvatarImage src={request.photoURL || ''} alt={request.displayName} />
              <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white font-bold">
                {request.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{request.displayName}</p>
              {request.email && (
                <p className="text-xs text-muted-foreground truncate">{request.email}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAccept(request.uid)}
                disabled={processingUid === request.uid}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(request.uid)}
                disabled={processingUid === request.uid}
                className="border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
