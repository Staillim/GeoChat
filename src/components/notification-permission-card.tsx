"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { useNotificationPermission } from '@/hooks/use-notifications';

export function NotificationPermissionCard() {
  const { permission, isSupported, requestPermission, isGranted } = useNotificationPermission();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Verificar si ya se solicitó antes (localStorage)
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('notification-permission-dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    await requestPermission();
    setIsRequesting(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-permission-dismissed', 'true');
    }
  };

  // No mostrar si:
  // - No está soportado
  // - Ya está granted
  // - El usuario lo descartó
  // - Está denied
  if (!isSupported || isGranted || isDismissed || permission === 'denied') {
    return null;
  }

  return (
    <Card className="border-2 border-sky-200 dark:border-sky-800 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 shimmer-effect">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sky-700 dark:text-sky-300">
                Activa las Notificaciones
              </CardTitle>
              <CardDescription className="mt-1">
                Recibe alertas de nuevos mensajes y solicitudes
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            Notificaciones de mensajes nuevos
          </p>
          <p className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            Alertas de solicitudes de chat
          </p>
          <p className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            Solicitudes de ubicación compartida
          </p>
        </div>
        
        <Button
          onClick={handleRequestPermission}
          disabled={isRequesting}
          className="w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Bell className="h-4 w-4 mr-2" />
          {isRequesting ? 'Solicitando...' : 'Activar Notificaciones'}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Puedes desactivarlas en cualquier momento desde la configuración del navegador
        </p>
      </CardContent>
    </Card>
  );
}
