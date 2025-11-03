# Sistema de Notificaciones de GeoChat

## 📋 Resumen

Sistema completo de notificaciones del navegador implementado para alertar a los usuarios sobre eventos importantes en tiempo real.

## ✅ Funcionalidades Implementadas

### 1. **Infraestructura Base**
- ✅ Hook `useNotificationPermission` para gestionar permisos
- ✅ Función `showNotification` con cierre automático después de 5 segundos
- ✅ Plantillas predefinidas para 8 tipos de notificaciones
- ✅ Verificación de soporte del navegador

### 2. **Componente de Permisos**
- ✅ Card de solicitud de permisos (`NotificationPermissionCard`)
- ✅ Sistema de descarte persistente con localStorage
- ✅ Auto-ocultación cuando se conceden permisos
- ✅ Lista de beneficios visuales

### 3. **Notificaciones de Mensajes**
- ✅ Detección automática de mensajes nuevos
- ✅ Notificaciones diferenciadas por tipo:
  - Mensajes de texto con preview
  - Imágenes compartidas
  - Ubicaciones compartidas
- ✅ Solo notifica cuando la ventana está en segundo plano
- ✅ Filtra mensajes del usuario actual

### 4. **Notificaciones de Compartir Ubicación**
- ✅ Notificación al enviar solicitud de ubicación
- ✅ Notificación al aceptar compartir ubicación
- ✅ Plantillas personalizadas con nombres de usuario

## 📁 Archivos Modificados

### Nuevos Archivos
1. **`src/hooks/use-notifications.tsx`**
   - Hook para gestionar permisos
   - Función para mostrar notificaciones
   - Plantillas de notificaciones

2. **`src/components/notification-permission-card.tsx`**
   - Componente UI para solicitar permisos
   - Gestión de descarte persistente

### Archivos Modificados
1. **`src/firebase/firestore/use-messages.tsx`**
   - Agregado detection de mensajes nuevos
   - Integración con sistema de notificaciones
   - Filtrado por tipo de mensaje

2. **`src/app/(app)/chat/[[...slug]]/page.tsx`**
   - Pasando `currentUserId` al hook useMessages

3. **`src/components/user-profile-dialog.tsx`**
   - Notificación al solicitar compartir ubicación

4. **`src/components/location-sharing-requests.tsx`**
   - Notificación al aceptar solicitud

5. **`src/app/(app)/profile/page.tsx`**
   - Agregado NotificationPermissionCard

## 🎯 Tipos de Notificaciones

```typescript
NotificationTypes = {
  newMessage(sender, preview): Mensaje de texto
  newImage(sender): Imagen compartida
  newLocation(sender): Ubicación compartida
  chatRequestSent(recipient): Solicitud enviada
  chatRequestReceived(sender): Solicitud recibida
  chatRequestAccepted(accepter): Solicitud aceptada
  locationSharingRequested(recipient): Solicitud de ubicación enviada
  locationSharingAccepted(sender): Solicitud de ubicación aceptada
}
```

## 🔧 Uso del Sistema

### Solicitar Permisos
```typescript
import { useNotificationPermission } from '@/hooks/use-notifications';

const { permission, isGranted, requestPermission } = useNotificationPermission();

// Verificar si está concedido
if (isGranted) {
  // Mostrar notificaciones
}

// Solicitar permisos
await requestPermission();
```

### Mostrar Notificación
```typescript
import { showNotification, NotificationTypes } from '@/hooks/use-notifications';

// Con plantilla
showNotification(
  NotificationTypes.newMessage(sender, preview).title,
  NotificationTypes.newMessage(sender, preview)
);

// Personalizada
showNotification("Título", {
  body: "Descripción",
  icon: "/icon.png",
  badge: "/badge.png"
});
```

## 🎨 Características UX

1. **Inteligencia Contextual**
   - Solo notifica cuando la ventana está en segundo plano
   - No notifica sobre propios mensajes
   - Preview de mensajes largos (máx 50 caracteres)

2. **Auto-Gestión**
   - Cierre automático después de 5 segundos
   - Ícono de la app en todas las notificaciones
   - Sistema de descarte persistente

3. **Tipos Visuales**
   - 📱 Mensajes de texto con preview
   - 📷 Imágenes con emoji de cámara
   - 📍 Ubicaciones con emoji de pin
   - 🔔 Solicitudes con nombres personalizados

## 📊 Estado del Proyecto

### Completado ✅
- [x] Infraestructura de notificaciones
- [x] Componente de solicitud de permisos
- [x] Notificaciones de mensajes (texto/imagen/ubicación)
- [x] Notificaciones de solicitudes de ubicación
- [x] Integración en todos los componentes relevantes

### Pendiente 🚧
- [ ] Service Worker para notificaciones en segundo plano
- [ ] Seguimiento de ubicación en tiempo real continuo
- [ ] Notificaciones de solicitudes de chat
- [ ] Notificaciones push desde servidor
- [ ] Historial de notificaciones

## 🚀 Próximos Pasos

### 1. Service Worker
Implementar Service Worker para:
- Notificaciones cuando el navegador está cerrado
- Actualización de ubicación en segundo plano
- Cache de recursos

### 2. Notificaciones de Chat
Agregar detección de:
- Nuevas solicitudes de chat recibidas
- Solicitudes aceptadas

### 3. Configuración de Usuario
Permitir al usuario:
- Activar/desactivar tipos específicos de notificaciones
- Configurar sonidos personalizados
- Establecer horarios de no molestar

## 🔍 Debugging

### Verificar Permisos
```javascript
console.log('Permission:', Notification.permission);
// "granted" | "denied" | "default"
```

### Verificar Soporte
```javascript
console.log('Supports notifications:', 'Notification' in window);
```

### Probar Notificación Manual
```javascript
showNotification("Test", {
  body: "Esta es una notificación de prueba",
  icon: "/icon.png"
});
```

## 📝 Notas Técnicas

1. **Compatibilidad del Navegador**
   - Chrome/Edge: ✅ Soporte completo
   - Firefox: ✅ Soporte completo
   - Safari: ⚠️ Requiere interacción del usuario
   - Mobile: ⚠️ Limitado en iOS

2. **Permisos**
   - Se deben solicitar mediante interacción del usuario
   - No se puede solicitar automáticamente
   - Una vez denegado, requiere cambio manual en configuración

3. **Límites**
   - Máximo ~50 notificaciones simultáneas
   - Auto-cierre después de 5 segundos implementado
   - Sistema operativo puede agrupar notificaciones

4. **Performance**
   - Detección de mensajes usa `useEffect` optimizado
   - `useRef` para evitar re-renders innecesarios
   - Filtrado eficiente de mensajes propios

## 🎉 Resultado Final

El sistema de notificaciones está completamente funcional y listo para uso en producción. Los usuarios ahora recibirán alertas en tiempo real sobre:
- Mensajes nuevos (diferenciados por tipo)
- Solicitudes de compartir ubicación
- Estado de las solicitudes

La experiencia de usuario es fluida y no intrusiva, con notificaciones que solo aparecen cuando el usuario no está activamente viendo la aplicación.
