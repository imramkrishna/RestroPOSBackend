import dotenv from 'dotenv';

dotenv.config();

const parseBoolean = (value: string | undefined, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

const parseCsv = (value: string | undefined, defaultValue: string[]) => {
  if (!value) return defaultValue;

  const values = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : defaultValue;
};

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  prismaQueryLogs: parseBoolean(process.env.PRISMA_QUERY_LOGS, false),
  socketDebugLogs: parseBoolean(process.env.SOCKET_DEBUG_LOGS, false),
  socketCorsOrigins: parseCsv(process.env.SOCKET_CORS_ORIGINS, ['http://localhost:3000']),
};
