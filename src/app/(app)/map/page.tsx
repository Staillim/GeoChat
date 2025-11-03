'use client';
import dynamic from 'next/dynamic';
import { useUser } from '@/firebase/auth/use-user';
import { useUsers } from '@/firebase/firestore/use-users';
import { useSharedLocations } from '@/firebase/firestore/use-shared-locations';
import { useAllLiveLocations } from '@/firebase/firestore/use-all-live-locations';
import { Skeleton } from '@/components/ui/skeleton';

// Importar MapComponent dinámicamente solo en el cliente para evitar errores de SSR con Leaflet
const MapComponent = dynamic(
  () => import('@/components/map-component').then((mod) => ({ default: mod.MapComponent })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-sky-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    )
  }
);

export default function MapPage() {
  const { user, userProfile, isUserLoading } = useUser();
  const { users, isLoading: isUsersLoading } = useUsers();
  const { locations: sharedLocations, isLoading: isLocationsLoading } = useSharedLocations(user?.uid);
  const { liveLocations, isLoading: isLiveLocationsLoading } = useAllLiveLocations(user?.uid);

  if (isUserLoading || isUsersLoading || isLocationsLoading || isLiveLocationsLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-96" />
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center p-4 bg-card rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2">No se pudo cargar tu perfil</h2>
          <p>Por favor, inicia sesión nuevamente.</p>
        </div>
      </div>
    );
  }

  // Filtrar el usuario actual de la lista de usuarios
  const otherUsers = users.filter(u => u.uid !== user.uid);
  
  // Usar photoURL de userProfile (Firestore) si existe, sino de user (Auth)
  const currentUserPhoto = userProfile.photoURL || user.photoURL;
  
  console.log('🗺️ MapPage - Datos:', {
    totalUsers: users.length,
    otherUsers: otherUsers.length,
    otherUsersData: otherUsers.map(u => ({
      uid: u.uid,
      displayName: u.displayName,
      photoURL: u.photoURL,
      lat: u.lat,
      lng: u.lng
    })),
    currentUser: {
      uid: user.uid,
      displayName: userProfile.displayName,
      photoURL: currentUserPhoto,
      lat: userProfile.lat,
      lng: userProfile.lng
    },
    sharedLocations: sharedLocations.length,
    liveLocations: liveLocations.length
  });
  
  return (
    <div className="h-full w-full">
      <MapComponent 
        users={otherUsers} 
        currentUser={{
          uid: user.uid,
          email: user.email,
          displayName: userProfile.displayName,
          lat: userProfile.lat || 34.054,
          lng: userProfile.lng || -118.242,
          photoURL: currentUserPhoto
        }}
        sharedLocations={sharedLocations}
        liveLocations={liveLocations}
      />
    </div>
  );
}
