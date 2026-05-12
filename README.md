# 🏙️ CityPulse - Plataforma de Transporte Urbano en Tiempo Real

**CityPulse** es una aplicación web Full-Stack desarrollada para centralizar y visualizar en tiempo real diferentes medios de transporte urbano (EMT, Metro, VTC, Taxis) en un único mapa interactivo.

> **Nota:** Esta versión incluye la **Gestión Completa de Usuarios y Seguridad** junto al núcleo principal de la aplicación: un mapa interactivo conectado por WebSockets a un servidor Node.js que transmite datos de flotas en tiempo real, geolocalización del usuario y un sistema de autenticación robusto con envío de correos reales.

---

## 🛠️ Stack Tecnológico
* **Frontend:** React, Vite, TailwindCSS (v3), Lucide React, React Router.
* **Mapas y UI:** Mapbox GL JS (`react-map-gl`), Popups interactivos.
* **Animaciones:** GSAP + ScrollTrigger (Landing Page).
* **Backend:** Node.js, Express, CORS, API Mapbox Directions (en caché).
* **Base de Datos:** PostgreSQL (alojada en Supabase) + **Prisma ORM**.
* **Tiempo Real:** **Socket.IO** (Comunicación bidireccional cliente-servidor).
* **Seguridad y Auth:** `bcrypt` (encriptación), `crypto` (tokens seguros), `nodemailer` (envío de emails reales).
* **Gestor de paquetes:** `pnpm`.

---

## 🚀 Novedades de esta Versión

### 🔐 Sistema de Autenticación y Seguridad
1. **Registro con Verificación:** Creación de cuentas con envío de correo real (Nodemailer) para activar la cuenta mediante token seguro.
2. **Recuperación de Contraseña:** Flujo completo de "He olvidado mi contraseña" con enlaces de un solo uso y caducidad de 1 hora.
3. **Gestión de Perfil:** Panel privado para actualizar datos y subir una foto de perfil (convertida a Base64).
4. **Cumplimiento RGPD (Borrado Lógico):** Sistema de eliminación de cuenta mediante "anonimización". Se borran los datos personales del usuario pero se mantienen sus estadísticas/rutas en la base de datos bajo un ID anónimo, previa confirmación por email.

### 🗺️ Motor de Tiempo Real y Mapa Avanzado (Actualizado)
1. **Simulación Realista de Flotas:** El backend consume la API de Mapbox Directions al arrancar para anclar los vehículos a las geometrías exactas de las calles reales, evitando que atraviesen edificios.
2. **Movimiento Ultra-Fluido:** Densificación de coordenadas en el servidor sincronizadas con transiciones CSS en el cliente para un movimiento orgánico.
3. **Popups Enriquecidos y Dinámicos:** Los vehículos muestran metadatos generados de forma realista (nombres de conductores, matrículas, valoraciones, estado libre/ocupado) según su tipo (Taxi, VTC, EMT).
4. **Generación por Proximidad:** Al solicitar la ubicación, el servidor calcula mediante trigonometría la calle real más cercana y despliega vehículos de refuerzo patrullando esa zona.
5. **Creación y Guardado de Rutas:** Panel interactivo para trazar rutas del Punto A al Punto B, calculando distancia y tiempo, con capacidad de guardarlas en la base de datos del usuario y visualizarlas desde su perfil.

---

## ⚙️ Requisitos Previos
Para poder ejecutar este proyecto en tu máquina local, necesitarás tener instalado:
1. [Node.js](https://nodejs.org/es/) (v18 o superior recomendado).
2. **pnpm** (puedes instalarlo ejecutando `npm install -g pnpm` en tu terminal).

---

## 🚀 Guía de Instalación y Ejecución

El proyecto está dividido en dos servicios que deben ejecutarse simultáneamente: el **Backend** (puerto 3000) y el **Frontend** (puerto 5173).

### Paso 1: Configurar y Levantar el Backend (API REST)
Abre una terminal y ejecuta los siguientes comandos:

```bash
# 1. Entra en la carpeta del servidor
cd citypulse-backend

# 2. Instala las dependencias
pnpm install

# 3. Sincroniza la base de datos con Prisma
npx prisma generate
npx prisma db push

# 4. Inicia el servidor en modo desarrollo
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
Flujo de Seguridad: Regístrate con un correo real. Comprueba que te llega el email de activación. Prueba a cerrar sesión y solicitar una recuperación de contraseña.

Gestión de Perfil y Rutas: Inicia sesión y ve al mapa. Abre el panel lateral, traza una ruta y guárdala. Luego, ve a "Mi Perfil", entra en la pestaña de Rutas y comprueba que puedes previsualizarla o eliminarla.

Simulación Realista: Acércate a la Alameda Principal o la Plaza de la Merced. Observa cómo los autobuses y VTCs trazan las curvas exactas de las calles. Haz clic en ellos para ver sus datos dinámicos simulados (matrículas, conductores, ocupación).

Generación Dinámica: Pulsa el icono de la diana (abajo a la derecha) en el mapa y acepta los permisos para volar a tu ubicación real. El servidor generará instantáneamente Taxis y VTCs patrullando la calle real más cercana a ti.


### Autor: Rafael Macías Peláez
### Curso: 2º DAW - IES Portada Alta (2025/2026)