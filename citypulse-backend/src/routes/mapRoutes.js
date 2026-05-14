import express from 'express';

export default function createMapRoutes(prisma) {
    const router = express.Router();

    router.post('/', async (req, res) => {
      try {
        const { name, originLat, originLng, destLat, destLng, distance, duration, userId } = req.body;
        
        const newRoute = await prisma.route.create({
          data: {
            name, originLat, originLng, destLat, destLng,
            distance: parseFloat(distance),
            duration: parseInt(duration),
            userId
          }
        });
    
        res.status(201).json(newRoute);
      } catch (error) {
        console.error("[MapRoutes] Save Route Error:", error);
        res.status(500).json({ error: 'Internal server error.' });
      }
    });
    
    router.get('/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const routes = await prisma.route.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' } 
        });
        
        res.status(200).json(routes);
      } catch (error) {
        console.error("[MapRoutes] Fetch Routes Error:", error);
        res.status(500).json({ error: 'Internal server error.' });
      }
    });
    
    router.delete('/:routeId', async (req, res) => {
      try {
        const { routeId } = req.params;
        await prisma.route.delete({ where: { id: routeId } });
        res.status(200).json({ message: 'Route deleted successfully.' });
      } catch (error) {
        console.error("[MapRoutes] Delete Route Error:", error);
        res.status(500).json({ error: 'Internal server error.' });
      }
    });

    return router;
}