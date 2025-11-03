# Cómo Desplegar las Reglas de Firestore

Las reglas de Firestore se han actualizado para soportar la funcionalidad de ubicación en tiempo real.

## Opción 1: Consola de Firebase (Manual)

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto **GeoChat**
3. Ve a **Firestore Database** en el menú lateral
4. Haz clic en la pestaña **Reglas** (Rules)
5. Copia el contenido del archivo `firestore.rules` de este proyecto
6. Pégalo en el editor de la consola
7. Haz clic en **Publicar** (Publish)

## Opción 2: Firebase CLI (Automático)

Si tienes Firebase CLI instalado y configurado:

```bash
# Inicializar Firebase (solo la primera vez)
firebase init firestore

# Desplegar las reglas
firebase deploy --only firestore:rules
```

## Opción 3: Próximo Deploy con App Hosting

Las reglas se desplegarán automáticamente en el próximo deploy del proyecto a Firebase App Hosting.

## Reglas Añadidas

Se añadieron reglas para la colección `liveLocations`:

- ✅ Usuarios pueden crear su propia ubicación en tiempo real
- ✅ Usuarios pueden leer ubicaciones compartidas con ellos
- ✅ Solo el propietario puede actualizar o eliminar su ubicación
- ✅ Validación de campos requeridos

## Verificar Deploy

Después de desplegar, verifica en la consola de Firebase que las reglas incluyen la sección:

```
match /liveLocations/{locationId} {
  // ... reglas para ubicación en tiempo real
}
```

Si ves el error `permission-denied`, significa que las reglas aún no se han desplegado.
