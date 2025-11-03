'use client';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import Link from 'next/link';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { useSharedLocation } from '@/hooks/use-shared-location-store';
import type { LiveLocationData } from '@/firebase/firestore/use-all-live-locations';

interface SharedLocation {
  userId: string;
  userName: string;
  userPhoto: string | null;
  latitude: number;
  longitude: number;
  timestamp: number;
  conversationId: string;
}

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
  sharedLocations?: SharedLocation[];
  liveLocations?: LiveLocationData[];
}

// Componente para centrar el mapa en la ubicación del usuario actual
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export function MapComponent({ users, currentUser, sharedLocations = [], liveLocations = [] }: MapComponentProps) {
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const { sharedLocation, clearSharedLocation, isExpired } = useSharedLocation();

  console.log('🗺️ MapComponent recibió:', {
    users: users.length,
    sharedLocations: sharedLocations.length,
    liveLocations: liveLocations.length
  });

  // Limpiar ubicación compartida al desmontar el componente
  useEffect(() => {
    return () => {
      console.log('🧹 Limpiando ubicación compartida al salir del mapa');
      clearSharedLocation();
    };
  }, [clearSharedLocation]);
  
  // Verificar expiración de ubicación compartida
  useEffect(() => {
    if (sharedLocation && isExpired()) {
      console.log('⏰ Ubicación compartida expirada, limpiando...');
      clearSharedLocation();
    }
  }, [sharedLocation, isExpired, clearSharedLocation]);

  useEffect(() => {
    // Verificar que estamos en el cliente antes de acceder a APIs del navegador
    if (typeof window === 'undefined') return;
    
    setIsClient(true);
    
    // Configurar iconos personalizados de Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    // Solicitar ubicación del usuario
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setIsLoadingLocation(false);
          console.log('✅ Ubicación obtenida:', { latitude, longitude });
          
          // Opcional: Guardar la ubicación en Firestore
          // updateUserLocation(currentUser.uid, latitude, longitude);
        },
        (error) => {
          console.error('❌ Error al obtener ubicación:', error);
          setLocationError(error.message);
          setIsLoadingLocation(false);
          
          // Usar ubicación por defecto si hay error
          const defaultLat = currentUser.lat || 34.054;
          const defaultLng = currentUser.lng || -118.242;
          setUserLocation([defaultLat, defaultLng]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('Geolocalización no disponible');
      setIsLoadingLocation(false);
      const defaultLat = currentUser.lat || 34.054;
      const defaultLng = currentUser.lng || -118.242;
      setUserLocation([defaultLat, defaultLng]);
    }
  }, [currentUser.lat, currentUser.lng, currentUser.uid]);

  const currentLat = currentUser.lat || 34.054;
  const currentLng = currentUser.lng || -118.242;
  
  // Usar ubicación compartida si existe y no ha expirado, sino usar ubicación del usuario
  let center: [number, number];
  if (sharedLocation && !isExpired()) {
    center = [sharedLocation.latitude, sharedLocation.longitude];
  } else if (userLocation) {
    center = userLocation;
  } else {
    center = [currentLat, currentLng];
  }

  // Crear iconos personalizados con fotos de perfil
  const createAvatarIcon = (photoURL: string | null | undefined, displayName: string, isCurrentUser = false, isLive = false) => {
    const size = isCurrentUser ? 48 : 40;
    const ringColor = isLive ? '#10b981' : (isCurrentUser ? '#8b5cf6' : '#3b82f6'); // green para live, violet para usuario actual, blue para otros
    const initial = (displayName || 'U').charAt(0).toUpperCase();
    
    // Debug: ver si la foto existe
    if (isCurrentUser) {
      console.log('🗺️ Current User Photo URL:', photoURL);
    }
    
    // Agregar badge de "LIVE" si es ubicación en tiempo real
    const liveBadge = isLive 
      ? `<div style="position: absolute; bottom: -4px; right: -4px; background: linear-gradient(135deg, #10b981, #059669); color: white; font-size: 8px; font-weight: bold; padding: 2px 4px; border-radius: 6px; box-shadow: 0 2px 8px rgba(16,185,129,0.5); border: 2px solid white; animation: pulse 2s infinite;">LIVE</div>`
      : '';
    
    const avatarHTML = photoURL
      ? `<div style="width: ${size}px; height: ${size}px; border-radius: 50%; overflow: hidden; border: 4px solid ${ringColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.4); background: white; position: relative;">
          <img src="${photoURL}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="${displayName}" crossorigin="anonymous" onerror="this.style.display='none';" />
          ${liveBadge}
        </div>`
      : `<div style="width: ${size}px; height: ${size}px; border-radius: 50%; border: 4px solid ${ringColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.4); background: linear-gradient(135deg, ${ringColor}, #60a5fa); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${size/2.2}px; font-family: system-ui, -apple-system, sans-serif; position: relative;">
          ${initial}
          ${liveBadge}
        </div>`;
    
    return L.divIcon({
      html: avatarHTML,
      className: 'custom-avatar-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2 - 10]
    });
  };

  // Función para formatear tiempo relativo
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${days} d`;
  };

  if (!isClient || isLoadingLocation) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-sky-950 relative overflow-hidden">
        {/* Orbes decorativos */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-sky-400/20 rounded-full blur-3xl floating-orb" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl floating-orb" style={{ animationDelay: '2s' }} />
        
        <div className="text-center relative z-10">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-sky-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground mb-2">
            {isLoadingLocation ? 'Obteniendo tu ubicación...' : 'Cargando mapa...'}
          </p>
          {isLoadingLocation && (
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4 animate-pulse text-sky-500" />
              Permitir acceso a ubicación en el navegador
            </p>
          )}
        </div>
      </div>
    );
  }

  // Mostrar error si no se pudo obtener la ubicación
  if (locationError && !userLocation) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-sky-950 relative overflow-hidden">
        <div className="text-center p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl border-2 border-sky-200 dark:border-sky-800 max-w-md relative z-10">
          <div className="mb-4">
            <span className="text-6xl">📍</span>
          </div>
          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
            No se pudo obtener tu ubicación
          </h2>
          <p className="text-muted-foreground mb-4">
            {locationError}
          </p>
          <p className="text-sm text-muted-foreground">
            Usando ubicación por defecto...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <style jsx global>{`
        .custom-avatar-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-avatar-marker > div {
          transition: transform 0.3s ease;
          cursor: pointer;
        }
        .custom-avatar-marker:hover > div {
          transform: scale(1.15);
        }
        .custom-avatar-marker img {
          pointer-events: none;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        className="rounded-lg"
      >
        <RecenterMap center={center} />
        
        {/* OpenStreetMap Tiles - Gratis y Open Source */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marcadores de otros usuarios */}
        {users.map((user) => {
          const userLat = user.lat || 34.054;
          const userLng = user.lng || -118.242;
          
          console.log('👤 Renderizando usuario en mapa:', {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lat: userLat,
            lng: userLng
          });
          
          return (
            <Marker
              key={user.uid}
              position={[userLat, userLng]}
              icon={createAvatarIcon(user.photoURL, user.displayName, false)}
            >
              <Popup maxWidth={280}>
                <Card className="border-0 shadow-none bg-gradient-to-br from-white to-sky-50/30 dark:from-slate-800 dark:to-sky-950/30 m-0">
                  <CardHeader className="flex flex-row items-center gap-4 p-3 pb-2">
                    <Avatar className="ring-2 ring-sky-400 shadow-lg h-12 w-12">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
                      <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white font-bold">
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-base bg-gradient-to-r from-sky-700 to-blue-600 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
                      {user.displayName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <Button asChild className="w-full bg-gradient-to-br from-sky-400 via-blue-500 to-sky-600 hover:from-sky-500 hover:via-blue-600 hover:to-sky-700 shadow-lg shadow-sky-400/40 hover:shadow-xl hover:shadow-sky-500/50 transition-all duration-300 hover:scale-105 text-sm h-9">
                      <Link href={`/chat/${user.uid}`}>💬 Enviar Mensaje</Link>
                    </Button>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          );
        })}

        {/* Marcadores de ubicaciones compartidas en chats */}
        {sharedLocations.map((location) => (
          <Marker
            key={`shared-${location.userId}-${location.timestamp}`}
            position={[location.latitude, location.longitude]}
            icon={createAvatarIcon(location.userPhoto, location.userName, false, false)}
          >
            <Popup maxWidth={280}>
              <Card className="border-0 shadow-none bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-800 dark:to-orange-950/30 m-0">
                <CardHeader className="flex flex-row items-center gap-4 p-3 pb-2">
                  <Avatar className="ring-2 ring-orange-400 shadow-lg h-12 w-12">
                    <AvatarImage src={location.userPhoto || ''} alt={location.userName} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white font-bold">
                      {location.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base bg-gradient-to-r from-orange-700 to-amber-600 dark:from-orange-300 dark:to-amber-400 bg-clip-text text-transparent">
                      {location.userName}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{getRelativeTime(location.timestamp)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Ubicación compartida en el chat
                  </p>
                  <Button asChild className="w-full bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 hover:from-orange-500 hover:via-amber-600 hover:to-orange-700 shadow-lg shadow-orange-400/40 hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 text-sm h-9">
                    <Link href={`/chat/${location.conversationId}`}>💬 Ver conversación</Link>
                  </Button>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}

        {/* Marcador de ubicación compartida temporal (desde chat) */}
        {sharedLocation && !isExpired() && (
          <Marker
            position={[sharedLocation.latitude, sharedLocation.longitude]}
            icon={createAvatarIcon(sharedLocation.senderPhotoURL, sharedLocation.senderName, false, false)}
          >
            <Popup maxWidth={280}>
              <Card className="border-0 shadow-none bg-gradient-to-br from-white to-sky-50/30 dark:from-slate-800 dark:to-sky-950/30 m-0">
                <CardHeader className="flex flex-row items-center gap-4 p-3 pb-2">
                  <Avatar className="ring-2 ring-sky-400 shadow-lg h-12 w-12">
                    <AvatarImage src={sharedLocation.senderPhotoURL || ''} alt={sharedLocation.senderName} />
                    <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white font-bold">
                      {sharedLocation.senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base bg-gradient-to-r from-sky-700 to-blue-600 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
                      {sharedLocation.senderName}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{getRelativeTime(sharedLocation.timestamp)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Ubicación compartida temporalmente
                  </p>
                  {sharedLocation.duration && (
                    <p className="text-xs text-sky-600 dark:text-sky-400 mb-2">
                      ⏱️ Visible por {sharedLocation.duration < 60 ? `${sharedLocation.duration} min` : `${sharedLocation.duration / 60} hora${sharedLocation.duration > 60 ? 's' : ''}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de ubicación en tiempo real (LIVE) */}
        {liveLocations.map((location) => {
          // No mostrar el marcador del usuario actual (ya se muestra abajo)
          if (location.userId === currentUser.uid) return null;
          
          const lastUpdatedDate = location.lastUpdated?.toDate?.();
          const timeAgo = lastUpdatedDate ? getRelativeTime(lastUpdatedDate.getTime()) : 'Ahora';
          
          return (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={createAvatarIcon(location.userPhoto, location.userName, false, true)}
            >
              <Popup maxWidth={280}>
                <Card className="border-0 shadow-none bg-gradient-to-br from-white to-green-50/30 dark:from-slate-800 dark:to-green-950/30 m-0 ring-2 ring-green-400/50">
                  <CardHeader className="flex flex-row items-center gap-4 p-3 pb-2">
                    <div className="relative">
                      <Avatar className="ring-2 ring-green-400 shadow-lg h-12 w-12">
                        <AvatarImage src={location.userPhoto || ''} alt={location.userName} />
                        <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white font-bold">
                          {location.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-lg animate-pulse">
                        LIVE
                      </div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base bg-gradient-to-r from-green-700 to-emerald-600 dark:from-green-300 dark:to-emerald-400 bg-clip-text text-transparent">
                        {location.userName}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Navigation className="h-3 w-3 text-green-500 animate-pulse" />
                        <span>Actualizado {timeAgo}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-2 flex items-center gap-1 font-medium">
                      <Navigation className="h-3 w-3 animate-pulse" />
                      Ubicación en tiempo real activa
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Esta persona está compartiendo su ubicación en tiempo real contigo. 
                      La posición se actualiza automáticamente.
                    </p>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          );
        })}

        {/* Marcador del usuario actual - más grande - siempre en su ubicación real */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={createAvatarIcon(currentUser.photoURL, currentUser.displayName, true, false)}
          >
            <Popup maxWidth={280}>
              <Card className="border-0 shadow-none bg-gradient-to-br from-white to-sky-50/30 dark:from-slate-800 dark:to-sky-950/30 m-0">
                <CardHeader className="flex flex-row items-center gap-4 p-3">
                  <div className="relative">
                    <Avatar className="ring-2 ring-blue-500 shadow-lg h-12 w-12">
                      <AvatarImage src={currentUser.photoURL || ''} alt={currentUser.displayName} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-sky-600 text-white font-bold">
                        {currentUser.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-blue-500 to-sky-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-lg">
                      Tú
                    </div>
                  </div>
                  <CardTitle className="text-base bg-gradient-to-r from-blue-700 to-sky-600 dark:from-blue-300 dark:to-sky-400 bg-clip-text text-transparent">
                    {currentUser.displayName}
                  </CardTitle>
                </CardHeader>
              </Card>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
