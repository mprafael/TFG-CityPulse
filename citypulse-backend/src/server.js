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

// --- DATOS SIMULADOS (MOCK) PARA EL MAPA ---
const DUMMY_VEHICLES = [
  { id: 'emt-1', type: 'bus', lat: 36.7213, lng: -4.4214, label: 'Línea 1', color: 'bg-blue-500' },
  { id: 'emt-2', type: 'bus', lat: 36.7185, lng: -4.4250, label: 'Línea 3', color: 'bg-blue-500' },
  { id: 'vtc-1', type: 'vtc', lat: 36.7250, lng: -4.4180, label: 'Uber', color: 'bg-slate-900' },
  { id: 'taxi-1', type: 'taxi', lat: 36.7200, lng: -4.4150, label: 'Taxi', color: 'bg-yellow-400 text-black' },
  { id: 'metro-1', type: 'metro', lat: 36.7170, lng: -4.4300, label: 'Línea 1 (Atarazanas)', color: 'bg-emerald-500' },
  { id: 'metro-2', type: 'metro', lat: 36.7150, lng: -4.4400, label: 'Línea 2 (Guadalmedina)', color: 'bg-emerald-500' },
];

// --- LÓGICA DE WEBSOCKETS (TIEMPO REAL) ---
io.on('connection', (socket) => {
  console.log(`🔌 Nuevo cliente conectado (ID: ${socket.id})`);
  socket.emit('vehiclesUpdate', DUMMY_VEHICLES);
  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado (ID: ${socket.id})`);
  });
});

// EL MOTOR DE MOVIMIENTO
setInterval(() => {
  DUMMY_VEHICLES.forEach(vehicle => {
    const deltaLat = (Math.random() - 0.5) * 0.0005; 
    const deltaLng = (Math.random() - 0.5) * 0.0005;
    vehicle.lat += deltaLat;
    vehicle.lng += deltaLng;
  });
  io.emit('vehiclesUpdate', DUMMY_VEHICLES);
}, 2000);


// --- RUTAS REST CLÁSICAS (ENDPOINTS) ---
app.get('/api/status', (req, res) => {
  res.json({ status: 'Online', message: 'Bienvenido al backend de CityPulse 🚀' });
});

app.get('/api/vehicles', (req, res) => {
  res.json(DUMMY_VEHICLES);
});

// --- RUTA: REGISTRO DE USUARIOS (ACTUALIZADA CON EMAIL) ---
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

    // 1. Generamos un token de activación
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 2. Creamos el usuario DESACTIVADO
    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        verificationToken: verificationToken,
        isActive: false // El usuario no puede entrar hasta que confirme
      }
    });

    // 3. Enviamos el correo de confirmación
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

// --- NUEVA RUTA: VERIFICAR EMAIL ---
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
        verificationToken: null // Limpiamos el token una vez usado por seguridad
      }
    });

    res.status(200).json({ message: 'Cuenta activada con éxito.' });
  } catch (error) {
    console.error("Error al verificar email:", error);
    res.status(500).json({ error: 'Error al activar la cuenta.' });
  }
});

// --- RUTA: INICIO DE SESIÓN (ACTUALIZADA) ---
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

    // BLOQUEO: Si la cuenta no está activa, no le dejamos pasar
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

    // 1. Generamos token seguro y caducidad (1 hora)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); 

    // 2. Guardamos en Supabase
    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry }
    });

    // 3. Generamos el enlace para el frontend
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    // 4. Preparamos el correo en HTML
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

    // 5. Enviamos el correo con nodemailer
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

    // EL TRUCO DEL PROFESOR: Anonimizamos al usuario en vez de borrarlo
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        name: 'Usuario Eliminado',
        email: `deleted_${user.id}@citypulse.local`, // Liberamos su email real
        username: null,
        avatar: null,
        password: '', // Borramos su contraseña
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

// --- ARRANCAR EL SERVIDOR ---
httpServer.listen(PORT, () => {
  console.log(`✅ Servidor Express + WebSockets corriendo en http://localhost:${PORT}`);
});