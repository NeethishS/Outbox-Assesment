import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      name?: string | null;
      avatarUrl?: string | null;
    };
  }
}

export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'RATE_LIMITED' | 'SENT' | 'FAILED';

export interface User {
  id: string;
  name?: string | null;
  email: string;
  avatarUrl?: string | null;
}

export interface ScheduledEmail {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledTime: string;
  status: string;
  delaySeconds?: number | null;
  hourlyLimit?: number | null;
  createdAt: string;
}

export interface SentEmail {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  sentTime: string;
  status: 'Sent' | 'Failed';
  failureReason?: string;
}

export interface ScheduleEmailPayload {
  recipients: string[];
  subject: string;
  body: string;
  startTime: string;
  delaySeconds?: number;
  hourlyLimit?: number;
  sender?: string;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface SlackConnection {
  connected: boolean;
  teamName?: string;
  channel?: string;
  connectedAt?: string;
}

export interface SearchResult {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  timestamp: string;
  type: 'scheduled' | 'sent';
}
