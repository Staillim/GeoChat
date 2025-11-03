"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

// Importar MapContainer dinámicamente para evitar SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

interface LocationPreviewMapProps {
  latitude: number;
  longitude: number;
  onClick?: () => void;
}

export function LocationPreviewMap({ latitude, longitude, onClick }: LocationPreviewMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Importar Leaflet dinámicamente
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      
      // Configurar iconos
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    });
  }, []);

  if (!isClient || !L) {
    return (
      <div className="w-full h-32 bg-sky-100 dark:bg-sky-950/30 rounded-lg flex items-center justify-center border-2 border-sky-200 dark:border-sky-800">
        <MapPin className="h-8 w-8 text-sky-500 animate-pulse" />
      </div>
    );
  }

  const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div 
      className="w-full h-32 rounded-lg overflow-hidden border-2 border-sky-200 dark:border-sky-800 shadow-lg cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300 hover:shadow-xl relative group"
      onClick={onClick}
    >
      {/* Overlay con ícono de click */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 z-[1000] flex items-center justify-center pointer-events-none">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-slate-800/90 rounded-full p-3 shadow-lg">
          <MapPin className="h-6 w-6 text-sky-600 dark:text-sky-400" />
        </div>
      </div>

      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%', cursor: 'pointer' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={customIcon} />
      </MapContainer>
    </div>
  );
}
