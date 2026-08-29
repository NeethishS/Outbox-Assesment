import { prisma } from '../config/prisma';
import { emailQueue } from '../queues/emailQueue';
import { EmailStatus, EmailJob } from '@prisma/client';

export interface ScheduleEmailInput {
  recipients: string[];
  subject: string;
  body: string;
  startTime: string;
  delaySeconds?: number;
  hourlyLimit?: number;
  sender?: string;
  userId?: string;
}

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export async function scheduleEmails(input: ScheduleEmailInput) {
  const {
    recipients,
    subject,
    body,
    startTime,
    delaySeconds = 0,
    hourlyLimit = 200,
    sender = 'default@reachinbox.ai',
    userId
  } = input;

  const validRecipients = Array.from(
    new Set(
      (recipients || [])
        .map(r => r.trim().toLowerCase())
        .filter(r => isValidEmail(r))
    )
  );

  if (validRecipients.length === 0) {
    throw new Error('No valid recipient email addresses provided.');
  }

  let senderRecord = await prisma.sender.findFirst({
    where: { email: sender.toLowerCase() }
  });

  if (!senderRecord) {
    senderRecord = await prisma.sender.create({
      data: {
        email: sender.toLowerCase(),
        name: sender.split('@')[0],
        userId: userId || null
      }
    });
  }

  const baseScheduledAt = new Date(startTime);
  const scheduledTimeBase = isNaN(baseScheduledAt.getTime()) ? new Date() : baseScheduledAt;

  const jobsToCreate = validRecipients.map((recipient, i) => {
    const offsetMs = i * Math.max(0, delaySeconds) * 1000;
    const scheduledAt = new Date(scheduledTimeBase.getTime() + offsetMs);

    const idempotencyKey = `ik_${senderRecord.id}_${recipient}_${scheduledAt.getTime()}_${i}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      recipient,
      subject,
      body,
      scheduledAt,
      status: EmailStatus.SCHEDULED,
      idempotencyKey,
      delaySeconds,
      hourlyLimit,
      senderId: senderRecord.id,
      userId: userId || null
    };
  });

  // Perform high-performance bulk DB insertion
  await prisma.emailJob.createMany({
    data: jobsToCreate
  });

  const idempotencyKeys = jobsToCreate.map(j => j.idempotencyKey);
  const createdJobs = await prisma.emailJob.findMany({
    where: {
      senderId: senderRecord.id,
      idempotencyKey: { in: idempotencyKeys }
    }
  });

  // Bulk enqueue all jobs into BullMQ in 1 Redis round-trip
  const bulkBullJobs = createdJobs.map(job => {
    const delayMs = Math.max(0, job.scheduledAt.getTime() - Date.now());
    return {
      name: 'sendEmail',
      data: {
        emailJobId: job.id,
        idempotencyKey: job.idempotencyKey,
        senderId: job.senderId,
        recipient: job.recipient,
        subject: job.subject,
        body: job.body
      },
      opts: {
        delay: delayMs,
        jobId: `job_${job.id}`
      }
    };
  });

  await emailQueue.addBulk(bulkBullJobs);

  return {
    success: true,
    count: createdJobs.length,
    scheduled: createdJobs
  };
}

export async function getScheduledEmails(userId?: string): Promise<EmailJob[]> {
  return prisma.emailJob.findMany({
    where: {
      status: { in: [EmailStatus.SCHEDULED, EmailStatus.RATE_LIMITED, EmailStatus.PROCESSING] },
      ...(userId ? { userId } : {})
    },
    orderBy: { scheduledAt: 'asc' },
    include: { sender: true }
  });
}

export async function getSentEmails(userId?: string): Promise<EmailJob[]> {
  return prisma.emailJob.findMany({
    where: {
      status: EmailStatus.SENT,
      ...(userId ? { userId } : {})
    },
    orderBy: { sentAt: 'desc' },
    include: { sender: true }
  });
}

export async function cancelScheduledEmail(jobId: string, userId?: string): Promise<boolean> {
  const emailJob = await prisma.emailJob.findUnique({
    where: { id: jobId }
  });

  if (!emailJob || (userId && emailJob.userId !== userId)) {
    return false;
  }

  if (emailJob.bullJobId) {
    const bullJob = await emailQueue.getJob(emailJob.bullJobId);
    if (bullJob) {
      await bullJob.remove();
    }
  }

  await prisma.emailJob.delete({
    where: { id: jobId }
  });

  return true;
}
