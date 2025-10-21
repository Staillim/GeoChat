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
import { getMockCurrentUser } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function ProfilePage() {
    const currentUser = getMockCurrentUser();
    const avatarData = PlaceHolderImages.find(img => img.id === currentUser.avatar);

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
                        <AvatarImage src={avatarData?.imageUrl} alt={currentUser.name} />
                        <AvatarFallback className="text-3xl">{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline">Cambiar Foto</Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input id="name" defaultValue={currentUser.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" defaultValue="m@example.com" />
                    </div>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="bio">Biografía</Label>
                    <Input id="bio" placeholder="Cuéntanos un poco sobre ti" defaultValue="Amante del café, el senderismo y conectar con gente nueva." />
                </div>
            </CardContent>
            <CardFooter>
            <Button style={{backgroundColor: 'hsl(var(--accent))'}}>Guardar Cambios</Button>
            </CardFooter>
      </Card>
    </div>
  );
}
