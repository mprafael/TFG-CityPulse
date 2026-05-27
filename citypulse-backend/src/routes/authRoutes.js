import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Initializes and configures the authentication and user management routes.
 * Handles registration, login, profile updates, and secure email workflows (password reset, deletion).
 * * @param {Object} prisma - The instantiated Prisma Client for database access.
 * @param {Object} resend - The instantiated Resend client for transactional email delivery.
 * @returns {express.Router} The configured Express router.
 */
export default function createAuthRoutes(prisma, resend) {
    const router = express.Router();

    // Dynamically set the frontend URL for email links (Vercel in Prod, localhost in Dev)
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    /**
     * POST /api/auth/register
     * Registers a new user, hashes their password, generates a verification token, 
     * and sends an account activation email.
     */
    router.post('/register', async (req, res) => {
      try {
        const { name, email, password } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        
        if (existingUser) {
          return res.status(400).json({ error: 'Este correo ya está registrado.' });
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
    
        await prisma.user.create({
          data: { name, email, password: hashedPassword, verificationToken, isActive: false }
        });
    
        const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        await resend.emails.send({
          from: 'CityPulse <onboarding@resend.dev>',
          to: email,
          subject: 'Activa tu cuenta de CityPulse',
          html: `
            <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
              <h2 style="color: #1e3a8a;">¡Bienvenido a CityPulse, ${name}!</h2>
              <p style="color: #374151;">Por favor, confirma tu cuenta haciendo clic en el botón de abajo:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirmar Cuenta</a>
              </div>
              <p style="color: #6b7280; font-size: 13px;">O copia y pega este enlace: <br> ${verificationLink}</p>
            </div>
          `
        });
    
        res.status(201).json({ message: 'Usuario registrado. Revisa tu correo para activar la cuenta.' });
    
      } catch (error) {
        console.error("[Auth] Registration Error:", error);
        res.status(500).json({ error: 'Error interno del servidor.' });
      }
    });
    
    /**
     * GET /api/auth/verify-email
     * Activates a user account by validating the token sent to their email.
     */
    router.get('/verify-email', async (req, res) => {
      try {
        const { token } = req.query;
        const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    
        if (!user) return res.status(400).json({ error: 'El enlace es inválido o ha caducado.' });
    
        await prisma.user.update({
          where: { id: user.id },
          data: { isActive: true, verificationToken: null }
        });
    
        res.status(200).json({ message: 'Cuenta activada correctamente.' });
      } catch (error) {
        console.error("[Auth] Verification Error:", error);
        res.status(500).json({ error: 'Error interno del servidor.' });
      }
    });
    
    /**
     * POST /api/auth/login
     * Authenticates a user using either their email or username and verifies their password.
     * Prevents login if the account is pending email activation.
     */
    router.post('/login', async (req, res) => {
      try {
        const { identifier, password } = req.body;
        const user = await prisma.user.findFirst({
          where: { OR: [{ email: identifier }, { username: identifier }] }
        });
    
        if (!user || !(await bcrypt.compare(password, user.password))) {
          return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }
    
        if (!user.isActive) {
          return res.status(403).json({ error: 'Cuenta pendiente de activación. Revisa tu correo.' });
        }
    
        res.status(200).json({
          message: 'Inicio de sesión correcto',
          user: { id: user.id, name: user.name, username: user.username, email: user.email, avatar: user.avatar }
        });
    
      } catch (error) {
        console.error("[Auth] Login Error:", error);
        res.status(500).json({ error: 'Error interno del servidor.' });
      }
    });
    
    /**
     * PUT /api/auth/profile
     * Updates user profile information. Conditionally hashes and updates the password if provided.
     */
    router.put('/profile', async (req, res) => {
      try {
        const { id, name, username, email, password, avatar } = req.body;
        if (!id) return res.status(400).json({ error: 'El ID de usuario es obligatorio.' });
    
        const updateData = { name, username, email, ...(avatar && { avatar }) };
    
        if (password && password.trim() !== '') {
          updateData.password = await bcrypt.hash(password, 10);
        }
    
        const updatedUser = await prisma.user.update({ where: { id }, data: updateData });
        res.status(200).json({ message: 'Perfil actualizado correctamente', user: updatedUser });
      } catch (error) {
        console.error("[Auth] Profile Update Error:", error);
        res.status(500).json({ error: 'Error interno del servidor.' });
      }
    });

    /**
     * POST /api/auth/forgot-password
     * Generates a time-sensitive reset token and emails a secure password recovery link to the user.
     * Always returns a 200 OK status to prevent email enumeration attacks.
     */
    router.post('/forgot-password', async (req, res) => {
        try {
          const { email } = req.body;
          const user = await prisma.user.findUnique({ where: { email } });
      
          if (!user) return res.status(200).json({ message: 'Si el correo existe, se enviarán las instrucciones.' });
      
          const resetToken = crypto.randomBytes(32).toString('hex');
          const resetTokenExpiry = new Date(Date.now() + 3600000); // Token expires in 1 hour
      
          await prisma.user.update({ where: { email }, data: { resetToken, resetTokenExpiry } });
          const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
      
          await resend.emails.send({
            from: 'CityPulse <onboarding@resend.dev>',
            to: email,
            subject: 'Recuperación de Contraseña - CityPulse',
            html: `
              <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
                <h2 style="color: #1e3a8a;">Recuperación de Contraseña</h2>
                <p style="color: #374151;">Haz clic en el botón de abajo para restablecer tu contraseña:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
                </div>
                <p style="color: #6b7280; font-size: 13px;">O copia y pega este enlace: <br> ${resetLink}</p>
              </div>
            `
          });
      
          res.status(200).json({ message: 'Si el correo existe, se enviarán las instrucciones.' });
        } catch (error) {
          console.error("[Auth] Forgot Password Error:", error);
          res.status(500).json({ error: 'Error interno del servidor.' });
        }
      });
      
    /**
     * POST /api/auth/reset-password
     * Validates a password reset token and securely updates the user's password in the database.
     */
    router.post('/reset-password', async (req, res) => {
        try {
          const { token, newPassword } = req.body;
          const user = await prisma.user.findFirst({
            where: { resetToken: token, resetTokenExpiry: { gt: new Date() } }
          });
      
          if (!user) return res.status(400).json({ error: 'El enlace es inválido o ha caducado.' });
      
          const hashedPassword = await bcrypt.hash(newPassword, 10);
      
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
          });
      
          res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
        } catch (error) {
          console.error("[Auth] Reset Password Error:", error);
          res.status(500).json({ error: 'Error interno del servidor.' });
        }
      });
      
    /**
     * POST /api/auth/request-delete
     * Initiates the account deletion process by generating a token and sending a confirmation email.
     */
    router.post('/request-delete', async (req, res) => {
        try {
          const { email } = req.body;
          const user = await prisma.user.findUnique({ where: { email } });
      
          if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
      
          const deleteToken = crypto.randomBytes(32).toString('hex');
          const deleteTokenExpiry = new Date(Date.now() + 3600000); // Token expires in 1 hour
      
          await prisma.user.update({ where: { email }, data: { deleteToken, deleteTokenExpiry } });
          const deleteLink = `${FRONTEND_URL}/confirm-delete?token=${deleteToken}`;
          
          await resend.emails.send({
            from: 'CityPulse <onboarding@resend.dev>',
            to: email,
            subject: 'Solicitud de Eliminación de Cuenta - CityPulse',
            html: `
              <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 10px;">
                <h2 style="color: #991b1b;">Eliminación de Cuenta</h2>
                <p>Hemos recibido una solicitud para eliminar permanentemente tu cuenta de CityPulse.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${deleteLink}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirmar Eliminación</a>
                </div>
              </div>
            `
          });
      
          res.status(200).json({ message: 'Correo de confirmación enviado.' });
        } catch (error) {
          res.status(500).json({ error: 'Error interno del servidor.' });
        }
      });
      
    /**
     * GET /api/auth/confirm-delete
     * Validates a deletion token and performs a soft-delete by anonymizing the user's data 
     * while preserving referential integrity in the database.
     */
    router.get('/confirm-delete', async (req, res) => {
        try {
          const { token } = req.query;
          const user = await prisma.user.findFirst({
            where: { deleteToken: token, deleteTokenExpiry: { gt: new Date() } }
          });
      
          if (!user) return res.status(400).json({ error: 'El enlace es inválido o ha caducado.' });
      
          // Soft-delete: Anonymizes data to keep database relationships intact
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              name: 'Usuario Eliminado',
              email: `eliminado_${user.id}@citypulse.local`, 
              username: null, avatar: null, password: '', 
              isActive: false, deleteToken: null, deleteTokenExpiry: null
            }
          });
      
          res.status(200).json({ message: 'Cuenta eliminada correctamente.' });
        } catch (error) {
          res.status(500).json({ error: 'Error interno del servidor.' });
        }
      });

    return router;
}