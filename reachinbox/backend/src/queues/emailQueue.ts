import { Queue } from 'bullmq';
import { createRedisClient } from '../config/redis';

export const EMAIL_QUEUE_NAME = 'emailQueue';

export interface EmailJobData {
  emailJobId: string;
  idempotencyKey: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
}

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: createRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: false,
    removeOnFail: false
  }
});
