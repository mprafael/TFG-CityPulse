import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export default function createAuthRoutes(prisma, transporter) {
    const router = express.Router();

    // Variable para usar la URL de Vercel en prod, o localhost en desarrollo
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    router.post('/register', async (req, res) => {
      try {
        const { name, email, password } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        
        if (existingUser) {
          return res.status(400).json({ error: 'Email already registered.' });
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
    
        await prisma.user.create({
          data: { name, email, password: hashedPassword, verificationToken, isActive: false }
        });
    
        const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        const mailOptions = {
          from: `"CityPulse" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Activate your CityPulse account',
          html: `
            <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
              <h2 style="color: #1e3a8a;">Welcome to CityPulse, ${name}!</h2>
              <p style="color: #374151;">Please confirm your account by clicking the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirm Account</a>
              </div>
              <p style="color: #6b7280; font-size: 13px;">Or copy and paste this link: <br> ${verificationLink}</p>
            </div>
          `
        };
    
        await transporter.sendMail(mailOptions);
        res.status(201).json({ message: 'User registered. Check email to activate.' });
    
      } catch (error) {
        console.error("[Auth] Registration Error:", error);
        res.status(500).json({ error: 'Internal server error.' });
      }
    });
    
    router.get('/verify-email', async (req, res) => {
      try {
        const { token } = req.query;
        const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    
        if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });
    
        await prisma.user.update({
          where: { id: user.id },
          data: { isActive: true, verificationToken: null }
        });
    
        res.status(200).json({ message: 'Account activated successfully.' });
      } catch (error) {
        console.error("[Auth] Verification Error:", error);
        res.status(500).json({ error: 'Internal server error.' });
      }
    });
    
    router.post('/login', async (req, res) => {
      try {
        const { identifier, password } = req.body;
        const user = await prisma.user.findFirst({
          where: { OR: [{ email: identifier }, { username: identifier }] }
        });
    
        if (!user || !(await bcrypt.compare(password, user.password))) {
          return res.status(401).json({ error: 'Invalid credentials.' });
        }
    
        if (!user.isActive) {
          return res.status(403).json({ error: 'Account pending activation. Check your email.' });
        }
    
        res.status(200).json({
          message: 'Login successful',
          user: { id: user.id, name: user.name, username: user.username, email: user.email, avatar: user.avatar }
        });
    
      } catch (error) {
        console.error("[Auth] Login Error:", error);
        res.status(500).json({ error: 'Internal server error.' });
      }
    });
    
    router.put('/profile', async (req, res) => {
      try {
        const { id, name, username, email, password, avatar } = req.body;
        if (!id) return res.status(400).json({ error: 'User ID is required.' });
    
        const updateData = { name, username, email, ...(avatar && { avatar }) };
    
        if (password && password.trim() !== '') {
          updateData.password = await bcrypt.hash(password, 10);
        }
    
        const updatedUser = await prisma.user.update({ where: { id }, data: updateData });
        res.status(200).json({ message: 'Profile updated', user: updatedUser });
      } catch (error) {
        console.error("[Auth] Profile Update Error:", error);
        res.status(500).json({ error: 'Internal server error.' });
      }
    });

    router.post('/forgot-password', async (req, res) => {
        try {
          const { email } = req.body;
          const user = await prisma.user.findUnique({ where: { email } });
      
          if (!user) return res.status(200).json({ message: 'If the email exists, instructions will be sent.' });
      
          const resetToken = crypto.randomBytes(32).toString('hex');
          const resetTokenExpiry = new Date(Date.now() + 3600000); 
      
          await prisma.user.update({ where: { email }, data: { resetToken, resetTokenExpiry } });
          const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
      
          await transporter.sendMail({
            from: `"CityPulse" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Recovery - CityPulse',
            html: `
              <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
                <h2 style="color: #1e3a8a;">Password Recovery</h2>
                <p style="color: #374151;">Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #6b7280; font-size: 13px;">Or copy and paste this link: <br> ${resetLink}</p>
              </div>
            `
          });
      
          res.status(200).json({ message: 'If the email exists, instructions will be sent.' });
        } catch (error) {
          console.error("[Auth] Forgot Password Error:", error);
          res.status(500).json({ error: 'Internal server error.' });
        }
      });
      
      router.post('/reset-password', async (req, res) => {
        try {
          const { token, newPassword } = req.body;
          const user = await prisma.user.findFirst({
            where: { resetToken: token, resetTokenExpiry: { gt: new Date() } }
          });
      
          if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });
      
          const hashedPassword = await bcrypt.hash(newPassword, 10);
      
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
          });
      
          res.status(200).json({ message: 'Password updated successfully.' });
        } catch (error) {
          console.error("[Auth] Reset Password Error:", error);
          res.status(500).json({ error: 'Internal server error.' });
        }
      });
      
      router.post('/request-delete', async (req, res) => {
        try {
          const { email } = req.body;
          const user = await prisma.user.findUnique({ where: { email } });
      
          if (!user) return res.status(404).json({ error: 'User not found.' });
      
          const deleteToken = crypto.randomBytes(32).toString('hex');
          const deleteTokenExpiry = new Date(Date.now() + 3600000); 
      
          await prisma.user.update({ where: { email }, data: { deleteToken, deleteTokenExpiry } });
          const deleteLink = `${FRONTEND_URL}/confirm-delete?token=${deleteToken}`;
          
          await transporter.sendMail({
            from: `"CityPulse" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Account Deletion Request - CityPulse',
            html: `
              <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 10px;">
                <h2 style="color: #991b1b;">Account Deletion</h2>
                <p>We received a request to permanently delete your CityPulse account.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${deleteLink}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirm Deletion</a>
                </div>
              </div>
            `
          });
      
          res.status(200).json({ message: 'Confirmation email sent.' });
        } catch (error) {
          res.status(500).json({ error: 'Internal server error.' });
        }
      });
      
      router.get('/confirm-delete', async (req, res) => {
        try {
          const { token } = req.query;
          const user = await prisma.user.findFirst({
            where: { deleteToken: token, deleteTokenExpiry: { gt: new Date() } }
          });
      
          if (!user) return res.status(400).json({ error: 'Invalid or expired link.' });
      
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              name: 'Deleted User',
              email: `deleted_${user.id}@citypulse.local`, 
              username: null, avatar: null, password: '', 
              isActive: false, deleteToken: null, deleteTokenExpiry: null
            }
          });
      
          res.status(200).json({ message: 'Account deleted successfully.' });
        } catch (error) {
          res.status(500).json({ error: 'Internal server error.' });
        }
      });

    return router;
}