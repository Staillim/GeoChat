'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore } from 'firebase/firestore';


export default function SignupPage() {
  const auth = useAuth();
  const firestore = getFirestore(auth.app);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const { toast } = useToast();

  const handleSignUp = () => {
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Las contraseñas no coinciden",
        description: "Por favor, verifica que ambas contraseñas sean iguales.",
      });
      return;
    }
    if (!name) {
        toast({
            variant: "destructive",
            title: "El nombre es requerido",
            description: "Por favor, introduce tu nombre completo.",
        });
        return;
    }
    initiateEmailSignUp(auth, firestore, email, password, name);
    // The redirection will be handled by the AppLayout guard
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        <CardDescription>
          Introduce tu información para crear una cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first-name">Nombre Completo</Label>
            <Input id="first-name" placeholder="Max Robinson" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
          </div>
          <Button type="button" className="w-full" onClick={handleSignUp}>
            Crear una cuenta
          </Button>
          <Button variant="outline" className="w-full">
            Registrarse con Google
          </Button>
        </div>
        <div className="mt-4 text-center text-sm">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="underline text-accent-foreground font-medium" style={{color: 'hsl(var(--accent))'}}>
            Iniciar Sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
