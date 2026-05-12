import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// --- NUEVOS IMPORTS DE PRISMA Y SEGURIDAD ---
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto'; 
import nodemailer from 'nodemailer'; // <-- IMPORTAMOS EL CARTERO DIGITAL

// Cargar variables de entorno (¡Debe ir antes de usar process.env!)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- NUEVA INICIALIZACIÓN DE PRISMA (Con Adaptador) ---
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- CONFIGURACIÓN DEL SERVIDOR HTTP Y SOCKET.IO ---
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // URL de tu frontend
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors()); 
app.use(express.json({ limit: '10mb' }));

// --- CONFIGURACIÓN DE CORREO (NODEMAILER) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Comprobamos si el correo conecta bien al arrancar el servidor
transporter.verify().then(() => {
  console.log('📧 Servidor SMTP listo para enviar correos desde:', process.env.EMAIL_USER);
}).catch((error) => {
  console.error('❌ Error al conectar con el correo:', error);
});


// ==============================================================
// --- MOTOR DE SIMULACIÓN DEFINITIVO (API MAPBOX DIRECTIONS) ---
// ==============================================================

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN; 

// Puntos de inicio y fin de las rutas principales
const ROUTE_ENDPOINTS = {
  alameda: { start: "-4.4253,36.7169", end: "-4.4103,36.7205" },   // Puente Tetuán a Plaza Torrijos
  victoria: { start: "-4.4168,36.7237", end: "-4.4111,36.7278" },  // Plaza Merced a Victoria
  maritimo: { start: "-4.4093,36.7188", end: "-4.3982,36.7215" },  // Farola a Baños del Carmen
  carmen: { start: "-4.4300,36.7170", end: "-4.4235,36.7160" }     // Perchel a Muelle Heredia
};

// --- NUEVO: GENERADORES DE METADATOS REALISTAS PARA LOS POPUPS ---
const busDestinations = ['El Palo', 'Alameda Principal', 'Teatinos', 'Ciudad Jardín', 'Campanillas', 'Huelin', 'Paseo del Parque'];
const driverNames = ['Carlos R.', 'Lucía M.', 'Antonio G.', 'Marta F.', 'Javier L.', 'Elena S.', 'Miguel Á.', 'Sofía P.'];
const vtcCars = ['Toyota Corolla', 'Skoda Superb', 'Kia Octavia', 'Tesla Model 3', 'Hyundai Kona'];
const carColors = ['Negro', 'Blanco', 'Gris Oscuro', 'Azul Marino'];
const plateLetters = ['LXT', 'KZZ', 'JTR', 'MDX', 'LMW', 'KPS'];

const generateMetadata = (type, label) => {
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomPlate = () => `${Math.floor(1000 + Math.random() * 9000)} ${randomItem(plateLetters)}`;

  if (type === 'bus') {
    return { destination: randomItem(busDestinations) };
  }
  if (type === 'metro') {
    return { destination: label === 'Línea 1' ? 'Atarazanas / Andalucía Tech' : 'Guadalmedina / Palacio Deportes' };
  }
  if (type === 'taxi') {
    return { 
      driver: randomItem(driverNames), 
      occupied: Math.random() > 0.4, // 60% de probabilidad de estar ocupado
      license: randomPlate() 
    };
  }
  if (type === 'vtc') {
    return { 
      driver: randomItem(driverNames), 
      rating: (4.2 + Math.random() * 0.8).toFixed(1), // Nota entre 4.2 y 5.0
      carModel: randomItem(vtcCars), 
      carColor: randomItem(carColors), 
      license: randomPlate() 
    };
  }
  return {};
};
// --- FIN METADATOS ---

let activeVehicles = [];
let vehicleIdCounter = 1;
let PATHS = {}; // Aquí guardaremos las geometrías reales descargadas

// 1. FUNCIÓN: Añadir más puntos intermedios a la ruta de Mapbox para que el CSS sea suave
const densifyPath = (coords) => {
  const dense = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    dense.push(p1);
    
    // Calculamos la distancia pitagórica simple
    const dist = Math.sqrt(Math.pow(p2.lng - p1.lng, 2) + Math.pow(p2.lat - p1.lat, 2));
    // Añadimos un punto intermedio para que el coche avance poco a poco
    const steps = Math.ceil(dist / 0.0001); 
    
    for (let j = 1; j < steps; j++) {
      dense.push({
        lat: p1.lat + (p2.lat - p1.lat) * (j / steps),
        lng: p1.lng + (p2.lng - p1.lng) * (j / steps)
      });
    }
  }
  dense.push(coords[coords.length - 1]);
  return [...dense, ...dense.slice().reverse()]; // Ida y vuelta infinita
};

