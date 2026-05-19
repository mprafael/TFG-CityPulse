import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import nodemailer from 'nodemailer';
import createAdminRoutes from './routes/adminRoutes.js';

import { initSimulation, spawnVehiclesNear, updateSimulationState, getActiveVehicles } from './services/simulationEngine.js';
import createAuthRoutes from './routes/authRoutes.js';
import createMapRoutes from './routes/mapRoutes.js';

// Configuration
const PORT = process.env.PORT || 3000;

// Database Initialization
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Email Service Initialization
const transporter = nodemailer.createTransport({
  host: '142.251.10.108',
  port: 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify().then(() => {
  console.log('[SMTP] Service ready.');
}).catch((error) => console.error('[SMTP] Connection error:', error));

// NUEVO: Configuración de orígenes permitidos (Local + Producción en Vercel)
const originPermitidos = ['http://localhost:5173', 'https://tfg-city-pulse.vercel.app'];

// Express Application Setup
const app = express();
app.use(cors({
  origin: originPermitidos,
  credentials: true
})); 
app.use(express.json({ limit: '10mb' }));

// API Routes
app.get('/api/status', (req, res) => res.json({ status: 'Online', service: 'CityPulse Backend' }));
app.use('/api/auth', createAuthRoutes(prisma, transporter));
app.use('/api/admin', createAdminRoutes(prisma));
app.use('/api/routes', createMapRoutes(prisma));

// WebSockets Setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { 
    origin: originPermitidos, 
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Simulation Engine Initialization
initSimulation();

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.emit('vehiclesUpdate', getActiveVehicles());

  socket.on('spawnNearMe', async (coords) => {
    const updatedVehicles = await spawnVehiclesNear(coords);
    io.emit('vehiclesUpdate', updatedVehicles);
  });

  socket.on('disconnect', () => console.log(`[Socket.io] Client disconnected: ${socket.id}`));
});

// Main Simulation Loop
setInterval(() => {
  const updatedState = updateSimulationState();
  if(updatedState.length > 0) io.emit('vehiclesUpdate', updatedState);
}, 2000); 

// Start Server
httpServer.listen(PORT, () => {
  console.log(`[Server] Express and WebSockets running on port ${PORT}`);
});