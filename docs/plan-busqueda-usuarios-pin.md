# Plan de Implementación: Búsqueda de Usuarios por PIN y Sistema de Solicitudes

## 📋 Resumen del Proyecto

Implementar un sistema de búsqueda de usuarios por PIN con solicitudes de amistad/chat pendientes, incluyendo:
- Botón flotante (FAB) para buscar usuarios
- Modal de búsqueda por PIN
- Tarjeta de usuario con opción de agregar
- Sistema de solicitudes pendientes
- Notificaciones de solicitud
- Aceptación/rechazo de solicitudes

---

## 🎯 Objetivos

1. **Búsqueda de usuarios**: Permitir buscar usuarios por su PIN único
2. **Visualización de perfil**: Mostrar foto, nombre y PIN del usuario encontrado
3. **Solicitudes de chat**: Enviar y recibir solicitudes de chat
4. **Gestión de pendientes**: Manejar chats pendientes de aprobación
5. **Notificaciones**: Informar a los usuarios de nuevas solicitudes

---

## 🗂️ Estructura de Datos en Firestore

### 1. Colección: `users/{userId}`
```javascript
{
  uid: "string",
  email: "string",
  displayName: "string",
  pin: "string",              // PIN único de 6 dígitos
  bio: "string" (opcional),
  photoURL: "string" (opcional),
  lat: number (opcional),
  lng: number (opcional),
  // NUEVO:
  searchablePin: "string"     // PIN en lowercase para búsqueda case-insensitive
}
```

### 2. Colección: `conversations/{conversationId}`
```javascript
{
  participants: ["uid1", "uid2"],
  lastMessage: "string" (opcional),
  lastMessageTime: Timestamp (opcional),
  unreadCount: {
    "uid1": number,
    "uid2": number
  },
  // NUEVO:
  status: "pending" | "active" | "blocked",
  createdBy: "uid",           // Quién inició la conversación
  createdAt: Timestamp,
  acceptedBy: "uid" (opcional), // Quién aceptó la solicitud
  acceptedAt: Timestamp (opcional)
}
```

### 3. NUEVA Colección: `chatRequests/{requestId}`
```javascript
{
  fromUserId: "uid",          // Quien envía la solicitud
  fromUserName: "string",
  fromUserPhoto: "string",
  toUserId: "uid",            // Quien recibe la solicitud
  conversationId: "string",   // ID de la conversación creada
  status: "pending" | "accepted" | "rejected",
  createdAt: Timestamp,
  respondedAt: Timestamp (opcional),
  message: "string" (opcional) // Mensaje inicial opcional
}
```

---

## 🔐 Actualizaciones a Firestore Rules

