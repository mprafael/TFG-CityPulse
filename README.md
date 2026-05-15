# 🏙️ CityPulse - Plataforma de Transporte Urbano en Tiempo Real

**CityPulse** es una aplicación web Full-Stack desarrollada para centralizar y visualizar en tiempo real diferentes medios de transporte urbano (EMT, Metro, VTC, Taxis) en un único mapa interactivo. 

Este proyecto ha sido desarrollado como **Trabajo Fin de Grado (TFG)** para el ciclo de Desarrollo de Aplicaciones Web (2º DAW). Combina una arquitectura de microservicios, comunicación bidireccional por WebSockets, y un sistema robusto de autenticación y gestión de bases de datos.

---

## ✨ Características Principales

### 🗺️ Motor de Tiempo Real y Simulación Avanzada
* **Simulación Realista de Flotas:** El servidor Node.js consume la API de Mapbox Directions en caché para anclar los vehículos simulados a las geometrías exactas de las calles de Málaga, evitando colisiones con edificios.
* **Movimiento Ultra-Fluido:** Densificación de coordenadas en el backend sincronizadas con transiciones CSS interpoladas en el cliente para un movimiento orgánico.
* **Generación por Proximidad:** Al solicitar la geolocalización, el servidor calcula mediante trigonometría la calle real más cercana al usuario y despliega vehículos de refuerzo (taxis/VTCs) patrullando esa zona específica vía WebSockets.
* **Popups Enriquecidos:** Los vehículos muestran metadatos generados dinámicamente (nombres de conductores, matrículas reales españolas, valoraciones, estado libre/ocupado) según su tipología.

### 🔐 Seguridad y Autenticación
* **Registro Verificado:** Creación de cuentas con envío de correos electrónicos reales (`nodemailer`) para la activación mediante tokens seguros.
* **Recuperación de Contraseña:** Flujo completo de "He olvidado mi contraseña" con enlaces de un solo uso y caducidad temporal (1 hora).
* **Cumplimiento RGPD (Borrado Lógico):** Sistema de eliminación de cuenta mediante "anonimización". Se purgan los datos personales (PII) pero se mantienen las estadísticas bajo un UUID anónimo, previa confirmación por email.
* **Seguridad de Base de Datos:** Políticas RLS (*Row Level Security*) habilitadas en Supabase para bloquear accesos no autorizados a la API pública, forzando todo el tráfico a través del backend.

### 👤 Panel de Usuario y Gestión de Rutas
* **Dashboard Privado:** Interfaz para actualizar datos personales, subir avatar (Base64) y gestionar la seguridad de la cuenta.
* **Routing Integrado:** Panel interactivo para trazar rutas, calculando distancia y tiempo estimado de llegada.
* **Almacenamiento de Rutas:** Capacidad de guardar trayectos frecuentes en la base de datos relacional y previsualizarlos o eliminarlos directamente desde el perfil.

---

## 🛠️ Stack Tecnológico y Arquitectura

El proyecto sigue los principios de **Clean Code** y **Separation of Concerns**, dividiendo la lógica de negocio, las rutas y la presentación visual.

* **Frontend (Arquitectura Presentacional/Contenedor):**
  * React, Vite, TailwindCSS (v3), Lucide React.
  * Mapbox GL JS (`react-map-gl`).
  * Animaciones: GSAP + ScrollTrigger.
* **Backend (Arquitectura Modular):**
  * Node.js, Express, CORS.
  * **Tiempo Real:** Socket.IO.
  * **Seguridad:** `bcrypt` (hashing), `crypto` (tokens), `nodemailer` (SMTP).
* **Base de Datos & ORM:**
  * PostgreSQL (Supabase).
  * Prisma ORM (con `@prisma/adapter-pg`).

---

## ⚙️ Requisitos Previos

Para ejecutar este proyecto en local, necesitarás:
1. [Node.js](https://nodejs.org/es/) (v18 o superior).
2. **pnpm** (gestor de paquetes recomendado: `npm install -g pnpm`).

---

## 🚀 Guía de Instalación y Ejecución

El proyecto está dividido en dos servicios: el **Backend** (puerto 3000) y el **Frontend** (puerto 5173). Ambos deben estar en ejecución simultáneamente.

### Paso 1: Configurar y Levantar el Backend (API REST)
Abre una terminal en la raíz del proyecto y ejecuta:

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

```bash
# 3. Inicia el frontend en modo desarrollo
pnpm dev
```

🧪 Guía de Pruebas (Tribunal / Evaluadores)
Para explorar todas las capacidades de la plataforma, se recomienda seguir este flujo:

Flujo de Seguridad: Regístrate con un correo electrónico real. Comprueba que recibes el email de activación. Cierra sesión y prueba el flujo de recuperación de contraseña.

Simulación Realista: Navega por el mapa hacia la "Alameda Principal" o "Plaza de la Merced". Observa cómo la flota se ciñe a la geometría exacta de las calles. Haz clic en los vehículos para ver sus metadatos dinámicos (matrículas, conductores, ocupación).

Generación Dinámica: Haz clic en el botón de geolocalización (icono de diana abajo a la derecha). El servidor detectará tu ubicación real e inyectará de inmediato vehículos VTC y Taxis patrullando las calles aledañas a tu posición.

Gestión de Perfil: Traza una ruta mediante el panel lateral izquierdo del mapa, guárdala y dirígete a "Mi Perfil". Comprueba la persistencia de datos (actualización de avatar, visualización de rutas almacenadas y opción de borrado lógico de la cuenta).

5. **Panel de Administración (Autorización):** El sistema cuenta con un control de roles basado en Middleware. Para probarlo, regístrate o inicia sesión utilizando el correo maestro `contacto.citypulse@gmail.com`. Al hacerlo, la interfaz revelará un acceso restringido al "Panel de Administración" desde el menú del perfil, permitiendo visualizar la base de datos completa de usuarios y forzar el borrado de cuentas de prueba.


### Autor: Rafael Macías Peláez
### Curso: 2º DAW - IES Portada Alta (2025/2026)
### Contacto / GitHub: @mprafael