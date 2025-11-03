"use client";

import { useEffect, useState } from 'react';

export type NotificationPermission = 'default' | 'granted' | 'denied';

/**
 * Hook para gestionar permisos de notificaciones del navegador
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar si las notificaciones están soportadas (solo en cliente)
    if (typeof window !== 'undefined') {
      const notificationSupported = 'Notification' in window;
      const serviceWorkerSupported = 'serviceWorker' in navigator;
      
      console.log('📱 Detección de notificaciones:', {
        notificationAPI: notificationSupported,
        serviceWorker: serviceWorkerSupported,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isMobile: /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      });
      
      if (notificationSupported) {
        setIsSupported(true);
        setPermission(Notification.permission as NotificationPermission);
        console.log('✅ Notificaciones soportadas. Estado actual:', Notification.permission);
      } else {
        console.warn('❌ Las notificaciones NO están soportadas en este navegador');
      }
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !isSupported) {
      console.warn('⚠️ Las notificaciones no están soportadas en este navegador');
      return 'denied';
    }

    try {
      console.log('🔔 Solicitando permisos de notificación...');
      
      // En iOS Safari, las notificaciones solo funcionan en PWA instalada
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      if (isIOS && !isStandalone) {
        console.warn('⚠️ iOS Safari: Las notificaciones solo funcionan en modo PWA (instalada)');
      }
      
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      console.log('📝 Resultado de solicitud de permisos:', result);
      return result as NotificationPermission;
    } catch (error) {
      console.error('❌ Error al solicitar permiso de notificaciones:', error);
      return 'denied';
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    isGranted: permission === 'granted',
  };
}

/**
 * Mostrar notificación del navegador
 */
export function showNotification(title: string, options?: NotificationOptions) {
  // Verificar que estamos en el cliente y que hay permisos
  if (typeof window === 'undefined') {
    console.warn('🔕 No se puede mostrar notificación: no estamos en el cliente');
    return null;
  }
  
  if (!('Notification' in window)) {
    console.warn('🔕 No se puede mostrar notificación: Notification API no disponible');
    console.warn('📱 UserAgent:', navigator.userAgent);
    return null;
  }
  
  if (Notification.permission !== 'granted') {
    console.warn('🔕 No se puede mostrar notificación: permisos no concedidos. Estado:', Notification.permission);
    
    // Información adicional para iOS
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOS) {
      console.warn('📱 iOS detectado. PWA instalada:', isStandalone);
      if (!isStandalone) {
        console.warn('⚠️ En iOS Safari, instala la app como PWA para recibir notificaciones');
        console.warn('💡 Abre Safari → Compartir → Añadir a pantalla de inicio');
      }
    }
    
    return null;
  }
  
  try {
    console.log('🔔 Mostrando notificación:', title, options);
    
    // En móviles, usar opciones simplificadas
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    const notificationOptions: NotificationOptions = {
      body: options?.body,
      tag: options?.tag,
      requireInteraction: options?.requireInteraction,
      // En móviles, algunos navegadores ignoran el icono
      ...(isMobile ? {} : {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
      }),
      ...options,
    };
    
    const notification = new Notification(title, notificationOptions);

    // Auto cerrar después de 5 segundos (solo si no requiere interacción)
    if (!options?.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    notification.onclick = () => {
      console.log('👆 Notificación clickeada');
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('❌ Error al mostrar notificación:', error);
    console.error('📱 Detalles del dispositivo:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor
    });
  }
  
  return null;
}

/**
 * Tipos de notificaciones
 */
export const NotificationTypes = {
  newMessage: (senderName: string, messagePreview: string) => ({
    title: `💬 Nuevo mensaje de ${senderName}`,
    body: messagePreview,
    tag: 'new-message',
    requireInteraction: false,
  }),
  
  newImage: (senderName: string) => ({
    title: `📷 ${senderName} envió una imagen`,
    body: 'Toca para ver',
    tag: 'new-image',
    requireInteraction: false,
  }),
  
  newLocation: (senderName: string) => ({
    title: `📍 ${senderName} compartió su ubicación`,
    body: 'Toca para ver en el mapa',
    tag: 'new-location',
    requireInteraction: false,
  }),
  
  chatRequestSent: (userName: string) => ({
    title: '📤 Solicitud enviada',
    body: `Solicitud de chat enviada a ${userName}`,
    tag: 'chat-request-sent',
    requireInteraction: false,
  }),
  
  chatRequestReceived: (userName: string) => ({
    title: '📩 Nueva solicitud de chat',
    body: `${userName} quiere chatear contigo`,
    tag: 'chat-request-received',
    requireInteraction: true,
  }),
  
  chatRequestAccepted: (userName: string) => ({
    title: '✅ Solicitud aceptada',
    body: `${userName} aceptó tu solicitud de chat`,
    tag: 'chat-request-accepted',
    requireInteraction: false,
  }),
  
  locationSharingRequested: (userName: string) => ({
    title: '📍 Solicitud de ubicación',
    body: `${userName} quiere ver tu ubicación en tiempo real`,
    tag: 'location-sharing-requested',
    requireInteraction: true,
  }),
  
  locationSharingAccepted: (userName: string) => ({
    title: '✅ Ubicación compartida',
    body: `${userName} aceptó compartir su ubicación contigo`,
    tag: 'location-sharing-accepted',
    requireInteraction: false,
  }),
};