### Archivo: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // REGLA ACTUALIZADA: Usuarios
    // ============================================
    match /users/{userId} {
      function isSignedIn() {
        return request.auth != null;
      }

      function isOwner(userId) {
        return request.auth.uid == userId;
      }

      function isExistingOwner(userId) {
        return isOwner(userId) && exists(/databases/$(database)/documents/users/$(userId));
      }

      // Cualquier usuario autenticado puede leer perfiles (para búsqueda por PIN)
      allow get: if isSignedIn();
      allow list: if isSignedIn();
      
      // Solo el propietario puede crear/actualizar/eliminar
      allow create: if isSignedIn() && isOwner(userId);
      allow update: if isExistingOwner(userId);
      allow delete: if isExistingOwner(userId);
    }

    // ============================================
    // REGLA ACTUALIZADA: Conversaciones
    // ============================================
    match /conversations/{conversationId} {
      function isSignedIn() {
        return request.auth != null;
      }

      function isParticipant() {
        return isSignedIn() && request.auth.uid in resource.data.participants;
      }

      function isParticipantInNew() {
        return isSignedIn() && request.auth.uid in request.resource.data.participants;
      }

      function isCreator() {
        return isSignedIn() && request.auth.uid == resource.data.createdBy;
      }

      // Los participantes pueden leer la conversación
      allow get: if isParticipant();
      
      // Los usuarios pueden listar sus conversaciones (filtrado por query)
      allow list: if isSignedIn();
      
      // Crear conversación: debe ser participante y establecer status
      allow create: if isSignedIn() 
                    && isParticipantInNew() 
                    && request.resource.data.status in ['pending', 'active']
                    && request.resource.data.createdBy == request.auth.uid;
      
      // Actualizar: solo participantes, permitir cambio de status si es el receptor
      allow update: if isParticipant() 
                    && (
                      // El creador puede actualizar lastMessage
                      (isCreator() && resource.data.status == 'active')
                      // El receptor puede aceptar (cambiar status a active)
                      || (resource.data.status == 'pending' 
                          && request.resource.data.status == 'active'
                          && !isCreator())
                    );
      
      allow delete: if isParticipant();

      // Mensajes dentro de conversaciones
      match /messages/{messageId} {
        function isConversationParticipant() {
          return isSignedIn() 
                 && request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        }

        function isConversationActive() {
          return get(/databases/$(database)/documents/conversations/$(conversationId)).data.status == 'active';
        }

        allow get: if isConversationParticipant();
        allow list: if isConversationParticipant();
        
        // Solo crear mensajes si la conversación está activa
        allow create: if isConversationParticipant() 
                      && isConversationActive()
                      && request.resource.data.senderId == request.auth.uid;
        
        allow update: if false;
        allow delete: if false;
      }
    }

    // ============================================
    // NUEVA REGLA: Solicitudes de Chat
    // ============================================
    match /chatRequests/{requestId} {
      function isSignedIn() {
        return request.auth != null;
      }

      function isSender() {
        return isSignedIn() && request.auth.uid == resource.data.fromUserId;
      }

      function isRecipient() {
        return isSignedIn() && request.auth.uid == resource.data.toUserId;
      }

      // Leer: solo el remitente o el destinatario
      allow get: if isSender() || isRecipient();
      
      // Listar: solo las solicitudes donde el usuario es remitente o destinatario
      allow list: if isSignedIn();
      
      // Crear: solo el remitente, debe establecer status pending
      allow create: if isSignedIn() 
                    && request.resource.data.fromUserId == request.auth.uid
                    && request.resource.data.status == 'pending';
      
      // Actualizar: solo el destinatario puede cambiar el status
      allow update: if isRecipient() 
                    && resource.data.status == 'pending'
                    && request.resource.data.status in ['accepted', 'rejected'];
      
      // Eliminar: solo el remitente puede eliminar solicitudes pendientes
      allow delete: if isSender() && resource.data.status == 'pending';
    }
  }
}
```

---

## 🎨 Componentes a Crear/Modificar

### 1. **Componente: `AddFriendFAB.tsx`** (NUEVO)
**Ubicación**: `src/components/AddFriendFAB.tsx`

```typescript
'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { SearchUserDialog } from './SearchUserDialog';

interface AddFriendFABProps {
  className?: string;
}

