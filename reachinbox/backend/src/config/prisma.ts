import { PrismaClient } from '@prisma/client';

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.includes('&channel_binding=require')) {
  dbUrl = dbUrl.replace('&channel_binding=require', '') + '&connect_timeout=30&pool_timeout=30';
}

export const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});
