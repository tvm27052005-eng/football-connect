import express, { Express } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import venueRoutes from './routes/venue.routes.js';
import fieldRoutes from './routes/field.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import matchRoutes from './routes/match.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reviewRoutes from './routes/review.routes.js';
import statsRoutes from './routes/stats.routes.js';
import aiRoutes from './routes/ai.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import path from 'path';

export function createApp(): Express {
  const app = express();

  // Standard Middlewares
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads directory for local fallback
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // API Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      service: 'Football Connect API Server',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/venues', venueRoutes);
  app.use('/api/fields', fieldRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/conversations', chatRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/upload', uploadRoutes);

  return app;
}
