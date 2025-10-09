import { ImpostorWebSocketParser, ImpostorWhatsAppParser, NotificationManager } from '@phone-games/notifications';
import { initializeApp } from './app';
import dotenv from 'dotenv';
import { WebSocketManager } from './services/WebSocketManager';

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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

new WebSocketManager(server, notificationService);

export { server };