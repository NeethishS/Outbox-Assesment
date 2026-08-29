import dotenv from 'dotenv';
dotenv.config();

import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME, EmailJobData, emailQueue } from '../queues/emailQueue';
import { createRedisClient, redisConnection } from '../config/redis';
import { prisma } from '../config/prisma';
import { mailTransporter, DEFAULT_SMTP_FROM } from '../config/mailer';
import { EmailStatus } from '@prisma/client';
import { sendRateLimitSlackNotification } from '../services/slackService';
import { indexEmailInElasticsearch } from '../services/elasticsearchService';

const concurrency = Number(process.env.WORKER_CONCURRENCY) || 5;
const minEmailDelayMs = Number(process.env.MIN_EMAIL_DELAY_MS) || 2000;
const maxEmailsPerHour = Number(process.env.MAX_EMAILS_PER_HOUR) || 200;

function getHourKey(date: Date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}-${hh}`;
}

function getNextHourTime(date: Date = new Date()): Date {
  const next = new Date(date);
  next.setUTCHours(next.getUTCHours() + 1, 0, 0, 500);
  return next;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Atomic Redis Mutex Lock per Sender to serialize dispatches and guarantee MIN_EMAIL_DELAY_MS
async function acquireSenderLock(senderId: string, timeoutMs: number = 180000): Promise<() => Promise<void>> {
  const lockKey = `lock:sender:${senderId}`;
  const lockToken = Math.random().toString(36).substring(2);
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const acquired = await redisConnection.set(lockKey, lockToken, 'PX', 45000, 'NX');
    if (acquired === 'OK') {
      return async () => {
        const luaRelease = `
          if redis.call('GET', KEYS[1]) == ARGV[1] then
            return redis.call('DEL', KEYS[1])
          else
            return 0
          end
        `;
        try {
          await redisConnection.eval(luaRelease, 1, lockKey, lockToken);
        } catch (e) {
          // ignore release error
        }
      };
    }
    await sleep(50);
  }
  throw new Error(`Timeout waiting for sender lock: ${senderId}`);
}

export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job: Job<EmailJobData>) => {
    const { emailJobId, idempotencyKey, senderId, recipient, subject, body } = job.data;

    // 1. Load EmailJob from PostgreSQL
    const emailRecord = await prisma.emailJob.findUnique({
      where: { id: emailJobId },
      include: { sender: true }
    });

    if (!emailRecord) {
      console.warn(`[Worker Job ${job.id}] Email record ${emailJobId} not found. Skipping.`);
      return;
    }

    // 2. Idempotency Check: If already sent, skip execution safely!
    if (emailRecord.status === EmailStatus.SENT) {
      console.log(`[Worker Job ${job.id}] Idempotency check: Email ${emailJobId} already SENT. Skipping.`);
      return;
    }

    // 3. Rate Limit Check (Redis-backed per sender per hour window)
    const hourKey = getHourKey();
    const rateLimitKey = `rate_limit:sender:${senderId}:${hourKey}`;

    const currentSentCount = await redisConnection.incr(rateLimitKey);
    if (currentSentCount === 1) {
      await redisConnection.expire(rateLimitKey, 7200);
    }

    if (currentSentCount > maxEmailsPerHour) {
      // Revert counter increment for unsent email
      await redisConnection.decr(rateLimitKey);

      const now = new Date();
      const nextHourTime = getNextHourTime(now);
      const rescheduleDelayMs = Math.max(1000, nextHourTime.getTime() - now.getTime());

      console.warn(`[Worker Job ${job.id}] Rate limit exceeded for sender ${senderId} (${currentSentCount - 1}/${maxEmailsPerHour}). Rescheduling in ${Math.round(rescheduleDelayMs / 1000)}s.`);

      // Update status in PostgreSQL to RATE_LIMITED
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: {
          status: EmailStatus.RATE_LIMITED,
          scheduledAt: nextHourTime
        }
      });

      // Schedule delayed job for next hour
      await emailQueue.add(
        'sendEmail',
        job.data,
        {
          delay: rescheduleDelayMs,
          jobId: `job_${emailJobId}_resched_${Date.now()}`
        }
      );

      // Trigger Slack notification for this sender/hour window
      await sendRateLimitSlackNotification(
        emailRecord.userId,
        emailRecord.sender?.email || 'Sender',
        hourKey
      );

      return;
    }

    // 4. Update status to PROCESSING
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: { status: EmailStatus.PROCESSING }
    });

    // 5. Acquire Mutex Lock per Sender to serialize sending and guarantee MIN_EMAIL_DELAY_MS between completions
    const releaseLock = await acquireSenderLock(senderId);

    try {
      const lastCompletionKey = `last_completion_time:${senderId}`;
      const lastCompletionStr = await redisConnection.get(lastCompletionKey);

      if (lastCompletionStr) {
        const elapsed = Date.now() - Number(lastCompletionStr);
        if (elapsed < minEmailDelayMs) {
          const waitMs = minEmailDelayMs - elapsed;
          console.log(`[Minimum Delay Guard] Sender ${senderId}: Pausing worker by ${waitMs}ms to enforce MIN_EMAIL_DELAY_MS (${minEmailDelayMs}ms).`);
          await sleep(waitMs);
        }
      }

      // 6. Send Email via Nodemailer (Ethereal SMTP)
      const mailOptions = {
        from: process.env.SMTP_FROM || DEFAULT_SMTP_FROM,
        to: recipient,
        subject,
        text: body,
        html: `<div style="font-family: sans-serif; line-height: 1.5;">${body.replace(/\n/g, '<br/>')}</div>`
      };

      const info = await mailTransporter.sendMail(mailOptions);
      console.log(`[Worker Job ${job.id}] Email sent to ${recipient} (Message ID: ${info.messageId})`);

      const sentAt = new Date();

      // Record COMPLETION timestamp in Redis while holding sender lock
      await redisConnection.set(lastCompletionKey, String(sentAt.getTime()), 'EX', 3600);

      // 7. Update PostgreSQL status to SENT
      const updatedJob = await prisma.emailJob.update({
        where: { id: emailJobId },
        data: {
          status: EmailStatus.SENT,
          sentAt,
          failureReason: null
        }
      });

      // 8. Index document in Elasticsearch
      await indexEmailInElasticsearch({
        id: updatedJob.id,
        recipient: updatedJob.recipient,
        subject: updatedJob.subject,
        body: updatedJob.body,
        senderId: updatedJob.senderId,
        senderEmail: emailRecord.sender?.email,
        status: updatedJob.status,
        scheduledAt: updatedJob.scheduledAt,
        sentAt: updatedJob.sentAt,
        userId: updatedJob.userId
      });

    } catch (err: any) {
      console.error(`[Worker Job ${job.id}] Sending failed for ${recipient}:`, err.message);

      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: {
          status: EmailStatus.FAILED,
          failureReason: err.message || 'Unknown SMTP error'
        }
      });

      throw err;
    } finally {
      await releaseLock();
    }
  },
  {
    connection: createRedisClient(),
    concurrency
  }
);

emailWorker.on('completed', (job: Job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

emailWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

console.log(`⚡️ [ReachInbox Worker]: Worker running with concurrency = ${concurrency}`);
