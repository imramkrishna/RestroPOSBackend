import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { config } from './config/env';
import prisma from './config/database';
import { setSocketIO } from './utils/socket';

const PORT = config.port;

const server = new HTTPServer(app);

// Socket.IO setup for real-time updates
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const socketLog = (...args: unknown[]) => {
  if (config.socketDebugLogs) {
    console.log(...args);
  }
};

io.on('connection', (socket) => {
  socketLog(`Client connected: ${socket.id}`);

  socket.on('join:kitchen', () => {
    socket.join('kitchen');
    socketLog(`${socket.id} joined kitchen room`);
  });

  socket.on('join:cashier', () => {
    socket.join('cashier');
    socketLog(`${socket.id} joined cashier room`);
  });

  socket.on('disconnect', () => {
    socketLog(`Client disconnected: ${socket.id}`);
  });
});

// Set socket.io instance for use in services
setSocketIO(io);

// Export io for use in services
export { io };

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

startServer();
