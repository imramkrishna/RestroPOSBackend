import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

const prismaLogLevels: Array<'query' | 'warn' | 'error'> =
  config.nodeEnv === 'development' ? ['warn', 'error'] : ['error'];

if (config.prismaQueryLogs) {
  prismaLogLevels.unshift('query');
}

const prisma = new PrismaClient({
  log: prismaLogLevels,
});

export default prisma;
