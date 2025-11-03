# Guía: Service Worker para Seguimiento en Segundo Plano

## 🎯 Objetivo

Implementar un Service Worker que permita:
1. Recibir notificaciones cuando el navegador está cerrado
2. Actualizar ubicación en tiempo real automáticamente
3. Sincronización en segundo plano

## ⚠️ Limitaciones Importantes

### Navegadores de Escritorio
- ✅ Chrome/Edge: Soporte completo con navegador cerrado
- ✅ Firefox: Soporte con navegador abierto
- ❌ Safari: Sin soporte para Background Sync

### Navegadores Móviles
- ⚠️ Android Chrome: Funciona pero puede ser limitado por el sistema
- ❌ iOS Safari: **NO soporta Service Workers en segundo plano**
- ❌ iOS Chrome: Usa motor Safari, mismas limitaciones

**NOTA IMPORTANTE**: En iOS, las notificaciones y el seguimiento en segundo plano solo funcionan con aplicaciones nativas. No es posible con aplicaciones web.

## 📋 Plan de Implementación

### Fase 1: Configuración Básica del Service Worker

#### 1.1 Crear el Service Worker
Archivo: `public/sw.js`

```javascript
// Service Worker para GeoChat
const CACHE_NAME = 'geochat-v1';
const STATIC_CACHE = [
  '/',
  '/map',
  '/chat',
  '/profile',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de caché: Network First
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
```

#### 1.2 Registrar el Service Worker
Archivo: `src/app/layout.tsx` o crear `src/components/service-worker-register.tsx`

```typescript
'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ Error al registrar SW:', error);
        });
    }
  }, []);

  return null;
}
```

### Fase 2: Notificaciones Push

#### 2.1 Agregar Push Notifications al SW
Añadir al `public/sw.js`:

```javascript
// Escuchar notificaciones push
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Nuevo mensaje en GeoChat',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag || 'default',
    data: data,
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'GeoChat', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});
```

#### 2.2 Suscribirse a Push Notifications
Crear: `src/hooks/use-push-subscription.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = 'TU_CLAVE_PUBLICA_VAPID'; // Generar con web-push

export function usePushSubscription() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkSupport = () => {
      return 'serviceWorker' in navigator && 'PushManager' in window;
    };
    setIsSupported(checkSupport());
  }, []);

  const subscribe = async () => {
    if (!isSupported) {
      console.error('Push notifications no soportadas');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      setSubscription(sub);
      
      // Enviar suscripción al servidor (Firebase)
      await sendSubscriptionToServer(sub);
      
      return sub;
    } catch (error) {
      console.error('Error al suscribirse:', error);
    }
  };

  const unsubscribe = async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
    }
  };

  return { subscription, isSupported, subscribe, unsubscribe };
}

// Utilidad para convertir VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Enviar suscripción a Firestore
async function sendSubscriptionToServer(subscription: PushSubscription) {
  // Guardar en Firestore bajo users/{uid}/pushSubscriptions
  const { getFirestore, doc, setDoc } = await import('firebase/firestore');
  const firestore = getFirestore();
  
  // Aquí guardarías la suscripción asociada al usuario
  console.log('Suscripción:', JSON.stringify(subscription));
}
```

### Fase 3: Background Sync para Ubicación

#### 3.1 Agregar Background Sync al SW
Añadir al `public/sw.js`:

```javascript
// Background Sync para ubicación
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocation());
  }
});

async function syncLocation() {
  try {
    // Obtener ubicación
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
    
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: Date.now()
    };
    
    // Enviar a Firebase (requerirá endpoint en tu backend)
    await fetch('/api/update-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(location)
    });
    
    console.log('✅ Ubicación sincronizada:', location);
  } catch (error) {
    console.error('❌ Error sincronizando ubicación:', error);
    throw error; // Reintentar más tarde
  }
}
```

#### 3.2 Registrar Sync desde la App
Crear: `src/hooks/use-background-location-sync.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

export function useBackgroundLocationSync() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        setIsSupported(true);
      }
    };
    checkSupport();
  }, []);

  const registerSync = async () => {
    if (!isSupported) {
      console.warn('Background Sync no soportado');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-location');
      setIsRegistered(true);
      console.log('✅ Background sync registrado');
      return true;
    } catch (error) {
      console.error('❌ Error registrando sync:', error);
      return false;
    }
  };

  // Registrar sync periódico (Chrome 80+)
  const registerPeriodicSync = async (intervalMinutes = 15) => {
    if (!('periodicSync' in ServiceWorkerRegistration.prototype)) {
      console.warn('Periodic Sync no soportado');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).periodicSync.register('location-update', {
        minInterval: intervalMinutes * 60 * 1000 // minutos a milisegundos
      });
      console.log(`✅ Sync periódico cada ${intervalMinutes} minutos`);
      return true;
    } catch (error) {
      console.error('❌ Error en periodic sync:', error);
      return false;
    }
  };

  return { isRegistered, isSupported, registerSync, registerPeriodicSync };
}
```

