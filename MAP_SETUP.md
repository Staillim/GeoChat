# 🗺️ Mapa con OpenStreetMap (Leaflet)

Este proyecto usa **Leaflet** con **OpenStreetMap** para mostrar la ubicación de los usuarios en el mapa.

## ✅ Completamente Gratuito y Open Source

- **No necesitas API Key** 🎉
- **No hay límites de uso**
- **100% gratuito**
- **Open source**

## 🎨 Características del Mapa

- **Marcadores personalizados** con colores azules y violetas
- **Marcador especial** para tu ubicación (más grande, color violeta)
- **Popup mejorado** con diseño tipo tarjeta
- **Leyenda flotante** en la esquina inferior izquierda
- **Click en marcadores** para ver información del usuario
- **Botón de chat directo** desde el mapa
- **OpenStreetMap tiles** - datos colaborativos de mapas

## 🌍 Ubicaciones por defecto

Si un usuario no tiene coordenadas configuradas, se usa una ubicación por defecto:
- Latitud: 34.054 (Los Ángeles, CA)
- Longitud: -118.242

Puedes modificar esto en `src/components/map-component.tsx`

## �️ Tecnologías Utilizadas

- **[Leaflet](https://leafletjs.com/)** - Biblioteca JavaScript de mapas interactivos
- **[React-Leaflet](https://react-leaflet.js.org/)** - Componentes React para Leaflet
- **[OpenStreetMap](https://www.openstreetmap.org/)** - Datos de mapas colaborativos

## 📦 Paquetes Instalados

```bash
npm install leaflet react-leaflet @types/leaflet
```

## 🎨 Personalización

Los colores de los marcadores se pueden cambiar en el componente:
- **Marcador azul**: Para otros usuarios
- **Marcador violeta**: Para tu ubicación actual

Puedes cambiar a otros colores disponibles:
- `marker-icon-2x-red.png`
- `marker-icon-2x-green.png`
- `marker-icon-2x-orange.png`
- `marker-icon-2x-yellow.png`
- `marker-icon-2x-violet.png`
- `marker-icon-2x-grey.png`
- `marker-icon-2x-black.png`

## 🔗 Enlaces útiles

- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [React-Leaflet Documentation](https://react-leaflet.js.org/docs/start-introduction)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Leaflet Color Markers](https://github.com/pointhi/leaflet-color-markers)
