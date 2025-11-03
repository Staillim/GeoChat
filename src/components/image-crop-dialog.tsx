'use client';
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { getCroppedImageBase64, type Area } from '@/lib/image-utils';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropDialogProps {
  imageSrc: string | null;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageBase64: string) => void;
}

export function ImageCropDialog({
  imageSrc,
  open,
  onClose,
  onCropComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImageBase64 = await getCroppedImageBase64(
        imageSrc,
        croppedAreaPixels,
        512 // Tamaño máximo: 512x512px
      );
      onCropComplete(croppedImageBase64);
      onClose();
    } catch (error) {
      console.error('Error al recortar la imagen:', error);
      alert('Error al procesar la imagen. Por favor intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px] glass-effect">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
            Recortar Foto de Perfil
          </DialogTitle>
          <DialogDescription>
            Ajusta el zoom y posición para recortar tu foto en formato cuadrado (1:1)
          </DialogDescription>
        </DialogHeader>

        {imageSrc && (
          <div className="space-y-6">
            {/* Área de recorte */}
            <div className="relative h-[400px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden border-2 border-sky-200 dark:border-sky-800 shadow-lg">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropCompleteCallback}
                cropShape="round"
                showGrid={true}
                classes={{
                  containerClassName: 'rounded-xl',
                  cropAreaClassName: 'border-4 border-sky-400 dark:border-sky-500',
                }}
              />
            </div>

            {/* Control de zoom */}
            <div className="space-y-3 px-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                  <ZoomOut className="h-4 w-4" />
                  Zoom
                </span>
                <span className="text-sky-600 dark:text-sky-400">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-4">
                <ZoomOut className="h-5 w-5 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                  className="flex-1"
                />
                <ZoomIn className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className="hover:bg-sky-50 dark:hover:bg-sky-950 transition-colors"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isProcessing || !croppedAreaPixels}
            className="bg-gradient-to-br from-sky-400 via-blue-500 to-sky-600 hover:from-sky-500 hover:via-blue-600 hover:to-sky-700 text-white shadow-lg shadow-sky-400/50 hover:shadow-xl hover:shadow-sky-500/60 transition-all duration-300"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Guardar Foto'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