#### 3.3 Manejar Periodic Sync en el SW
Añadir al `public/sw.js`:

```javascript
// Periodic Background Sync (solo Chrome)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'location-update') {
    event.waitUntil(syncLocation());
  }
});
```

### Fase 4: API Backend para Ubicaciones

#### 4.1 Crear API Route en Next.js
Crear: `src/app/api/update-location/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Inicializar Firebase Admin (solo primera vez)
if (!getApps().length) {
  initializeApp({
    // Tu configuración de Firebase Admin
  });
}

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude, timestamp, userId } = await request.json();
    
    if (!latitude || !longitude || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const firestore = getFirestore();
    
    // Actualizar ubicación del usuario
    await firestore.collection('users').doc(userId).update({
      currentLocation: {
        latitude,
        longitude,
        timestamp
      },
      lastSeen: timestamp
    });
    
    // Notificar a usuarios que están compartiendo ubicación
    const userDoc = await firestore.collection('users').doc(userId).get();
    const locationSharingWith = userDoc.data()?.locationSharingWith || [];
    
    // Aquí podrías enviar notificaciones push a esos usuarios
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Fase 5: Manifest.json

#### 5.1 Crear/Actualizar manifest.json
Archivo: `public/manifest.json`

```json
{
  "name": "GeoChat",
  "short_name": "GeoChat",
  "description": "Chat con compartir ubicación en tiempo real",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0ea5e9",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "permissions": [
    "notifications",
    "geolocation"
  ],
  "categories": [
    "social",
    "utilities"
  ]
}
```

#### 5.2 Agregar al Layout
En `src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  manifest: '/manifest.json',
  // ... otras configuraciones
};
```

## 🔐 Generar VAPID Keys

```bash
# Instalar web-push
npm install web-push --save-dev

# Generar keys
npx web-push generate-vapid-keys
```

Guardar las claves en variables de entorno:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica
VAPID_PRIVATE_KEY=tu_clave_privada
```

## 📱 Alternativa para iOS: Progressive Web App

Para iOS, la única alternativa es convertir la app en PWA y promover la instalación:

1. Usuario agrega app a pantalla de inicio
2. App se ejecuta en modo standalone
3. Permisos de ubicación persisten

**PERO**: Aún no habrá seguimiento cuando la app está cerrada.

## 🚀 Orden de Implementación Recomendado

1. ✅ **Fase 1**: Configurar Service Worker básico (1-2 horas)
2. ✅ **Fase 5**: Crear manifest.json (30 min)
3. ✅ **Fase 2**: Implementar Push Notifications (2-3 horas)
4. ⚠️ **Fase 4**: Crear API backend (2-3 horas)
5. ⚠️ **Fase 3**: Background Sync (2-4 horas)

**Tiempo total estimado**: 8-12 horas

## 🔍 Testing

### Probar Service Worker
```javascript
// En DevTools Console
navigator.serviceWorker.ready.then(registration => {
  console.log('SW activo:', registration.active);
});
```

### Probar Background Sync
```javascript
navigator.serviceWorker.ready.then(registration => {
  return registration.sync.register('sync-location');
}).then(() => {
  console.log('Sync registrado');
});
```

### Simular Push Notification
En DevTools > Application > Service Workers:
- Click en "Push" junto al SW activo
- O usar: https://web-push-codelab.glitch.me/

## 📚 Recursos Adicionales

- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Background Sync - web.dev](https://web.dev/periodic-background-sync/)
- [Push Notifications - Firebase](https://firebase.google.com/docs/cloud-messaging/js/client)
- [PWA iOS Limitations](https://firt.dev/notes/pwa-ios/)

## ⚠️ Consideraciones Finales

1. **Privacy**: Siempre pedir consentimiento explícito para seguimiento de ubicación
2. **Batería**: El seguimiento constante consume mucha batería
3. **Datos**: Usar throttling para no saturar Firestore
4. **iOS**: Informar a usuarios de iOS sobre las limitaciones
5. **Testing**: Probar exhaustivamente en diferentes navegadores

## 🎯 Recomendación Final

Para máxima compatibilidad:
1. Implementar Service Worker básico ✅
2. Push notifications para escritorio ✅
3. **NO** implementar seguimiento constante (privacidad + batería)
4. En su lugar: **Actualizar ubicación solo cuando el usuario abre el mapa**
5. Para iOS: Promover instalación como PWA

Esto da mejor experiencia de usuario y respeta privacidad/batería.
