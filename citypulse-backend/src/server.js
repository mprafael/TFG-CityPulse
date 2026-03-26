import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno (por si luego ponemos puertos o contraseñas)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permite peticiones desde tu frontend (Vite)
app.use(express.json()); // Permite recibir datos en formato JSON

// --- DATOS SIMULADOS (MOCK) ---
// En el futuro, esto saldrá de PostgreSQL + PostGIS
const DUMMY_VEHICLES = [
  { id: 'emt-1', type: 'bus', lat: 36.7213, lng: -4.4214, label: 'Línea 1', color: 'bg-blue-500' },
  { id: 'emt-2', type: 'bus', lat: 36.7185, lng: -4.4250, label: 'Línea 3', color: 'bg-blue-500' },
  { id: 'vtc-1', type: 'vtc', lat: 36.7250, lng: -4.4180, label: 'Uber', color: 'bg-slate-900' },
  { id: 'taxi-1', type: 'taxi', lat: 36.7200, lng: -4.4150, label: 'Taxi', color: 'bg-yellow-400 text-black' },
];

// --- RUTAS (ENDPOINTS) ---

// Ruta de estado para comprobar que el servidor funciona
app.get('/api/status', (req, res) => {
  res.json({ status: 'Online', message: 'Bienvenido al backend de CityPulse 🚀' });
});

// Ruta para obtener los vehículos en tiempo real (simulado de momento)
app.get('/api/vehicles', (req, res) => {
  res.json(DUMMY_VEHICLES);
});

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor de CityPulse corriendo en http://localhost:${PORT}`);
  console.log(`📍 Vehículos disponibles en http://localhost:${PORT}/api/vehicles`);
});