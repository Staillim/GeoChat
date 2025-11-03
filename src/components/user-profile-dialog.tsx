'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Mail, Hash, FileText, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user: {
    uid?: string; // ID del usuario
    displayName: string;
    photoURL?: string | null;
    email?: string | null;
    pin?: string;
    bio?: string;
  };
}

export function UserProfileDialog({ open, onClose, user }: UserProfileDialogProps) {
  const [isCopied, setIsCopied] = useState(false);
  const initials = user.displayName.charAt(0).toUpperCase();

  const copyPinToClipboard = async () => {
    if (user.pin) {
      try {
        await navigator.clipboard.writeText(user.pin);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        console.error('Error al copiar PIN:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] glass-effect p-0 overflow-visible" aria-describedby="user-profile-description">
        <DialogHeader className="sr-only">
          <DialogTitle>Perfil de {user.displayName}</DialogTitle>
          <DialogDescription id="user-profile-description">
            Información del perfil de usuario
          </DialogDescription>
        </DialogHeader>
        
        {/* Header con gradiente */}
        <div className="relative h-32 bg-gradient-to-br from-sky-400 via-blue-500 to-sky-600 shimmer-effect overflow-visible rounded-t-lg">
          {/* Orbes decorativos */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl floating-orb" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl floating-orb" style={{ animationDelay: '1s' }} />
          
          {/* Avatar flotante */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-300/50 to-blue-400/50 rounded-full blur-xl animate-pulse-glow" />
              <Avatar className="h-32 w-32 ring-4 ring-white dark:ring-slate-900 shadow-2xl relative z-10">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName} className="object-cover" />
                <AvatarFallback className="text-5xl bg-gradient-to-br from-sky-400 to-blue-500 text-white font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="pt-20 pb-6 px-6 space-y-6">
          {/* Nombre */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-700 to-blue-600 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
              {user.displayName}
            </h2>
            {user.email && (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            )}
          </div>

          {/* PIN */}
          {user.pin && (
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-xl p-4 border-2 border-sky-200 dark:border-sky-800 shimmer-effect">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg">
                    <Hash className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">PIN de Usuario</p>
                    <p className="text-lg font-mono font-bold text-sky-700 dark:text-sky-300">
                      {user.pin}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyPinToClipboard}
                  className="hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-all duration-300"
                  title="Copiar PIN"
                >
                  {isCopied ? (
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Biografía */}
          {user.bio && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-sky-300">
                <FileText className="h-4 w-4" />
                <span>Acerca de</span>
              </div>
              <p className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                {user.bio}
              </p>
            </div>
          )}

          {/* Información adicional */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Perfil de usuario de GeoChat</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
