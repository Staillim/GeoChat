'use client';
import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import Link from 'next/link';

interface MapUser {
  uid: string;
  email: string | null;
  displayName: string;
  lat?: number;
  lng?: number;
  photoURL?: string | null;
}

interface MapComponentProps {
  users: MapUser[];
  currentUser: MapUser;
}

export function MapComponent({ users, currentUser }: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [selectedUser, setSelectedUser] = useState<MapUser | null>(null);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <div className="text-center p-4 bg-card rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2">Falta la clave de API de Google Maps</h2>
          <p>Proporciona una clave de API válida para mostrar el mapa.</p>
        </div>
      </div>
    );
  }

  // Usar ubicación por defecto si no está disponible
  const currentLat = currentUser.lat || 34.054;
  const currentLng = currentUser.lng || -118.242;

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId={'local-connect-map'}
        style={{ width: '100%', height: '100%' }}
        defaultCenter={{ lat: currentLat, lng: currentLng }}
        defaultZoom={15}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        {users.map((user) => {
          const userLat = user.lat || 34.054;
          const userLng = user.lng || -118.242;
          
          return (
          <AdvancedMarker
            key={user.uid}
            position={{ lat: userLat, lng: userLng }}
            onClick={() => setSelectedUser(user)}
          >
            <Pin background={'hsl(var(--primary))'} glyphColor={'#fff'} borderColor={'#fff'} />
          </AdvancedMarker>
        )})}

        <AdvancedMarker
            key={currentUser.uid}
            position={{ lat: currentLat, lng: currentLng }}
            onClick={() => setSelectedUser(currentUser)}
        >
            <Pin background={'hsl(var(--accent))'} glyphColor={'#fff'} borderColor={'#fff'} />
        </AdvancedMarker>

        {selectedUser && (
          <InfoWindow
            position={{ lat: selectedUser.lat || 34.054, lng: selectedUser.lng || -118.242 }}
            onCloseClick={() => setSelectedUser(null)}
          >
            <Card className="border-0 shadow-none w-64">
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                    <Avatar>
                        <AvatarImage src={selectedUser.photoURL || ''} alt={selectedUser.displayName} />
                        <AvatarFallback>{selectedUser.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{selectedUser.displayName}</CardTitle>
                </CardHeader>
                {selectedUser.uid !== currentUser.uid && (
                <CardContent className="p-4 pt-0">
                    <Button asChild className="w-full">
                        <Link href={`/chat/${selectedUser.uid}`}>Enviar Mensaje</Link>
                    </Button>
                </CardContent>
                )}
            </Card>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