// 2. FUNCIÓN: Descargar la ruta real de las calles desde Mapbox
const fetchRealStreetPath = async (startCoords, endCoords) => {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords};${endCoords}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.routes && data.routes.length > 0) {
      // Mapbox devuelve [lng, lat], lo pasamos a {lat, lng} para nuestro frontend
      const rawCoords = data.routes[0].geometry.coordinates.map(c => ({ lng: c[0], lat: c[1] }));
      return densifyPath(rawCoords);
    }
  } catch (error) {
    console.error("Error obteniendo ruta real de Mapbox:", error);
  }
  return []; // Fallback seguro en caso de error
};

// --- ACTUALIZADO: Añadimos la llamada a generateMetadata() ---
const createVehicle = (type, label, path, color) => ({
  id: `${type}-${vehicleIdCounter++}`,
  type, label, color, path,
  currentStep: Math.floor(Math.random() * path.length), // Nacen en un punto aleatorio del trayecto
  lat: 0, lng: 0,
  metadata: generateMetadata(type, label) // Inyectamos los datos en el momento de crear el vehículo
});

// 3. INICIALIZADOR ASÍNCRONO DEL MOTOR
const initSimulation = async () => {
  console.log("🗺️ Descargando red de calles reales desde Mapbox...");
  
  PATHS.alameda = await fetchRealStreetPath(ROUTE_ENDPOINTS.alameda.start, ROUTE_ENDPOINTS.alameda.end);
  PATHS.victoria = await fetchRealStreetPath(ROUTE_ENDPOINTS.victoria.start, ROUTE_ENDPOINTS.victoria.end);
  PATHS.maritimo = await fetchRealStreetPath(ROUTE_ENDPOINTS.maritimo.start, ROUTE_ENDPOINTS.maritimo.end);
  PATHS.carmen = await fetchRealStreetPath(ROUTE_ENDPOINTS.carmen.start, ROUTE_ENDPOINTS.carmen.end);

  // Si no tenemos token, ponemos un aviso para que no explote
  if (!PATHS.alameda || PATHS.alameda.length === 0) {
    console.log("⚠️ No se pudo cargar Mapbox en el servidor. Revisa el MAPBOX_TOKEN en el .env");
    return;
  }

  // Poblamos los vehículos usando las rutas reales descargadas
  activeVehicles.push(createVehicle('metro', 'Línea 1', PATHS.carmen, 'bg-emerald-500'));
  activeVehicles.push(createVehicle('metro', 'Línea 2', PATHS.carmen, 'bg-emerald-500'));

  for(let i=1; i<=6; i++) activeVehicles.push(createVehicle('bus', `Línea ${i}`, PATHS.alameda, 'bg-blue-500'));
  for(let i=7; i<=10; i++) activeVehicles.push(createVehicle('bus', `Línea ${i}`, PATHS.victoria, 'bg-blue-500'));
  
  for(let i=1; i<=3; i++) activeVehicles.push(createVehicle('vtc', `Uber ${i}`, PATHS.maritimo, 'bg-slate-900'));
  for(let i=4; i<=5; i++) activeVehicles.push(createVehicle('vtc', `Cabify ${i}`, PATHS.carmen, 'bg-slate-900'));
  
  for(let i=1; i<=5; i++) activeVehicles.push(createVehicle('taxi', `Taxi ${i}`, PATHS.alameda, 'bg-yellow-400'));

  console.log("✅ Simulación iniciada con vehículos anclados a las calles reales.");
};

// Arrancamos la descarga de datos al iniciar el servidor
initSimulation();

