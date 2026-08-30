import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { emailQueue } from './queues/emailQueue';
import { prisma } from './config/prisma';
import { redisConnection } from './config/redis';
import { initElasticsearch } from './config/elasticsearch';

import emailRoutes from './routes/emailRoutes';
import queueRoutes from './routes/queueRoutes';
import slackRoutes from './routes/slackRoutes';
import authRoutes from './routes/authRoutes';

import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';

export const app: Express = express();

const frontendUrl = process.env.FRONTEND_URL || 'https://outbox-assesment.vercel.app';

// Required for Render/Vercel HTTPS reverse proxy to set secure cookies properly
app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('vercel.app') ||
      origin === frontendUrl
    ) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'reachinbox_secret_key_123',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(requestLogger);

// Bull Board Admin Queue Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue) as any],
  serverAdapter
});

app.use('/admin/queues', serverAdapter.getRouter());

// Health Endpoint (GET /health & GET /api/health)
async function getHealthStatus(_req: Request, res: Response): Promise<void> {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  try {
    const pingPromise = redisConnection.ping();
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Redis ping timeout')), 8000)
    );
    const pingRes = await Promise.race([pingPromise, timeoutPromise]);
    redisStatus = pingRes === 'PONG' ? 'connected' : pingRes;
  } catch (err: any) {
    redisStatus = `error: ${err.message}`;
  }

  res.json({
    status: 'ok',
    service: 'ReachInbox Email Job Scheduler Backend',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
      bullmq: 'active'
    }
  });
}

app.get('/health', getHealthStatus);
app.get('/api/health', getHealthStatus);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'ReachInbox.ai Email Job Scheduler API',
    status: 'online',
    endpoints: {
      health: '/health',
      dashboard: '/admin/queues',
      api: '/api/emails'
    }
  });
});

// API Routes
app.use('/api/emails', emailRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/integrations/slack', slackRoutes);
app.use('/auth/slack', slackRoutes);
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use(errorHandler);

// Initialize background services (e.g. Elasticsearch index check)
initElasticsearch().catch(err => {
  console.warn('[App Init] Elasticsearch background init warning:', err.message);
});
