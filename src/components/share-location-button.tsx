"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Loader2, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareLocationButtonProps {
  onLocationShared: (location: { 
    latitude: number; 
    longitude: number; 
    timestamp: number;
    duration?: number; // Duración en minutos
  }) => void;
  disabled?: boolean;
}

export function ShareLocationButton({ onLocationShared, disabled }: ShareLocationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const durationOptions = [
    { label: '15 minutos', value: 15, icon: '⏱️' },
    { label: '1 hora', value: 60, icon: '🕐' },
    { label: '8 horas', value: 480, icon: '🕗' },
  ];

  const getLocation = () => {
    setIsGettingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(loc);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'No se pudo obtener tu ubicación';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Permiso de ubicación denegado. Por favor, permite el acceso a tu ubicación en la configuración del navegador.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Ubicación no disponible';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Tiempo de espera agotado';
        }
        setError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleOpen = () => {
    setIsOpen(true);
    getLocation();
  };

  const handleSend = () => {
    if (location && selectedDuration !== null) {
      onLocationShared({
        ...location,
        timestamp: Date.now(),
        duration: selectedDuration,
      });
      setIsOpen(false);
      setLocation(null);
      setError(null);
      setSelectedDuration(null);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setLocation(null);
    setError(null);
    setSelectedDuration(null);
  };

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          "h-9 w-9 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900/50",
          "text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300",
          "hover:scale-110 transition-all duration-300"
        )}
      >
        <MapPin className="h-5 w-5" />
        <span className="sr-only">Compartir ubicación</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-sky-500" />
              Compartir ubicación
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isGettingLocation ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 text-sky-500 animate-spin" />
                <p className="text-muted-foreground">Obteniendo tu ubicación...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border-2 border-red-200 dark:border-red-800">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={getLocation}
                  className="border-sky-200 dark:border-sky-800"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Intentar de nuevo
                </Button>
              </div>
            ) : location ? (
              <div className="space-y-4">
                <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-lg border-2 border-sky-200 dark:border-sky-800">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
                        Ubicación obtenida
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Lat: {location.latitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Lng: {location.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Selector de duración */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span>¿Por cuánto tiempo?</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {durationOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedDuration(option.value)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200",
                          "hover:scale-105 active:scale-95",
                          selectedDuration === option.value
                            ? "border-sky-500 bg-sky-100 dark:bg-sky-900/50 shadow-lg"
                            : "border-sky-200 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-600"
                        )}
                      >
                        <span className="text-2xl">{option.icon}</span>
                        <span className="text-xs font-medium text-center">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Tu contacto podrá ver tu ubicación temporal en el mapa durante el tiempo seleccionado.
                </p>
              </div>
            ) : null}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-sky-200 dark:border-sky-800"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSend}
                disabled={!location || isGettingLocation || selectedDuration === null}
                className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Compartir ubicación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
