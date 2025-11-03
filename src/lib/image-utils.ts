// Utilidades para manejo de imágenes

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Convierte la imagen recortada a Base64
 * @param imageSrc - URL de la imagen original
 * @param pixelCrop - Área de recorte en píxeles
 * @param maxSize - Tamaño máximo del lado más largo (default: 512px)
 * @returns Promise con la imagen en Base64
 */
export async function getCroppedImageBase64(
  imageSrc: string,
  pixelCrop: Area,
  maxSize: number = 512
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No se pudo obtener el contexto del canvas');
  }

  // Asegurar que el crop sea cuadrado (1:1)
  const size = Math.min(pixelCrop.width, pixelCrop.height);
  
  // Establecer el tamaño del canvas (máximo maxSize)
  const finalSize = Math.min(size, maxSize);
  canvas.width = finalSize;
  canvas.height = finalSize;

  // Dibujar la imagen recortada y redimensionada
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    size,
    size,
    0,
    0,
    finalSize,
    finalSize
  );

  // Convertir a Base64 con calidad optimizada
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Crea un elemento de imagen desde una URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Lee un archivo y lo convierte a URL de datos
 */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string));
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

/**
 * Valida que el archivo sea una imagen válida
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return false;
  }

  if (file.size > maxSize) {
    return false;
  }

  return true;
}
