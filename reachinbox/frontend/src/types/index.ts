export type EmailStatus =
  | 'Scheduled'
  | 'Processing'
  | 'Rate Limited'
  | 'Failed'
  | 'Sent'
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'RATE_LIMITED'
  | 'FAILED'
  | 'SENT';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  picture?: string;
}

export interface ScheduledEmail {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledTime?: string;
  scheduledAt?: string;
  status: EmailStatus;
  delaySeconds?: number;
  hourlyLimit?: number;
  createdAt?: string;
  sentAt?: string | null;
  failureReason?: string | null;
  sender?: {
    id?: string;
    email: string;
    name?: string;
  };
}

export interface SentEmail {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  sentTime?: string;
  sentAt?: string;
  status: EmailStatus;
  failureReason?: string | null;
  sender?: {
    id?: string;
    email: string;
    name?: string;
  };
}

export interface ScheduleEmailPayload {
  recipients: string[];
  subject: string;
  body: string;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
  sender?: string;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused?: number;
}

export interface SlackConnection {
  connected: boolean;
  teamName?: string;
  channel?: string;
  connectedAt?: string;
  createdAt?: string;
}

export interface SearchResult {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: EmailStatus;
  timestamp?: string;
  scheduledAt?: string;
  sentAt?: string;
  type?: 'scheduled' | 'sent';
}
