'use client';
import { MapComponent } from '@/components/map-component';
import { useUser } from '@/firebase/auth/use-user';
import { useUsers } from '@/firebase/firestore/use-users';
import { Skeleton } from '@/components/ui/skeleton';

export default function MapPage() {
  const { user, userProfile, isUserLoading } = useUser();
  const { users, isLoading: isUsersLoading } = useUsers();

  if (isUserLoading || isUsersLoading) {
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
          photoURL: user.photoURL
        }}
      />
    </div>
  );
}
