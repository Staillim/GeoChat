# GeoChat

Una aplicación de chat en tiempo real con geolocalización, construida con Next.js 15, Firebase y TypeScript.

## 🚀 Características

### Chat en Tiempo Real
- ✅ **Actualizaciones instantáneas**: Los mensajes aparecen automáticamente sin recargar
- ✅ **Contador de mensajes no leídos**: Indicadores visuales con badges y puntos rojos
- ✅ **Auto-scroll inteligente**: Se desplaza automáticamente a mensajes nuevos
- ✅ **Animaciones suaves**: Transiciones visuales para mejor UX
- ✅ **Sistema de solicitudes**: Aprobación de chat antes de enviar mensajes

### Búsqueda de Usuarios
- ✅ **Búsqueda por PIN**: Cada usuario tiene un código único de 6 dígitos
- ✅ **Regenerar PIN**: Posibilidad de cambiar el código cuando sea necesario
- ✅ **Copiar PIN**: Fácil compartición del código personal

### Seguridad
- ✅ **Firestore Security Rules**: Control de acceso granular
- ✅ **Autenticación Firebase**: Login seguro con email/password
- ✅ **Validación de permisos**: Solo participantes pueden acceder a conversaciones

### UI/UX
- ✅ **Responsive Design**: Optimizado para móvil y desktop
- ✅ **Dark Mode**: Tema oscuro incluido
- ✅ **shadcn/ui**: Componentes modernos y accesibles
- ✅ **Tailwind CSS**: Estilos personalizables

## 🛠️ Tecnologías

- **Framework**: Next.js 15.3.3 (App Router)
- **Base de Datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **UI**: shadcn/ui + Tailwind CSS
- **TypeScript**: Type-safe development
- **Real-time**: Firestore listeners (onSnapshot)

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Staillim/GeoChat.git

# Instalar dependencias
npm install

# Configurar Firebase
# Crear archivo .env.local con tus credenciales de Firebase

# Ejecutar en desarrollo
npm run dev
```

## 🔧 Configuración de Firebase

### 1. Crear proyecto en Firebase Console

### 2. Configurar variables de entorno
Crea un archivo `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

### 3. Desplegar reglas de Firestore
```bash
firebase deploy --only firestore:rules
```

### 4. Crear índices compuestos
```bash
firebase deploy --only firestore:indexes
```

Ver `FIRESTORE_INDEXES.md` para más detalles.

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── (app)/          # Rutas protegidas
│   │   ├── chat/       # Sistema de mensajería
│   │   ├── map/        # Mapa con geolocalización
│   │   └── profile/    # Perfil de usuario
│   └── (auth)/         # Autenticación
├── components/         # Componentes reutilizables
│   ├── ui/            # shadcn/ui components
│   └── ...            # Componentes personalizados
├── firebase/          # Configuración y hooks de Firebase
│   ├── auth/          # Hooks de autenticación
│   └── firestore/     # Hooks de Firestore
└── lib/               # Utilidades
```

## 🔄 Sistema de Tiempo Real

### Cómo Funciona

1. **Listeners de Firestore**: Todos los hooks usan `onSnapshot` para actualizaciones en tiempo real
2. **Auto-scroll**: Detecta mensajes nuevos y desplaza automáticamente
3. **Contadores**: Se actualizan instantáneamente cuando llegan mensajes
4. **Ordenamiento**: Conversaciones ordenadas por última actividad

### Hooks Principales

- `useConversations`: Lista de conversaciones con actualizaciones en tiempo real
- `useMessages`: Mensajes de una conversación
- `useChatRequests`: Solicitudes de chat pendientes
- `useMarkAsRead`: Marcar mensajes como leídos
- `useSendMessage`: Enviar mensajes con actualización de contadores

## 🎨 Características Visuales

- **Animaciones de entrada**: Los mensajes aparecen con fade-in
- **Pulse en badges**: Los contadores de no leídos pulsan
- **Hover effects**: Transiciones suaves en toda la UI
- **Skeleton loaders**: Placeholders durante la carga

## 📱 Responsive

- **Móvil**: Vista optimizada con navegación adaptativa
- **Tablet**: Layout híbrido
- **Desktop**: Sidebar permanente con lista de conversaciones

## 🚀 Próximas Funcionalidades

- [ ] Notificaciones push
- [ ] Indicador de "escribiendo..."
- [ ] Confirmación de lectura
- [ ] Compartir ubicación en tiempo real
- [ ] Grupos de chat
- [ ] Búsqueda de mensajes
- [ ] Archivos adjuntos

## 📄 Licencia

MIT

## 👨‍💻 Autor

Staillim - [GitHub](https://github.com/Staillim)
```
