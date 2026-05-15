import express from 'express';

export default function createAdminRoutes(prisma) {
  const router = express.Router();

  /**
   * Middleware: Verifica si la petición proviene del correo administrador maestro.
   */
  const isAdmin = (req, res, next) => {
    const adminEmail = req.headers['x-admin-email'];
    if (adminEmail !== 'contacto.citypulse@gmail.com') {
      return res.status(403).json({ error: 'Acceso denegado. Permisos de administrador requeridos.' });
    }
    next();
  };

  /**
   * GET /api/admin/users
   * Devuelve todos los usuarios y la cantidad de rutas que tiene cada uno.
   */
  router.get('/users', isAdmin, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          _count: { select: { routes: true } } // Cuenta cuántas rutas tiene asociadas
        },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json(users);
    } catch (error) {
      console.error("[Admin] Error fetching users:", error);
      res.status(500).json({ error: 'Error interno del servidor.' });
    }
  });

  /**
   * DELETE /api/admin/users/:id
   * Elimina un usuario por completo de la base de datos.
   */
  router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
      await prisma.user.delete({ where: { id: req.params.id } });
      res.status(200).json({ message: 'Usuario eliminado correctamente.' });
    } catch (error) {
      console.error("[Admin] Error deleting user:", error);
      res.status(500).json({ error: 'Error al eliminar el usuario.' });
    }
  });

  return router;
}