// --- LÓGICA DE WEBSOCKETS ---
io.on('connection', (socket) => {
  console.log(`🔌 Nuevo cliente conectado (ID: ${socket.id})`);
  
  // Enviamos los vehículos de inmediato al conectar
  socket.emit('vehiclesUpdate', activeVehicles);

  // ESCUCHAMOS SI EL USUARIO PIDE VEHÍCULOS CERCA DE SU UBICACIÓN
  socket.on('spawnNearMe', async (coords) => {
    console.log(`📍 Usuario pidió vehículos cerca de: ${coords.lat}, ${coords.lng}`);
    
    // Si el usuario pide vehículos, creamos una ruta real dinámica desde su ubicación hasta el centro
    const userCoords = `${coords.lng},${coords.lat}`;
    const dynamicPath = await fetchRealStreetPath(userCoords, ROUTE_ENDPOINTS.alameda.end);
    
    if (dynamicPath.length > 0) {
      activeVehicles.push(createVehicle('taxi', 'Taxi Cercano', dynamicPath, 'bg-yellow-400'));
      activeVehicles.push(createVehicle('vtc', 'VTC Cercano', dynamicPath, 'bg-slate-900'));
      
      // Forzamos actualización inmediata para que los vea aparecer
      io.emit('vehiclesUpdate', activeVehicles);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado (ID: ${socket.id})`);
  });
});

// EL MOTOR DE MOVIMIENTO (2 segundos)
setInterval(() => {
  if (activeVehicles.length === 0) return; // Esperamos a que se descarguen las rutas

  activeVehicles.forEach(vehicle => {
    if (vehicle.path && vehicle.path.length > 0) {
      vehicle.lat = vehicle.path[vehicle.currentStep].lat;
      vehicle.lng = vehicle.path[vehicle.currentStep].lng;
      vehicle.currentStep = (vehicle.currentStep + 1) % vehicle.path.length;
    }
  });
  
  io.emit('vehiclesUpdate', activeVehicles);
}, 2000); 

// ==========================================
// --- RUTAS REST CLÁSICAS (ENDPOINTS) ---
// ==========================================

app.get('/api/status', (req, res) => {
  res.json({ status: 'Online', message: 'Bienvenido al backend de CityPulse 🚀' });
});

// --- RUTA: REGISTRO DE USUARIOS ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Este correo electrónico ya está registrado.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        verificationToken: verificationToken,
        isActive: false 
      }
    });

    const verificationLink = `http://localhost:5173/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"CityPulse" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Activa tu cuenta en CityPulse',
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #1e3a8a;">¡Bienvenido a CityPulse, ${name}!</h2>
          <p style="color: #374151;">Gracias por unirte a nuestra plataforma. Para empezar a gestionar tus rutas, necesitamos que confirmes tu cuenta haciendo clic en el siguiente botón:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirmar mi cuenta</a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="color: #2563eb; font-size: 13px; word-break: break-all;">${verificationLink}</p>
          <p style="color: #6b7280; font-size: 13px;">Si no te registraste en CityPulse, simplemente ignora este correo.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de activación enviado a ${email}`);

    res.status(201).json({
      message: '¡Usuario registrado con éxito! Revisa tu correo para activar la cuenta.'
    });

  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- RUTA: VERIFICAR EMAIL ---
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      return res.status(400).json({ error: 'El token de verificación es inválido o la cuenta ya está activada.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isActive: true, 
        verificationToken: null 
      }
    });

    res.status(200).json({ message: 'Cuenta activada con éxito.' });
  } catch (error) {
    console.error("Error al verificar email:", error);
    res.status(500).json({ error: 'Error al activar la cuenta.' });
  }
});

// --- RUTA: INICIO DE SESIÓN ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario, correo o contraseña incorrectos.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Usuario, correo o contraseña incorrectos.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Debes confirmar tu cuenta revisando tu correo antes de poder entrar.' });
    }

    res.status(200).json({
      message: '¡Inicio de sesión exitoso!',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar 
      }
    });

  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- RUTA: ACTUALIZAR PERFIL ---
app.put('/api/auth/profile', async (req, res) => {
  try {
    const { id, name, username, email, password, avatar } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Falta el ID del usuario.' });
    }

    const updateData = {
      name,
      username,
      email,
      ...(avatar && { avatar })
    };

    if (password && password.trim() !== '') {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData
    });

    res.status(200).json({
      message: 'Perfil actualizado con éxito',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar
      }
    });

  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ error: 'Error interno al actualizar.' });
  }
});

// --- RUTA: SOLICITAR RECUPERACIÓN DE CONTRASEÑA ---
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(200).json({ message: 'Si el correo existe, recibirás instrucciones.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); 

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry }
    });

    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"CityPulse" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recupera tu contraseña de CityPulse',
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #1e3a8a;">CityPulse - Recuperación de contraseña</h2>
          <p style="color: #374151;">Hola ${user.name},</p>
          <p style="color: #374151;">Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Restablecer mi contraseña</a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="color: #2563eb; font-size: 13px; word-break: break-all;">${resetLink}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Si no has solicitado este cambio, ignora este correo. El enlace caducará en 1 hora.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de recuperación enviado correctamente a ${email}`);

    res.status(200).json({ message: 'Si el correo existe, recibirás instrucciones.' });

  } catch (error) {
    console.error("Error en forgot-password:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- RUTA: ESTABLECER LA NUEVA CONTRASEÑA ---
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'El enlace es inválido o ha caducado.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.status(200).json({ message: 'Contraseña actualizada con éxito.' });

  } catch (error) {
    console.error("Error en reset-password:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- RUTA: SOLICITAR BORRADO DE CUENTA ---
app.post('/api/auth/request-delete', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const deleteToken = crypto.randomBytes(32).toString('hex');
    const deleteTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { email },
      data: { deleteToken, deleteTokenExpiry }
    });

    const deleteLink = `http://localhost:5173/confirm-delete?token=${deleteToken}`;
    
    const mailOptions = {
      from: `"CityPulse" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Solicitud de eliminación de cuenta - CityPulse',
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 10px;">
          <h2 style="color: #991b1b;">Eliminación de cuenta</h2>
          <p>Hola ${user.name},</p>
          <p>Hemos recibido una solicitud para eliminar permanentemente tu cuenta de CityPulse. Al hacerlo, tus datos personales serán borrados.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${deleteLink}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Eliminar mi cuenta definitivamente</a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Si no has sido tú, ignora este correo y cambia tu contraseña por seguridad.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Correo de confirmación enviado.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud.' });
  }
});

// --- RUTA: CONFIRMAR BORRADO (ANONIMIZACIÓN) ---
app.get('/api/auth/confirm-delete', async (req, res) => {
  try {
    const { token } = req.query;

    const user = await prisma.user.findFirst({
      where: { deleteToken: token, deleteTokenExpiry: { gt: new Date() } }
    });

    if (!user) return res.status(400).json({ error: 'El enlace ha caducado o es inválido.' });

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        name: 'Usuario Eliminado',
        email: `deleted_${user.id}@citypulse.local`, 
        username: null,
        avatar: null,
        password: '', 
        isActive: false,
        deleteToken: null,
        deleteTokenExpiry: null
      }
    });

    res.status(200).json({ message: 'Cuenta eliminada con éxito.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la cuenta.' });
  }
});

// ==========================================
// --- RUTAS: GESTIÓN DE TRAYECTOS ---
// ==========================================

// 1. GUARDAR UNA NUEVA RUTA
app.post('/api/routes', async (req, res) => {
  try {
    const { name, originLat, originLng, destLat, destLng, distance, duration, userId } = req.body;
    
    const newRoute = await prisma.route.create({
      data: {
        name,
        originLat,
        originLng,
        destLat,
        destLng,
        distance: parseFloat(distance),
        duration: parseInt(duration),
        userId
      }
    });

    res.status(201).json(newRoute);
  } catch (error) {
    console.error("Error al guardar la ruta:", error);
    res.status(500).json({ error: 'Error al guardar la ruta en la base de datos.' });
  }
});

// 2. OBTENER LAS RUTAS DE UN USUARIO
app.get('/api/routes/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const routes = await prisma.route.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' } 
    });
    
    res.status(200).json(routes);
  } catch (error) {
    console.error("Error al obtener rutas:", error);
    res.status(500).json({ error: 'Error al obtener tus rutas.' });
  }
});

// 3. BORRAR UNA RUTA
app.delete('/api/routes/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;
    await prisma.route.delete({
      where: { id: routeId }
    });
    
    res.status(200).json({ message: 'Ruta eliminada correctamente.' });
  } catch (error) {
    console.error("Error al borrar ruta:", error);
    res.status(500).json({ error: 'Error al eliminar la ruta.' });
  }
});

// --- ARRANCAR EL SERVIDOR ---
httpServer.listen(PORT, () => {
  console.log(`✅ Servidor Express + WebSockets corriendo en http://localhost:${PORT}`);
});