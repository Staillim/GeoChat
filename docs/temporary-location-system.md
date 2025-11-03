# Sistema de Ubicación Temporal - GeoChat

## 🎯 Funcionalidades Implementadas

### 1. **Duración de Ubicación Compartida**
Al compartir una ubicación desde el chat, el usuario puede elegir por cuánto tiempo estará visible:
- ⏱️ **15 minutos**
- 🕐 **1 hora**
- 🕗 **8 horas**

#### Cómo funciona:
1. Usuario hace click en el botón de compartir ubicación (📍)
2. Sistema obtiene ubicación actual con GPS
3. Se muestra un selector visual con 3 opciones de duración
4. Al enviar, la ubicación se guarda con timestamp de expiración

### 2. **Click en Ubicación Compartida**
Cuando un usuario recibe una ubicación compartida en el chat:

#### Comportamiento al hacer click:
1. **En el mini mapa**: Abre el mapa completo centrado en esa ubicación
2. **Botón "Ver en mapa"**: Abre el mapa completo centrado en esa ubicación
3. **Botón "Abrir externo"**: Abre OpenStreetMap en nueva pestaña

#### Marcador en el mapa:
- ✅ Usa la **foto de perfil** del remitente como marcador
- ✅ Muestra nombre del remitente
- ✅ Muestra tiempo transcurrido
- ✅ Muestra duración seleccionada
- ✅ Card con información del remitente

### 3. **Persistencia Temporal**
La ubicación compartida solo permanece visible mientras:

#### ✅ SE MUESTRA:
- La duración no ha expirado
- El usuario está en el mapa (después de hacer click)
- La sesión de mapa está activa

#### ❌ SE OCULTA:
- Cuando sales del mapa (navegar a otra página)
- Cuando la duración expira
- Cuando vuelves a entrar al mapa desde otra sección

### 4. **Diferencia con Compartir Ubicación en Tiempo Real**
Hay DOS sistemas diferentes de ubicación:

#### 📍 Ubicación Temporal (implementado ahora):
- Se envía como mensaje en el chat
- Tiene duración limitada (15m, 1h, 8h)
- Solo visible cuando haces click desde el chat
- Se limpia al salir del mapa
- NO requiere sincronización activa

#### 🔴 Ubicación en Tiempo Real (sistema existente):
- Requiere aceptar solicitud de compartir ubicación
- Siempre visible en el mapa mientras esté activa la sesión
- Se mantiene hasta que se cancele manualmente
- Actualización continua de posición
- Persistente entre navegaciones al mapa

## 📁 Archivos Modificados

### Nuevos Archivos
1. **`src/hooks/use-shared-location-store.tsx`**
   - Context Provider para ubicación compartida temporal
   - Estado global accesible desde cualquier componente
   - Funciones: setSharedLocation, clearSharedLocation, isExpired

### Archivos Modificados
1. **`src/components/share-location-button.tsx`**
   - Agregado selector de duración (15m, 1h, 8h)
   - UI con 3 botones visuales con emojis
   - Validación: no permite enviar sin seleccionar duración
   - Pasa duración al mensaje

2. **`src/firebase/firestore/use-send-message.tsx`**
   - Interface MessageData extendida con:
     - `duration?: number` en location
     - `senderName?: string`
     - `senderPhotoURL?: string`
   - Guarda datos del remitente en el mensaje

3. **`src/firebase/firestore/use-messages.tsx`**
   - Interface FirestoreMessage extendida con:
     - `senderPhotoURL?: string`
     - `duration?: number` en location

4. **`src/app/(app)/chat/[[...slug]]/layout.tsx`**
   - Pasa senderName y senderPhotoURL al enviar mensajes
   - Actualizado para todas las funciones: texto, imagen, ubicación

5. **`src/app/(app)/chat/[[...slug]]/page.tsx`**
   - Agregada función `handleLocationClick(message)`
   - Guarda ubicación en store al hacer click
   - Navega al mapa automáticamente
   - Muestra duración en el mensaje
   - Importa useSharedLocation hook

6. **`src/app/(app)/layout.tsx`**
   - Envuelto todo en `<SharedLocationProvider>`
   - Hace el estado accesible globalmente

7. **`src/components/map-component.tsx`**
   - Importa y usa `useSharedLocation` hook
   - Limpia ubicación compartida al desmontar (useEffect cleanup)
   - Centra mapa en ubicación compartida si existe
   - Renderiza marcador con foto de perfil del remitente
   - Verifica expiración con `isExpired()`
   - Marcador del usuario actual siempre en su ubicación real

## 🎨 UI/UX Implementada

### Selector de Duración
```
┌─────────────────────────────────────────┐
│  ¿Por cuánto tiempo?                    │
├─────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ ⏱️   │  │ 🕐   │  │ 🕗   │         │
│  │ 15m  │  │ 1h   │  │ 8h   │         │
│  └──────┘  └──────┘  └──────┘         │
└─────────────────────────────────────────┘
```

### Mensaje de Ubicación en Chat
```
┌─────────────────────────────────────────┐
│  📍 Ubicación compartida                 │
│  [Mini Mapa Interactivo 128x128]        │
│  12.345678, -98.765432                  │
│  ⏱️ Visible por 1 hora                  │
│  ┌────────────┐  ┌────────────┐        │
│  │ Ver mapa   │  │ Abrir ext. │        │
│  └────────────┘  └────────────┘        │
└─────────────────────────────────────────┘
```

