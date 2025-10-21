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

export default function ProfilePage() {
    const { user, userProfile, isUserLoading } = useUser();

    // Debug logs
    console.log('=== Profile Page Debug ===');
    console.log('User:', user);
    console.log('User Profile:', userProfile);
    console.log('Is Loading:', isUserLoading);
    console.log('========================');

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
    
    // Verificar el PIN con más detalle
    let pin = 'No disponible';
    if (userProfile) {
        if (userProfile.pin) {
            pin = userProfile.pin;
        } else {
            console.warn('El perfil existe pero no tiene PIN:', userProfile);
            pin = 'PIN no configurado';
        }
    } else {
        console.warn('userProfile es null o undefined');
    }

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
                            <Input id="name" defaultValue={displayName} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" type="email" defaultValue={email} disabled />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="pin">PIN de Usuario</Label>
                        <Input id="pin" defaultValue={pin} disabled className="font-mono text-lg" />
                        <p className="text-sm text-muted-foreground">Este es tu PIN único para conectar con otros usuarios</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bio">Biografía</Label>
                        <Input id="bio" placeholder="Cuéntanos un poco sobre ti" defaultValue={bio} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button style={{backgroundColor: 'hsl(var(--accent))'}}>Guardar Cambios</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
