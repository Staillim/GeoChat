'use client';
import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import type { User } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface MapComponentProps {
  users: User[];
  currentUser: User;
}

export function MapComponent({ users, currentUser }: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId={'local-connect-map'}
        style={{ width: '100%', height: '100%' }}
        defaultCenter={{ lat: currentUser.lat, lng: currentUser.lng }}
        defaultZoom={15}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        {users.map((user) => {
          const avatarData = PlaceHolderImages.find(p => p.id === user.avatar);
          return (
          <AdvancedMarker
            key={user.id}
            position={{ lat: user.lat, lng: user.lng }}
            onClick={() => setSelectedUser(user)}
          >
            <Pin background={'hsl(var(--primary))'} glyphColor={'#fff'} borderColor={'#fff'} />
          </AdvancedMarker>
        )})}

        <AdvancedMarker
            key={currentUser.id}
            position={{ lat: currentUser.lat, lng: currentUser.lng }}
            onClick={() => setSelectedUser(currentUser)}
        >
            <Pin background={'hsl(var(--accent))'} glyphColor={'#fff'} borderColor={'#fff'} />
        </AdvancedMarker>

        {selectedUser && (
          <InfoWindow
            position={{ lat: selectedUser.lat, lng: selectedUser.lng }}
            onCloseClick={() => setSelectedUser(null)}
          >
            <Card className="border-0 shadow-none w-64">
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                    <Avatar>
                        <AvatarImage src={PlaceHolderImages.find(p => p.id === selectedUser.avatar)?.imageUrl} alt={selectedUser.name} />
                        <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{selectedUser.name}</CardTitle>
                </CardHeader>
                {selectedUser.id !== currentUser.id && (
                <CardContent className="p-4 pt-0">
                    <Button asChild className="w-full">
                        <Link href={`/chat/conv-${selectedUser.id.split('-')[1]}`}>Enviar Mensaje</Link>
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
