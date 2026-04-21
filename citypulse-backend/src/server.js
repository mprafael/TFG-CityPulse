import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http'; // NUEVO: Servidor nativo de Node
import { Server } from 'socket.io';  // NUEVO: Motor de WebSockets

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN DEL SERVIDOR HTTP Y SOCKET.IO ---
// Envolvemos Express con el servidor HTTP nativo
const httpServer = createServer(app);

// Configuramos Socket.IO con los permisos de CORS para Vite
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // URL de tu frontend (ajusta si es otra)
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors()); 
app.use(express.json()); 

// --- DATOS SIMULADOS (MOCK) ---
const DUMMY_VEHICLES = [
  { id: 'emt-1', type: 'bus', lat: 36.7213, lng: -4.4214, label: 'Línea 1', color: 'bg-blue-500' },
  { id: 'emt-2', type: 'bus', lat: 36.7185, lng: -4.4250, label: 'Línea 3', color: 'bg-blue-500' },
  { id: 'vtc-1', type: 'vtc', lat: 36.7250, lng: -4.4180, label: 'Uber', color: 'bg-slate-900' },
  { id: 'taxi-1', type: 'taxi', lat: 36.7200, lng: -4.4150, label: 'Taxi', color: 'bg-yellow-400 text-black' },
];

// --- LÓGICA DE WEBSOCKETS (TIEMPO REAL) ---
io.on('connection', (socket) => {
  console.log(`🔌 Nuevo cliente conectado (ID: ${socket.id})`);

  // Nada más conectarse, le enviamos la posición actual
  socket.emit('vehiclesUpdate', DUMMY_VEHICLES);

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado (ID: ${socket.id})`);
  });
});

// EL MOTOR DE MOVIMIENTO: Cada 2 segundos (2000ms) movemos los vehículos
setInterval(() => {
  DUMMY_VEHICLES.forEach(vehicle => {
    // Generamos un movimiento aleatorio súper pequeño (simulando conducción)
    const deltaLat = (Math.random() - 0.5) * 0.0005; 
    const deltaLng = (Math.random() - 0.5) * 0.0005;

    vehicle.lat += deltaLat;
    vehicle.lng += deltaLng;
  });

  // Emitimos el evento 'vehiclesUpdate' a TODOS los clientes conectados
  io.emit('vehiclesUpdate', DUMMY_VEHICLES);
}, 2000);


// --- RUTAS REST CLÁSICAS (ENDPOINTS) ---
app.get('/api/status', (req, res) => {
  res.json({ status: 'Online', message: 'Bienvenido al backend de CityPulse 🚀' });
});

app.get('/api/vehicles', (req, res) => {
  res.json(DUMMY_VEHICLES);
});

// --- ARRANCAR EL SERVIDOR ---
// IMPORTANTE: Ahora usamos httpServer.listen en lugar de app.listen
httpServer.listen(PORT, () => {
  console.log(`✅ Servidor Express + WebSockets corriendo en http://localhost:${PORT}`);
});