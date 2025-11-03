"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachImageButtonProps {
  onImageSelected: (base64: string) => void;
  disabled?: boolean;
}

export function AttachImageButton({ onImageSelected, disabled }: AttachImageButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB para Base64)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. El tamaño máximo es 5MB');
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);
      setIsLoading(false);
    };
    reader.onerror = () => {
      alert('Error al leer la imagen');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    if (previewImage) {
      onImageSelected(previewImage);
      setIsOpen(false);
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => fileInputRef.current?.click(), 100);
        }}
        disabled={disabled}
        className={cn(
          "h-9 w-9 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900/50",
          "text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300",
          "hover:scale-110 transition-all duration-300"
        )}
      >
        <ImageIcon className="h-5 w-5" />
        <span className="sr-only">Adjuntar imagen</span>
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Dialog open={isOpen && previewImage !== null} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-sky-500" />
              Enviar imagen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Cargando imagen...</p>
              </div>
            ) : previewImage ? (
              <div className="relative">
                <img
                  src={previewImage}
                  alt="Vista previa"
                  className="w-full h-auto max-h-96 object-contain rounded-lg border-2 border-sky-200 dark:border-sky-800"
                />
              </div>
            ) : null}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-sky-200 dark:border-sky-800"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSend}
                disabled={!previewImage || isLoading}
                className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Enviar imagen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
