'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useState } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';

const { firestore } = initializeFirebase();

export default function ProfilePage() {
    const { user, userProfile, isUserLoading } = useUser();
    const [isRegeneratingPin, setIsRegeneratingPin] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Debug logs
    console.log('=== Profile Page Debug ===');
    console.log('User UID:', user?.uid);
    console.log('User Email:', user?.email);
    console.log('User DisplayName:', user?.displayName);
    console.log('User Profile (raw):', userProfile);
    console.log('User Profile exists?:', userProfile !== null && userProfile !== undefined);
    if (userProfile) {
        console.log('User Profile keys:', Object.keys(userProfile));
        console.log('PIN value:', userProfile.pin);
        console.log('PIN type:', typeof userProfile.pin);
    }
    console.log('Is Loading:', isUserLoading);
    console.log('========================');

    const regeneratePin = async () => {
        if (!user) return;
        
        setIsRegeneratingPin(true);
        try {
            const newPin = Math.floor(100000 + Math.random() * 900000).toString();
            const userDocRef = doc(firestore, 'users', user.uid);
            
            // Primero verificar si el documento existe
            const { getDoc } = await import('firebase/firestore');
            const docSnap = await getDoc(userDocRef);
            
            if (!docSnap.exists()) {
                // Si no existe, crear el documento completo
                console.log('📝 Documento no existe, creándolo...');
                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
                    photoURL: user.photoURL || null,
                    pin: newPin,
                    createdAt: new Date().toISOString(),
                });
            } else {
                // Si existe, solo actualizar el PIN
                console.log('🔄 Actualizando PIN existente...');
                await updateDoc(userDocRef, {
                    pin: newPin
                });
            }
            
            console.log('✅ PIN regenerado:', newPin);
            alert(`Nuevo PIN generado: ${newPin}`);
        } catch (error) {
            console.error('❌ Error al regenerar PIN:', error);
            alert('Error al regenerar el PIN: ' + (error as Error).message);
        } finally {
            setIsRegeneratingPin(false);
        }
    };

    const copyPinToClipboard = async () => {
        if (pin && pin !== 'No disponible') {
            try {
                await navigator.clipboard.writeText(pin);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (error) {
                console.error('Error al copiar PIN:', error);
                alert('Error al copiar el PIN');
            }
        }
    };

    if (isUserLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles del Perfil</CardTitle>
                        <CardDescription>
                            Cargando tu información...
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
                </div>
                <Card>
                    <CardContent className="p-8 text-center">
                        <p>No se pudo cargar la información del usuario.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const displayName = userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'Usuario';
    const email = user.email || '';
    const bio = userProfile?.bio || '';
    
    // Verificar el PIN - está guardado directamente en el documento del usuario
    console.log('🔍 Buscando PIN...');
    console.log('userProfile completo:', JSON.stringify(userProfile, null, 2));
    
    const pin = userProfile?.pin || 'No disponible';
    
    console.log('PIN encontrado:', pin);
    console.log('Tipo de PIN:', typeof pin);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Detalles del Perfil</CardTitle>
                    <CardDescription>
                        Actualiza tu información personal y tu foto.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.photoURL || ''} alt={displayName} />
                            <AvatarFallback className="text-3xl">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline">Cambiar Foto</Button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input id="name" value={displayName} readOnly />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" type="email" value={email} disabled />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="pin">PIN de Usuario</Label>
                        <div className="flex gap-2">
                            <Input id="pin" value={pin} disabled className="font-mono text-lg flex-1" />
                            <Button 
                                variant="outline" 
                                size="icon"
                                onClick={copyPinToClipboard}
                                disabled={pin === 'No disponible'}
                                title="Copiar PIN"
                            >
                                {isCopied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                            <Button 
                                variant="outline" 
                                size="icon"
                                onClick={regeneratePin}
                                disabled={isRegeneratingPin}
                                title="Regenerar PIN"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRegeneratingPin ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Este es tu PIN único para conectar con otros usuarios</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bio">Biografía</Label>
                        <Input id="bio" placeholder="Cuéntanos un poco sobre ti" value={bio} readOnly />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button style={{backgroundColor: 'hsl(var(--accent))'}}>Guardar Cambios</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
