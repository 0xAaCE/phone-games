import express, { Express } from 'express';
import cors from 'cors';
import { createUserRouter } from './routes/userRoutes.js';
import { createPartyRouter } from './routes/partyRoutes.js';
import { createWhatsAppRouter } from './routes/whatsAppRoutes.js';
import { createTwilioRouter } from './routes/twilioRoutes.js';
import { createQrCodeRoutes } from './routes/qrCodeRoutes.js';
import { createErrorHandler } from './middleware/errorHandler.js';
import { Services } from './factories/serviceFactory.js';

/**
 * Initializes the Express application with routes and middleware.
 * @param services - Application services including logger, database, etc.
 * @param twilioPhoneNumber - Twilio phone number for QR code generation
 * @returns Configured Express application instance
 */
export const initializeApp = (services: Services, twilioPhoneNumber: string) => {
  const app: Express = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount routers
  app.use('/api/users', createUserRouter(services.userService));
  app.use('/api/parties', createPartyRouter(services.sessionCoordinator));
  app.use('/api/whatsapp', createWhatsAppRouter(services.messageHandlerService, services.logger));
  app.use('/api/twilio', createTwilioRouter(services.messageHandlerService, services.logger));
  app.use('/api/qr', createQrCodeRoutes(services.logger, twilioPhoneNumber));

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
  app.use(createErrorHandler(services.logger));

  return app;
}