### Marcador en Mapa
```
┌─────────────────────────────────────────┐
│  [Foto Perfil Circular]  Juan Pérez     │
│                         🕐 Hace 5 min   │
├─────────────────────────────────────────┤
│  📍 Ubicación compartida temporalmente   │
│  ⏱️ Visible por 1 hora                  │
└─────────────────────────────────────────┘
```

## 🔄 Flujo Completo

### Usuario A comparte ubicación:
1. Abre chat con Usuario B
2. Click en botón compartir ubicación (📍)
3. GPS obtiene ubicación actual
4. Selecciona duración: 1 hora
5. Click "Compartir ubicación"
6. Mensaje enviado con ubicación + duración + foto + nombre

### Usuario B recibe y visualiza:
1. Ve mensaje con mini mapa en el chat
2. Ve duración: "⏱️ Visible por 1 hora"
3. Hace click en mini mapa o "Ver en mapa"
4. Sistema guarda ubicación temporal en store
5. Navega a /map
6. Mapa se centra en ubicación de Usuario A
7. Ve marcador con foto de Usuario A
8. Ve card con info y duración restante

### Al salir del mapa:
1. Usuario B navega a /chat o /profile
2. Hook limpia ubicación compartida (cleanup)
3. Si vuelve a /map, verá su propia ubicación
4. Para ver ubicación de A nuevamente, debe hacer click otra vez

### Cuando expira:
1. Sistema verifica timestamp vs duración
2. Si `Date.now() > timestamp + (duration * 60 * 1000)`
3. Marcador no se muestra en el mapa
4. Mensaje sigue visible en el chat (histórico)

## 💡 Ventajas del Sistema

### ✅ Privacidad
- Ubicación solo visible por tiempo limitado
- No queda compartida permanentemente
- Usuario decide cuánto tiempo compartir

### ✅ Control
- Se limpia automáticamente al salir del mapa
- No persiste entre sesiones de navegación
- Claro para el usuario cuándo expira

### ✅ Contexto
- Muestra foto y nombre del remitente
- Mantiene historial en chat
- Diferenciado de ubicación en tiempo real

### ✅ UX
- Fácil de usar: solo 3 opciones
- Visual: emojis y colores
- Interactivo: click directo en mini mapa
- Feedback: muestra duración restante

## 🔧 Configuración Técnica

### Expiración
```typescript
// Cálculo de expiración
const expiresAt = timestamp + (duration * 60 * 1000);

// Verificación
const isExpired = () => {
  if (!location || !location.expiresAt) return false;
  return Date.now() > location.expiresAt;
};
```

### Cleanup Automático
```typescript
// En MapComponent
useEffect(() => {
  return () => {
    clearSharedLocation(); // Limpia al desmontar
  };
}, [clearSharedLocation]);
```

### Centrado Inteligente
```typescript
// Prioridad de centrado:
let center: [number, number];
if (sharedLocation && !isExpired()) {
  center = [sharedLocation.latitude, sharedLocation.longitude];
} else if (userLocation) {
  center = userLocation;
} else {
  center = [defaultLat, defaultLng];
}
```

## 📊 Datos Guardados

### En Firestore (mensaje):
```typescript
{
  senderId: "uid123",
  senderName: "Juan Pérez",
  senderPhotoURL: "https://...",
  type: "location",
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    timestamp: 1699123456789,
    duration: 60 // minutos
  },
  text: "📍 Ubicación compartida",
  timestamp: Firestore.Timestamp,
  read: false
}
```

### En Store (temporal):
```typescript
{
  latitude: 40.7128,
  longitude: -74.0060,
  timestamp: 1699123456789,
  duration: 60,
  senderName: "Juan Pérez",
  senderPhotoURL: "https://...",
  expiresAt: 1699127056789 // calculado
}
```

## 🎯 Estado Final

✅ Selector de duración funcional
✅ Click en ubicación abre mapa centrado
✅ Marcador usa foto de perfil del remitente
✅ Limpieza automática al salir del mapa
✅ Verificación de expiración
✅ UI completa con duraciones
✅ Datos del remitente guardados
✅ Sistema completamente funcional

## 🚀 Testing

### Probar selector de duración:
1. Ir a un chat
2. Click en botón compartir ubicación
3. Verificar que aparecen 3 opciones
4. Botón "Compartir" deshabilitado sin selección
5. Seleccionar duración y enviar

### Probar visualización en mapa:
1. Recibir ubicación compartida
2. Click en mini mapa
3. Verificar que mapa se centra en ubicación correcta
4. Verificar que marcador usa foto de perfil
5. Verificar duración en card del marcador

### Probar limpieza:
1. Hacer click en ubicación
2. Ir al mapa
3. Volver a chat
4. Volver al mapa
5. Verificar que marcador ya no aparece
6. Hacer click otra vez para verlo de nuevo

### Probar expiración:
1. Compartir ubicación con 15 minutos
2. Esperar 15 minutos
3. Verificar que marcador no aparece
4. (Acelerar cambiando timestamp en el código para testing)

## 📝 Notas Importantes

1. **No confundir con ubicación en tiempo real**: Son dos sistemas separados
2. **Limpieza obligatoria**: Siempre se limpia al salir del mapa
3. **Solo al hacer click**: No se muestra automáticamente
4. **Historial preservado**: El mensaje queda en el chat siempre
5. **Foto del remitente**: Usa senderPhotoURL, no la foto del receptor

¡Sistema de ubicación temporal completamente implementado! 🎉
