"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { useNotificationPermission } from '@/hooks/use-notifications';

export function NotificationBanner() {
  const { permission, isSupported, requestPermission, isGranted } = useNotificationPermission();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Verificar si ya se solicitó antes (localStorage)
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      // Detectar iOS y modo PWA
      const iOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsIOS(iOS);
      setIsStandalone(standalone);
      
      const dismissed = localStorage.getItem('notification-banner-dismissed');
      const lastDismissed = localStorage.getItem('notification-banner-last-dismissed');
      
      // Si se descartó hace menos de 24 horas, no mostrar
      if (dismissed === 'true' && lastDismissed) {
        const hoursSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) {
          setIsDismissed(true);
          return;
        }
      }
      
      // Mostrar el banner después de 2 segundos (para no ser intrusivo)
      setTimeout(() => {
        setIsVisible(true);
      }, 2000);
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    await requestPermission();
    setIsRequesting(false);
    
    // Si se concedió el permiso, ocultar el banner
    if (typeof window !== 'undefined') {
      const newPermission = Notification.permission;
      if (newPermission === 'granted') {
        setIsVisible(false);
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-banner-dismissed', 'true');
      localStorage.setItem('notification-banner-last-dismissed', Date.now().toString());
    }
  };

  // No mostrar si:
  // - No está soportado
  // - Ya está granted
  // - El usuario lo descartó
  // - Está denied
  // - No es visible aún
  if (!isSupported || isGranted || isDismissed || permission === 'denied' || !isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up"
      style={{
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg shadow-2xl border-2 border-sky-300 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Bell className="h-6 w-6 animate-pulse" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1">
              🔔 Activa las Notificaciones
            </h3>
            {isIOS && !isStandalone ? (
              <>
                <p className="text-sm text-sky-50 mb-2">
                  📱 <strong>Para iOS:</strong> Instala la app primero
                </p>
                <p className="text-xs text-sky-100 mb-3">
                  1. Toca el botón <strong>Compartir</strong> en Safari<br/>
                  2. Selecciona <strong>"Añadir a pantalla de inicio"</strong><br/>
                  3. Abre la app desde tu pantalla de inicio<br/>
                  4. Las notificaciones estarán disponibles
                </p>
              </>
            ) : (
              <p className="text-sm text-sky-50 mb-3">
                Recibe alertas instantáneas de mensajes nuevos, solicitudes de chat y ubicaciones compartidas
              </p>
            )}
            
            <div className="flex gap-2">
              {(!isIOS || isStandalone) && (
                <Button
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="bg-white text-sky-600 hover:bg-sky-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  size="sm"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {isRequesting ? 'Solicitando...' : 'Activar Ahora'}
                </Button>
              )}
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="text-white hover:bg-white/20"
                size="sm"
              >
                {isIOS && !isStandalone ? 'Entendido' : 'Ahora no'}
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
