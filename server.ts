import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './server/app.js';
import { initSocketService } from './server/sockets/socket.service.js';
import { connectDB } from './server/config/db.config.js';
import { createServer as createViteServer } from 'vite';
import { startPaymentWorker } from './server/services/booking-payment.service.js';

async function startServer() {
  // Connect to MongoDB
  await connectDB();
  startPaymentWorker();

  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;
  const server = http.createServer(app);

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  initSocketService(io);

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const express = (await import('express')).default;
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`⚽ Football Connect server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