export function AddFriendFAB({ className }: AddFriendFABProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg ${className}`}
        size="icon"
        style={{ backgroundColor: 'hsl(var(--accent))' }}
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Buscar nuevos amigos</span>
      </Button>
      
      <SearchUserDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </>
  );
}
```

**Características**:
- Botón flotante circular con ícono +
- Posicionado en la esquina inferior derecha
- Abre el modal de búsqueda al hacer clic
- Diseño responsive

---

### 2. **Componente: `SearchUserDialog.tsx`** (NUEVO)
**Ubicación**: `src/components/SearchUserDialog.tsx`

```typescript
'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { UserCard } from './UserCard';
import { searchUserByPin } from '@/lib/user-search';

interface SearchUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchUserDialog({ open, onOpenChange }: SearchUserDialogProps) {
  const [pin, setPin] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (pin.length !== 6) {
      setError('El PIN debe tener 6 dígitos');
      return;
    }

    setIsSearching(true);
    setError('');
    
    try {
      const user = await searchUserByPin(pin);
      if (user) {
        setFoundUser(user);
      } else {
        setError('No se encontró ningún usuario con ese PIN');
        setFoundUser(null);
      }
    } catch (err) {
      setError('Error al buscar usuario');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setFoundUser(null);
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar Usuario por PIN</DialogTitle>
          <DialogDescription>
            Ingresa el PIN de 6 dígitos del usuario que deseas agregar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ej: 123456"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="font-mono text-lg text-center"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || pin.length !== 6}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {foundUser && (
            <UserCard 
              user={foundUser} 
              onRequestSent={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Características**:
- Modal con input para PIN de 6 dígitos
- Validación de formato (solo números, máximo 6)
- Búsqueda en tiempo real
- Muestra tarjeta del usuario si se encuentra
- Manejo de errores

---

### 3. **Componente: `UserCard.tsx`** (NUEVO)
**Ubicación**: `src/components/UserCard.tsx`

```typescript
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { UserPlus, Check } from 'lucide-react';
import { useState } from 'react';
import { sendChatRequest } from '@/lib/chat-requests';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';

interface UserCardProps {
  user: {
    uid: string;
    displayName: string;
    pin: string;
    photoURL?: string;
  };
  onRequestSent?: () => void;
}

export function UserCard({ user, onRequestSent }: UserCardProps) {
  const { user: currentUser } = useUser();
  const [isSending, setIsSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const { toast } = useToast();

  const handleSendRequest = async () => {
    if (!currentUser) return;

    setIsSending(true);
    try {
      await sendChatRequest(currentUser.uid, user.uid);
      setRequestSent(true);
      toast({
        title: "Solicitud enviada",
        description: `Se ha enviado una solicitud de chat a ${user.displayName}`,
      });
      
      setTimeout(() => {
        onRequestSent?.();
      }, 1500);
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.photoURL} alt={user.displayName} />
            <AvatarFallback className="text-2xl">
              {user.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{user.displayName}</h3>
            <p className="text-sm text-muted-foreground font-mono">PIN: {user.pin}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSendRequest}
          disabled={isSending || requestSent}
        >
          {requestSent ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Solicitud Enviada
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Enviar Solicitud
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**Características**:
- Muestra avatar, nombre y PIN del usuario
- Botón para enviar solicitud
- Estados: normal, enviando, enviada
- Toast notifications
- Icono check cuando se envía exitosamente

---

### 4. **Componente: `PendingRequestsSection.tsx`** (NUEVO)
**Ubicación**: `src/components/PendingRequestsSection.tsx`

```typescript
'use client';
import { useChatRequests } from '@/firebase/firestore/use-chat-requests';
import { useUser } from '@/firebase/auth/use-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { acceptChatRequest, rejectChatRequest } from '@/lib/chat-requests';
import { useToast } from '@/hooks/use-toast';

export function PendingRequestsSection() {
  const { user } = useUser();
  const { requests, isLoading } = useChatRequests(user?.uid);
  const { toast } = useToast();

  const handleAccept = async (requestId: string, conversationId: string) => {
    try {
      await acceptChatRequest(requestId, conversationId);
      toast({
        title: "Solicitud aceptada",
        description: "Ahora puedes chatear con este usuario",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo aceptar la solicitud",
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectChatRequest(requestId);
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo rechazar la solicitud",
      });
    }
  };

  if (isLoading || !requests || requests.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-muted/50 p-4">
      <h3 className="text-sm font-semibold mb-3">Solicitudes Pendientes</h3>
      <div className="space-y-2">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={request.fromUserPhoto} />
                  <AvatarFallback>
                    {request.fromUserName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{request.fromUserName}</p>
                  <p className="text-xs text-muted-foreground">
                    Quiere chatear contigo
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-600 hover:bg-green-100"
                    onClick={() => handleAccept(request.id, request.conversationId)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600 hover:bg-red-100"
                    onClick={() => handleReject(request.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Características**:
- Lista de solicitudes pendientes
- Botones de aceptar/rechazar
- Se oculta si no hay solicitudes
- Muestra foto y nombre del remitente

---

## 📝 Funciones Utilitarias a Crear

### 1. **Archivo: `lib/user-search.ts`** (NUEVO)

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

export interface SearchedUser {
  uid: string;
  displayName: string;
  pin: string;
  photoURL?: string;
}

/**
 * Busca un usuario por su PIN
 */
export async function searchUserByPin(pin: string): Promise<SearchedUser | null> {
  const firestore = getFirestore();
  const usersRef = collection(firestore, 'users');
  
  // Buscar por PIN exacto
  const q = query(usersRef, where('pin', '==', pin));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const userDoc = querySnapshot.docs[0];
  const userData = userDoc.data();
  
  return {
    uid: userData.uid,
    displayName: userData.displayName,
    pin: userData.pin,
    photoURL: userData.photoURL
  };
}
```

---

### 2. **Archivo: `lib/chat-requests.ts`** (NUEVO)

```typescript
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Envía una solicitud de chat a otro usuario
 */
export async function sendChatRequest(fromUserId: string, toUserId: string): Promise<string> {
  const firestore = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  // Crear la conversación en estado pending
  const conversationsRef = collection(firestore, 'conversations');
  const conversationDoc = await addDoc(conversationsRef, {
    participants: [fromUserId, toUserId],
    status: 'pending',
    createdBy: fromUserId,
    createdAt: serverTimestamp(),
    unreadCount: {
      [fromUserId]: 0,
      [toUserId]: 0
    }
  });

  // Obtener datos del usuario actual
  const userDoc = await getDoc(doc(firestore, 'users', fromUserId));
  const userData = userDoc.data();

  // Crear la solicitud
  const requestsRef = collection(firestore, 'chatRequests');
  const requestDoc = await addDoc(requestsRef, {
    fromUserId,
    fromUserName: userData?.displayName || 'Usuario',
    fromUserPhoto: userData?.photoURL || '',
    toUserId,
    conversationId: conversationDoc.id,
    status: 'pending',
    createdAt: serverTimestamp()
  });

  return requestDoc.id;
}

/**
 * Acepta una solicitud de chat
 */
export async function acceptChatRequest(requestId: string, conversationId: string): Promise<void> {
  const firestore = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  // Actualizar el estado de la solicitud
  await updateDoc(doc(firestore, 'chatRequests', requestId), {
    status: 'accepted',
    respondedAt: serverTimestamp()
  });

  // Actualizar el estado de la conversación
  await updateDoc(doc(firestore, 'conversations', conversationId), {
    status: 'active',
    acceptedBy: currentUser.uid,
    acceptedAt: serverTimestamp()
  });
}

/**
 * Rechaza una solicitud de chat
 */
export async function rejectChatRequest(requestId: string): Promise<void> {
  const firestore = getFirestore();
  
  // Actualizar el estado de la solicitud
  await updateDoc(doc(firestore, 'chatRequests', requestId), {
    status: 'rejected',
    respondedAt: serverTimestamp()
  });
}
```

---

### 3. **Hook: `use-chat-requests.tsx`** (NUEVO)
**Ubicación**: `src/firebase/firestore/use-chat-requests.tsx`

```typescript
'use client';
import { useCollection } from './use-collection';
import { useFirestore } from '../index';
import { collection, query, where } from 'firebase/firestore';
import { useMemoFirebase } from '../index';

export interface ChatRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto: string;
  toUserId: string;
  conversationId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  respondedAt?: any;
}

/**
 * Hook to get pending chat requests for a user
 */
export const useChatRequests = (userId: string | undefined) => {
  const firestore = useFirestore();
  
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    const requestsRef = collection(firestore, 'chatRequests');
    return query(
      requestsRef, 
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    );
  }, [firestore, userId]);

  const { data, isLoading, error } = useCollection<ChatRequest>(requestsQuery);

  return {
    requests: data || [],
    isLoading,
    error
  };
};
```

---

## 🔄 Modificaciones a Archivos Existentes

### 1. **Modificar: `src/app/(app)/chat/layout.tsx`**

Agregar el FAB y la sección de solicitudes pendientes:

```typescript
import { AddFriendFAB } from '@/components/AddFriendFAB';
import { PendingRequestsSection } from '@/components/PendingRequestsSection';

// ... código existente ...

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params.slug as string[] | undefined;

  return (
    <div className="grid h-full w-full md:grid-cols-[280px_1fr] relative">
      <div className={cn("border-r bg-card", slug && slug.length > 0 ? "hidden md:block" : "block")}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <h2 className="font-semibold text-lg">Conversaciones</h2>
          </div>
          {/* NUEVO: Sección de solicitudes pendientes */}
          <PendingRequestsSection />
          <ConversationList/>
        </div>
      </div>
      <div className={cn("flex-col", slug && slug.length > 0 ? "flex" : "hidden md:flex")}>
        {children}
      </div>
      
      {/* NUEVO: Botón flotante para buscar usuarios */}
      <AddFriendFAB className={cn(slug && slug.length > 0 ? "md:hidden" : "")} />
    </div>
  )
}
```

---

### 2. **Modificar: `src/app/(app)/chat/layout.tsx` - ConversationList**

Actualizar para mostrar conversaciones pendientes de manera diferente:

```typescript
function ConversationList() {
  const params = useParams();
  const { user } = useUser();
  const { conversations, isLoading } = useConversations(user?.uid);
  const activeConversationId = params.slug?.[0];

  // ... código de loading existente ...

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {conversations.map((conv) => {
          const isActive = activeConversationId === conv.id;
          const isPending = conv.status === 'pending';
          const isCreator = conv.createdBy === user?.uid;
          const participantId = conv.participants.find(p => p !== user?.uid);
          
          return (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                isActive && "bg-accent",
                isPending && "opacity-60"
              )}
            >
              <div className="flex w-full items-center gap-3">
                <Avatar>
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {participantId}
                    {isPending && (
                      <Badge variant="outline" className="text-xs">
                        {isCreator ? 'Pendiente' : 'Nueva solicitud'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {isPending 
                      ? (isCreator ? 'Esperando aceptación...' : '¡Nueva solicitud de chat!')
                      : (conv.lastMessage || 'Sin mensajes')
                    }
                  </p>
                </div>
                {!isPending && conv.unreadCount && conv.unreadCount[user?.uid || ''] > 0 && (
                  <Badge>{conv.unreadCount[user?.uid || '']}</Badge>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </ScrollArea>
  );
}
```

---

### 3. **Modificar: `src/app/(app)/chat/[[...slug]]/page.tsx`**

Actualizar para manejar conversaciones pendientes:

```typescript
// ... código existente ...

export default function ChatPage() {
  // ... código existente ...

  const isPending = conversation.status === 'pending';
  const isCreator = conversation.createdBy === user?.uid;
  const canSendMessages = conversation.status === 'active';

  // ... código existente ...

  return (
    <div className="flex flex-col h-full">
      {/* Header existente */}
      
      {/* Mensaje de estado pendiente */}
      {isPending && (
        <div className="bg-muted border-b p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isCreator 
              ? '⏳ Esperando que el usuario acepte tu solicitud...'
              : '📩 Este usuario quiere chatear contigo. Acepta la solicitud en la parte superior.'
            }
          </p>
        </div>
      )}

      {/* Área de mensajes existente */}
      <div className="flex-1 overflow-y-auto">
        {/* ... código existente ... */}
      </div>

      {/* Footer - Input de mensajes */}
      <footer className="flex-shrink-0 border-t p-4 bg-card">
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            if (canSendMessages) handleSendMessage(); 
          }} 
          className="relative"
        >
          <Input 
            placeholder={canSendMessages ? "Escribe un mensaje..." : "Acepta la solicitud para enviar mensajes"}
            className="pr-12" 
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={!canSendMessages}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" 
            style={{backgroundColor: 'hsl(var(--accent))'}}
            disabled={!messageText.trim() || !canSendMessages}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
```

---

### 4. **Modificar: `src/firebase/non-blocking-login.tsx`**

Actualizar para incluir `searchablePin` al crear usuarios:

```typescript
export function initiateEmailSignUp(/* ... parámetros ... */) {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
      const user = userCredential.user;
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const pin = Math.floor(100000 + Math.random() * 900000).toString();

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        pin: pin,
        searchablePin: pin.toLowerCase() // NUEVO: Para búsqueda case-insensitive
      };

      setDocumentNonBlocking(userDocRef, userData, { merge: false });
    })
    // ... resto del código ...
}
```

---

### 5. **Exportar nuevos hooks en `src/firebase/index.ts`**

```typescript
export * from './firestore/use-chat-requests';
```

---

## 📱 Flujo de Usuario

### Escenario 1: Usuario A busca y agrega a Usuario B

1. **Usuario A** hace clic en el FAB (+)
2. Se abre el modal de búsqueda
3. **Usuario A** ingresa el PIN de **Usuario B** (ej: 123456)
4. El sistema busca en Firestore y muestra la tarjeta de **Usuario B**
5. **Usuario A** hace clic en "Enviar Solicitud"
6. El sistema:
   - Crea una conversación con `status: 'pending'`
   - Crea un registro en `chatRequests`
   - Muestra toast de confirmación
7. En la lista de chats de **Usuario A** aparece la conversación marcada como "Pendiente"
8. **Usuario A** NO puede enviar mensajes hasta que se acepte

### Escenario 2: Usuario B recibe y acepta la solicitud

1. **Usuario B** entra a la app
2. Ve una notificación visual en la sección "Solicitudes Pendientes"
3. Ve la tarjeta con la foto/nombre de **Usuario A** y botones ✓ y ✗
4. **Usuario B** hace clic en ✓ (aceptar)
5. El sistema:
   - Actualiza `chatRequests` a `status: 'accepted'`
   - Actualiza `conversations` a `status: 'active'`
   - Muestra toast de confirmación
6. La conversación pasa de la sección de pendientes a la lista normal
7. Ambos usuarios pueden enviar mensajes ahora

### Escenario 3: Usuario B rechaza la solicitud

1. **Usuario B** hace clic en ✗ (rechazar)
2. El sistema:
   - Actualiza `chatRequests` a `status: 'rejected'`
   - La solicitud desaparece de la vista
3. La conversación permanece en `pending` pero no se muestra más
4. **Usuario A** sigue viendo la conversación como "Pendiente" (opcional: podría ocultarse)

---

## 🎨 Consideraciones de Diseño

### Estilos del FAB
- Color de fondo: `hsl(var(--accent))`
- Sombra: `shadow-lg`
- Tamaño: 56x56px (h-14 w-14)
- Ícono: Plus de lucide-react
- Posición: `fixed bottom-6 right-6`
- Z-index: alto para que esté sobre otros elementos

### Estados Visuales
1. **Conversación Activa**: Normal
2. **Conversación Pendiente (creador)**: Opacidad 60%, badge "Pendiente"
3. **Conversación Pendiente (receptor)**: Aparece en sección especial arriba
4. **Solicitud en lista**: Card con botones verde/rojo

### Responsive
- FAB se oculta en desktop cuando hay un chat abierto
- Modal de búsqueda se adapta a pantallas pequeñas
- Sección de pendientes colapsa en móvil si es muy larga

---

## ✅ Checklist de Implementación

### Fase 1: Infraestructura (Backend)
- [ ] Actualizar `firestore.rules` con nuevas reglas
- [ ] Crear hook `use-chat-requests.tsx`
- [ ] Crear funciones en `lib/user-search.ts`
- [ ] Crear funciones en `lib/chat-requests.ts`
- [ ] Actualizar `initiateEmailSignUp` para incluir `searchablePin`
- [ ] Exportar nuevos hooks en `firebase/index.ts`

### Fase 2: Componentes UI
- [ ] Crear componente `AddFriendFAB.tsx`
- [ ] Crear componente `SearchUserDialog.tsx`
- [ ] Crear componente `UserCard.tsx`
- [ ] Crear componente `PendingRequestsSection.tsx`

### Fase 3: Integración
- [ ] Modificar `chat/layout.tsx` para incluir FAB y sección de pendientes
- [ ] Actualizar `ConversationList` para mostrar estados pendientes
- [ ] Modificar `chat/[[...slug]]/page.tsx` para manejar conversaciones pendientes
- [ ] Agregar función `handleSendMessage` para crear mensajes en Firestore

### Fase 4: Testing
- [ ] Probar búsqueda de usuarios por PIN
- [ ] Probar envío de solicitudes
- [ ] Probar aceptación de solicitudes
- [ ] Probar rechazo de solicitudes
- [ ] Verificar permisos de Firestore
- [ ] Probar envío de mensajes en conversaciones activas
- [ ] Verificar que conversaciones pendientes no permiten mensajes

### Fase 5: Pulido
- [ ] Agregar animaciones al FAB
- [ ] Mejorar mensajes de error
- [ ] Agregar confirmaciones para rechazar
- [ ] Implementar contador de solicitudes pendientes
- [ ] Agregar notificaciones push (opcional)
- [ ] Optimizar queries de Firestore

---

## 🚀 Orden de Implementación Recomendado

1. **Día 1**: Actualizar reglas de Firestore y crear funciones backend
2. **Día 2**: Crear hooks y funciones de búsqueda/solicitudes
3. **Día 3**: Crear componentes UI (FAB, dialogs, cards)
4. **Día 4**: Integrar componentes en las páginas existentes
5. **Día 5**: Testing, debugging y pulido

---

## 📊 Estimación de Tiempo

- **Backend (reglas + hooks + funciones)**: 4-6 horas
- **Componentes UI**: 6-8 horas
- **Integración**: 4-6 horas
- **Testing y pulido**: 4-6 horas
- **Total**: 18-26 horas (2.5-3.5 días de desarrollo)

---

## 🔒 Consideraciones de Seguridad

1. **Validación de PIN**: Asegurar que el PIN sea único en Firestore
2. **Rate limiting**: Considerar limitar búsquedas por usuario/tiempo
3. **Spam prevention**: Limitar solicitudes por usuario/día
4. **Privacidad**: Solo mostrar info básica en búsquedas
5. **Bloqueo**: Considerar función de bloquear usuarios (futura)

---

## 🎯 Funcionalidades Futuras (Opcionales)

1. **Notificaciones Push**: Alertas cuando llegan solicitudes
2. **Búsqueda avanzada**: Por nombre, ubicación, etc.
3. **Sugerencias**: Usuarios cercanos o con intereses similares
4. **Bloqueo de usuarios**: Prevenir solicitudes no deseadas
5. **Reportes**: Sistema para reportar comportamiento inapropiado
6. **Estadísticas**: Mostrar cuántas solicitudes enviadas/recibidas
7. **Expiración**: Auto-rechazar solicitudes después de X días

---

## 📝 Notas Adicionales

- Todos los componentes usan shadcn/ui para consistencia
- Los íconos son de lucide-react
- Usar `useToast` para todas las notificaciones
- Mantener logging con `console.log` para debugging
- Considerar agregar analytics para métricas de uso

---

**Fecha de creación**: ${new Date().toLocaleDateString()}
**Versión del documento**: 1.0
**Estado**: Pendiente de implementación
