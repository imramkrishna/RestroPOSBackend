import { Server as HTTPServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import app from './app.js';
import { config } from './config/env.js';
import prisma from './config/database.js';
import { setSocketIO } from './utils/socket.js';
import { verifyAccessToken } from './utils/jwt.js';

const PORT = config.port;

const KITCHEN_ALLOWED_ROLES = new Set(['ADMIN', 'MANAGER', 'CHEF']);
const CASHIER_ALLOWED_ROLES = new Set(['ADMIN', 'MANAGER', 'CASHIER']);

type SocketUser = {
  id: string;
  role: string;
};

const getAccessTokenFromHandshake = (socket: Socket): string | null => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim().length > 0) {
    return authToken.trim();
  }

  const authorization = socket.handshake.headers.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    const token = authorization.slice(7).trim();
    return token.length > 0 ? token : null;
  }

  return null;
};

const server = new HTTPServer(app);

// Socket.IO setup for real-time updates
const io = new SocketServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (config.socketCorsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by Socket.IO CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const socketLog = (...args: unknown[]) => {
  if (config.socketDebugLogs) {
    console.log(...args);
  }
};

io.use((socket, next) => {
  const token = getAccessTokenFromHandshake(socket);

  if (!token) {
    return next(new Error('Unauthorized: missing access token'));
  }

  try {
    const decoded = verifyAccessToken(token);
    socket.data.user = {
      id: decoded.id,
      role: decoded.role.toUpperCase(),
    } satisfies SocketUser;

    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Unauthorized: access token expired'));
    }

    return next(new Error('Unauthorized: invalid access token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user as SocketUser | undefined;
  socketLog(`Client connected: ${socket.id} (${user?.id ?? 'unknown'})`);

  socket.on('join:kitchen', () => {
    const role = user?.role;
    if (!role || !KITCHEN_ALLOWED_ROLES.has(role)) {
      socket.emit('socket:error', { message: 'Forbidden: kitchen room access denied' });
      socketLog(`${socket.id} denied kitchen room access`);
      return;
    }

    socket.join('kitchen');
    socketLog(`${socket.id} joined kitchen room`);
  });

  socket.on('join:cashier', () => {
    const role = user?.role;
    if (!role || !CASHIER_ALLOWED_ROLES.has(role)) {
      socket.emit('socket:error', { message: 'Forbidden: cashier room access denied' });
      socketLog(`${socket.id} denied cashier room access`);
      return;
    }

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
