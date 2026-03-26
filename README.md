# 🏙️ CityPulse - Plataforma de Transporte Urbano en Tiempo Real

**CityPulse** es una aplicación web Full-Stack desarrollada para centralizar y visualizar en tiempo real diferentes medios de transporte urbano (EMT, Metro, VTC, Taxis) en un único mapa interactivo.

> **Nota para el evaluador:** Esta es la **primera entrega (MVP)** del proyecto. Actualmente cuenta con la interfaz de usuario completa, navegación funcional, integración de mapas mediante Mapbox y un servidor Backend que provee una API REST con datos simulados de vehículos en Málaga para comprobar la comunicación cliente-servidor.

---

## 🛠️ Stack Tecnológico Actual (PERN Stack en progreso)
* **Frontend:** React, Vite, TailwindCSS (v3), Mapbox GL JS, React Router, Lucide React.
* **Backend:** Node.js, Express, CORS.
* **Gestor de paquetes:** `pnpm` (recomendado por velocidad y eficiencia).

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

```bash
# 3. Inicia el frontend en modo desarrollo
pnpm dev
```

🧪 ¿Qué probar en esta versión?
Una vez que ambos servidores estén corriendo, puedes probar las siguientes funcionalidades:

Navegación fluida (SPA): Navega entre la página de Inicio, Login y Perfil sin recargas de página.

Mapa Interactivo: Ve a la pestaña "Mapa". Verás un mapa centrado en Málaga capital.

Comunicación Full-Stack: Al cargar el mapa, el Frontend realiza una petición fetch al Backend (/api/vehicles). El servidor responde con los datos y el mapa dibuja automáticamente los marcadores (autobuses, VTC y taxis) con estilos dinámicos de Tailwind CSS.


### Autor: Rafael Macías Peláez
### Curso: 2º DAW - IES Portada Alta (2025/2026)