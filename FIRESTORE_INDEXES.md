# Configuración de Índices de Firestore

Este proyecto requiere índices compuestos en Firestore para funcionar correctamente.

## Índices Requeridos

### 1. Conversaciones por participante y tiempo
**Colección:** `conversations`
- Campo: `participants` (array-contains)
- Campo: `lastMessageTime` (descendente)

**Propósito:** Permite obtener las conversaciones de un usuario ordenadas por la más reciente.

### 2. Mensajes ordenados por tiempo
**Colección:** `messages` (collection group)
- Campo: `timestamp` (ascendente)

**Propósito:** Permite obtener los mensajes de cualquier conversación ordenados cronológicamente.

## Cómo Crear los Índices

### Opción 1: Automático (Recomendado)
1. Despliega el archivo `firestore.indexes.json` junto con las reglas:
```bash
firebase deploy --only firestore:indexes
```

### Opción 2: Manual
Cuando uses la app, Firebase te mostrará un enlace en la consola cuando intentes hacer una query que requiera un índice. Simplemente haz clic en el enlace y Firebase creará el índice automáticamente.

### Opción 3: Consola de Firebase
1. Ve a Firebase Console → Firestore Database → Índices
2. Crea un índice compuesto con los campos mencionados arriba

## Verificación

Los índices están funcionando correctamente cuando:
- ✅ Las conversaciones se ordenan por las más recientes
- ✅ Los mensajes aparecen en orden cronológico
- ✅ No hay errores en la consola sobre índices faltantes

## Notas

- Los índices pueden tardar unos minutos en crearse
- En desarrollo local con emuladores, los índices se crean automáticamente
- En producción, deben desplegarse explícitamente
