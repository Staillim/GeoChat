# Configuración de Índices de Firestore

Este proyecto requiere índices compuestos en Firestore para funcionar correctamente.

## Índices Requeridos

### 1. Mensajes ordenados por tiempo
**Colección:** `messages` (collection group)
- Campo: `timestamp` (ascendente)

**Propósito:** Permite obtener los mensajes de cualquier conversación ordenados cronológicamente.

**Nota:** Las conversaciones se ordenan en memoria (client-side) para evitar la necesidad de un índice compuesto `participants` + `lastMessageTime`, que requeriría permisos especiales en las reglas de seguridad.

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
2. Crea un índice de collection group:
   - Collection ID: `messages`
   - Campos: `timestamp` (Ascending)
   - Scope: Collection group

## Verificación

Los índices están funcionando correctamente cuando:
- ✅ Los mensajes aparecen en orden cronológico
- ✅ Las conversaciones se ordenan por las más recientes (ordenamiento en cliente)
- ✅ No hay errores en la consola sobre índices faltantes

## Optimización

### ¿Por qué ordenar conversaciones en memoria?

Firestore no permite usar `orderBy` junto con `array-contains` en la misma query sin un índice compuesto. Además, las reglas de seguridad se vuelven más complejas con queries compuestas.

**Solución adoptada:**
- Query simple: `where('participants', 'array-contains', userId)`
- Ordenamiento en JavaScript: `sort()` por `lastMessageTime`

**Ventajas:**
- ✅ Reglas de seguridad más simples
- ✅ No requiere índice compuesto
- ✅ Funciona sin configuración adicional
- ✅ Performance aceptable (< 100 conversaciones por usuario)

**Desventajas:**
- ⚠️ Ordenamiento en cliente consume más recursos
- ⚠️ No escalable para miles de conversaciones

## Notas

- Los índices pueden tardar unos minutos en crearse
- En desarrollo local con emuladores, los índices se crean automáticamente
- En producción, deben desplegarse explícitamente
