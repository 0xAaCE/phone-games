import { ImpostorWebSocketParser, ImpostorWhatsAppParser, NotificationManager } from '@phone-games/notifications';
import { initializeApp } from './app.js';
import dotenv from 'dotenv';
import { WebSocketManager } from './services/WebSocketManager.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const notificationService = new NotificationManager([new ImpostorWebSocketParser(), new ImpostorWhatsAppParser()]);
const app = initializeApp(notificationService);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/health`);
  console.log(`🎮 Phone Games API ready!`);
});

const webSocketManager = new WebSocketManager(server, notificationService);


// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  webSocketManager.closeAllConnections();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  webSocketManager.closeAllConnections();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});


export { server };