import express from 'express';
import cors from 'cors';
import { userRoutes } from './routes/userRoutes';
import { partyRoutes } from './routes/partyRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/parties', partyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
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

export { app };