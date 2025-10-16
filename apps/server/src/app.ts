import express, { Express, Router } from 'express';
import cors from 'cors';
import { applyUserRoutes } from './routes/userRoutes.js';
import { applyPartyRoutes } from './routes/partyRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { UserController } from './controllers/userController.js';
import { PartyController } from './controllers/partyController.js';
import { NotificationService } from '@phone-games/notifications';
import { WhatsAppController } from './controllers/whatsAppController.js';
import { TwilioController } from './controllers/twilioController.js';
import { applyWhatsAppRoutes } from './routes/whatsAppRoutes.js';
import { applyTwilioRoutes } from './routes/twilioRoutes.js';
import { db } from '@phone-games/db';
import { PartyManagerService } from '@phone-games/party';
import { MessageHandlerService, WhatsAppParser, TwilioParser } from '@phone-games/messaging';
import { UserService } from '@phone-games/user';
import { ILogger } from '@phone-games/logger';

export const initializeApp = (notificationService: NotificationService, logger: ILogger) => {
  const app: Express = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const partyManagerService = new PartyManagerService(db, notificationService, logger);
  const userService = new UserService(db);
  const userController = new UserController(userService);
  const partyController = new PartyController(partyManagerService);
  const messageHandlerService = new MessageHandlerService(
    notificationService,
    partyManagerService,
    userService,
    [new WhatsAppParser(userService), new TwilioParser(userService)],
    logger
  );
  const whatsAppController = new WhatsAppController(messageHandlerService);
  const twilioController = new TwilioController(messageHandlerService);
  const userRouter = Router();
  const partyRouter = Router();
  const whatsAppRouter = Router();
  const twilioRouter = Router();

  applyUserRoutes(userRouter, userController);
  applyPartyRoutes(partyRouter, partyController);
  applyWhatsAppRoutes(whatsAppRouter, whatsAppController);
  applyTwilioRoutes(twilioRouter, twilioController);

  // Routes
  app.use('/api/users', userRouter);
  app.use('/api/parties', partyRouter);
  app.use('/api/whatsapp', whatsAppRouter);
  app.use('/api/twilio', twilioRouter);
  
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
