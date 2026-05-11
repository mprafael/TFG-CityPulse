# 🏙️ CityPulse - Plataforma de Transporte Urbano en Tiempo Real

**CityPulse** es una aplicación web Full-Stack desarrollada para centralizar y visualizar en tiempo real diferentes medios de transporte urbano (EMT, Metro, VTC, Taxis) en un único mapa interactivo.

> **Nota:** Esta es la versión **MVP Funcional**. Incluye la Landing Page animada y el núcleo principal de la aplicación: un mapa interactivo conectado por WebSockets a un servidor Node.js que transmite datos de flotas en tiempo real, junto con geolocalización del usuario.

---

## 🛠️ Stack Tecnológico
* **Frontend:** React, Vite, TailwindCSS (v3), Lucide React.
* **Mapas y UI:** Mapbox GL JS (`react-map-gl`), Popups interactivos.
* **Animaciones:** GSAP + ScrollTrigger (Landing Page).
* **Backend:** Node.js, Express, CORS.
* **Tiempo Real:** **Socket.IO** (Comunicación bidireccional cliente-servidor).
* **Gestor de paquetes:** `pnpm`.

---

## 🚀 Novedades de esta Versión (Motor de Tiempo Real)
1. **Conexión WebSockets (Socket.IO):** El servidor backend cuenta ahora con un motor que emite las coordenadas de los vehículos constantemente, permitiendo que el cliente reaccione sin necesidad de recargar la página (polling).
2. **Movimiento Fluido (Interpolación):** Implementación de transiciones CSS lineales para que los vehículos se deslicen suavemente por el mapa entre coordenada y coordenada.
3. **Geolocalización del Usuario:** Integración con la API nativa del navegador para ubicar al usuario en el mapa mediante una animación "Fly-To" y un marcador de pulso de radar.
4. **Filtrado Dinámico en Vivo:** Panel de control interactivo que permite encender y apagar capas de transporte (solo EMT, solo VTC, etc.) renderizando el mapa al instante mediante estados de React.
5. **Popups Inteligentes:** Sistema de detalles al hacer clic en los vehículos que sigue al marcador mientras este se desplaza.

---

## ⚙️ Requisitos Previos
Para poder ejecutar este proyecto en tu máquina local, necesitarás tener instalado:
1. [Node.js](https://nodejs.org/es/) (v18 o superior recomendado).
2. **pnpm** (puedes instalarlo ejecutando `npm install -g pnpm` en tu terminal).
3. Un token público gratuito de [Mapbox](https://www.mapbox.com/) para renderizar el mapa interactivo.

---

## 🚀 Guía de Instalación y Ejecución

El proyecto está dividido en dos servicios que deben ejecutarse simultáneamente: el **Backend** (puerto 3000) y el **Frontend** (puerto 5173).

### Paso 1: Levantar el Backend (API REST)
Abre una terminal y ejecuta los siguientes comandos:

```bash
# 1. Entra en la carpeta del servidor
cd citypulse-backend

# 2. Instala las dependencias
pnpm install

# 3. Inicia el servidor en modo desarrollo
pnpm dev
```

### Paso 2: Configurar y Levantar el Frontend
Abre una nueva pestaña en tu terminal (sin cerrar la del backend) y ejecuta:

```bash
# 1. Entra en la carpeta del cliente
cd citypulse-frontend

# 2. Instala las dependencias
pnpm install
```

### ⚠️ IMPORTANTE: Configuración de Variables de Entorno
Antes de arrancar el frontend, necesitas configurar la clave del mapa.

1. Crea un archivo llamado .env en la raíz de la carpeta citypulse-frontend.

2. Añade la siguiente línea con tu token de Mapbox:
VITE_MAPBOX_TOKEN=pk.tu_token_publico_de_mapbox_aqui

Una vez creado el archivo .env, arranca la aplicación:
### (Como ahora es una entrega para revision ya tiene un .env con mi API, obviamente de normal esto no se sube)

```bash
# 3. Inicia el frontend en modo desarrollo
pnpm dev
```

🧪 Qué probar en esta revisión
Landing Page: Scroll hacia abajo para ver el efecto paralaje/acercamiento de los vehículos con GSAP sobre el fondo de cristal (Glassmorphism).

Mapa Inmersivo: Ve a la pestaña "Mapa". Observa cómo los vehículos se mueven solos recibiendo los datos del backend.

Panel de Filtros: Usa el menú lateral izquierdo para ocultar los taxis o los VTC. El mapa se limpiará al instante.

Botón de Ubicación: Pulsa el icono de la diana (abajo a la derecha) y acepta los permisos del navegador para ver la animación de vuelo hacia tu ubicación real.


### Autor: Rafael Macías Peláez
### Curso: 2º DAW - IES Portada Alta (2025/2026)