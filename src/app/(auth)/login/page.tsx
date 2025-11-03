'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { useAuth, useFirestore } from '@/firebase';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useState } from 'react';

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!auth) {
      setError("Servicio de autenticación no disponible.");
      return;
    }
    
    if (!email || !password) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await initiateEmailSignIn(auth, email, password, firestore);
      console.log("Login exitoso, la redirección será manejada por el AuthLayout");
    } catch (err: any) {
      console.error("Error en login:", err);
      let errorMessage = "Error durante el inicio de sesión";
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = "No existe una cuenta con este correo electrónico";
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = "Contraseña incorrecta";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Correo electrónico inválido";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Demasiados intentos fallidos. Intenta más tarde";
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = "Credenciales inválidas. Verifica tu correo y contraseña";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSignIn();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription>
          Introduce tu correo electrónico a continuación para iniciar sesión en tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Contraseña</Label>
              <Link href="#" className="ml-auto inline-block text-sm underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </div>
          <Button 
            type="button" 
            className="w-full" 
            onClick={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
          <Button variant="outline" className="w-full" disabled={isLoading}>
            Iniciar Sesión con Google
          </Button>
        </div>
        <div className="mt-4 text-center text-sm">
          ¿No tienes una cuenta?{' '}
          <Link href="/signup" className="underline text-accent-foreground font-medium" style={{color: 'hsl(var(--accent))'}}>
            Regístrate
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
