import { ImpostorWebSocketFormatter, ImpostorWhatsAppFormatter, NotificationManager } from '@phone-games/notifications';
import { initializeApp } from './app.js';
import { createServices } from './factories/serviceFactory.js';
import dotenv from 'dotenv';
import { WebSocketManager } from './services/webSocketManager.js';
import { Logger, LogLevel } from '@phone-games/logger';
import { db } from '@phone-games/db';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;

// Initialize logger
const logger = new Logger({
  serviceName: 'phone-games-server',
  environment: process.env.NODE_ENV || 'development',
  level: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LogLevel.INFO,
});

logger.info('Initializing server', { port: PORT });

// Initialize notification service (manages WebSocket connections)
const notificationService = new NotificationManager(
  [new ImpostorWebSocketFormatter(), new ImpostorWhatsAppFormatter()],
  logger
);

// Create all services using the factory
const services = createServices({
  db,
  logger,
  notificationService,
});

const app = initializeApp(services);

// Start server
const server = app.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    healthEndpoint: `/health`,
  });
});

const webSocketManager = new WebSocketManager(server, notificationService, logger);


// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  webSocketManager.closeAllConnections();
  server.close(() => {
    logger.info('Server shut down complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  webSocketManager.closeAllConnections();
  server.close(() => {
    logger.info('Server shut down complete');
    process.exit(0);
  });
});


export { server };