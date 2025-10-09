import express, { Express, Router } from 'express';
import cors from 'cors';
import { applyUserRoutes } from './routes/userRoutes';
import { applyPartyRoutes } from './routes/partyRoutes';
import { errorHandler } from './middleware/errorHandler';
import { UserController } from './controllers/UserController';
import { PartyController } from './controllers/PartyController';
import { NotificationService } from '@phone-games/notifications';

export const initializeApp = (notificationService: NotificationService) => {
  const app: Express = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const userController = new UserController();
  const partyController = new PartyController(notificationService);
  const userRouter = Router();
  const partyRouter = Router(); 

  applyUserRoutes(userRouter, userController);
  applyPartyRoutes(partyRouter, partyController);

  // Routes
  app.use('/api/users', userRouter);
  app.use('/api/parties', partyRouter);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Route not found',
        status: 404,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      },
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
