import express from 'express';

/**
 * Initializes and configures the administration routes for the application.
 * These routes are protected and require specific admin privileges.
 * * @param {Object} prisma - The instantiated Prisma Client for database access.
 * @returns {express.Router} The configured Express router.
 */
export default function createAdminRoutes(prisma) {
  const router = express.Router();

  /**
   * Middleware: Security check for admin privileges.
   * Verifies if the incoming request contains the master admin email in the headers.
   * * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @param {Function} next - Express next middleware function.
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
   * Retrieves a list of all registered users along with their associated route count.
   * Sorted by creation date in descending order.
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
          _count: { select: { routes: true } } // Counts the number of routes associated with the user
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
   * Permanently deletes a user from the database based on their ID.
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