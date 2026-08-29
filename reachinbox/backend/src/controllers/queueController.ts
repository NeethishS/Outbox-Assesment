import { Request, Response } from 'express';
import { emailQueue } from '../queues/emailQueue';
import { prisma } from '../config/prisma';
import { EmailStatus } from '@prisma/client';

export const getQueueStatsHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const counts = await emailQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');

    const scheduledCount = await prisma.emailJob.count({ where: { status: EmailStatus.SCHEDULED } });
    const processingCount = await prisma.emailJob.count({ where: { status: EmailStatus.PROCESSING } });
    const rateLimitedCount = await prisma.emailJob.count({ where: { status: EmailStatus.RATE_LIMITED } });
    const sentCount = await prisma.emailJob.count({ where: { status: EmailStatus.SENT } });
    const failedCount = await prisma.emailJob.count({ where: { status: EmailStatus.FAILED } });

    res.json({
      waiting: counts.waiting || scheduledCount,
      active: counts.active || processingCount,
      completed: counts.completed || sentCount,
      failed: counts.failed || failedCount,
      delayed: counts.delayed || rateLimitedCount
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve queue statistics' });
  }
};
