import { ScheduledEmail, SentEmail, ScheduleEmailPayload, QueueStats, SearchResult } from '../types';

let scheduledEmails: ScheduledEmail[] = [
  {
    id: 'sch_1',
    recipient: 'sarah.jenkins@acme-tech.com',
    subject: 'Q3 Outbound Strategy & Campaign Alignment',
    body: 'Hi Sarah, following up on our discussion regarding the Q3 campaign...',
    scheduledTime: new Date(Date.now() + 3600000 * 2).toISOString(),
    status: 'Scheduled',
    delaySeconds: 120,
    hourlyLimit: 50,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sch_2',
    recipient: 'michael.ross@globalfirm.org',
    subject: 'Introductory Call - ReachInbox Automation',
    body: 'Hello Michael, I noticed your team is scaling cold email outreach...',
    scheduledTime: new Date(Date.now() + 3600000 * 5).toISOString(),
    status: 'Processing',
    delaySeconds: 60,
    hourlyLimit: 100,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sch_3',
    recipient: 'david.chen@enterprise.io',
    subject: 'Partnership Opportunity with Outbox Labs',
    body: 'Hi David, checking in on the proposal we shared last week...',
    scheduledTime: new Date(Date.now() + 3600000 * 24).toISOString(),
    status: 'Rate Limited',
    delaySeconds: 300,
    hourlyLimit: 25,
    createdAt: new Date().toISOString()
  }
];

let sentEmails: SentEmail[] = [
  {
    id: 'snt_1',
    recipient: 'oliver.queen@starcity.com',
    subject: 'Follow up on creative brief',
    body: 'Hi Oliver, checking in to see if you had a chance to review...',
    sentTime: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'Sent'
  },
  {
    id: 'snt_2',
    recipient: 'finance@acmebilling.com',
    subject: 'Monthly invoice payment confirmation',
    body: 'Your payment for October invoice has been processed...',
    sentTime: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'Sent'
  },
  {
    id: 'snt_3',
    recipient: 'invalid.contact@nonexistent-domain.xyz',
    subject: 'Q4 Sponsorship Details',
    body: 'Greetings, here are the details for Q4 sponsorship...',
    sentTime: new Date(Date.now() - 3600000 * 30).toISOString(),
    status: 'Failed',
    failureReason: '550 5.1.1 User unknown / Host unreachable'
  }
];

export const emailQueueService = {
  getScheduledEmails(): ScheduledEmail[] {
    return scheduledEmails;
  },

  getSentEmails(): SentEmail[] {
    return sentEmails;
  },

  scheduleEmails(payload: ScheduleEmailPayload): { success: boolean; count: number; scheduled: ScheduledEmail[] } {
    const newItems: ScheduledEmail[] = payload.recipients.map((recipient, idx) => ({
      id: `sch_${Date.now()}_${idx}`,
      recipient,
      subject: payload.subject,
      body: payload.body,
      scheduledTime: payload.startTime,
      status: 'Scheduled',
      delaySeconds: payload.delaySeconds,
      hourlyLimit: payload.hourlyLimit,
      createdAt: new Date().toISOString()
    }));

    scheduledEmails = [...newItems, ...scheduledEmails];

    return {
      success: true,
      count: newItems.length,
      scheduled: newItems
    };
  },

  cancelScheduledEmail(id: string): boolean {
    const originalLength = scheduledEmails.length;
    scheduledEmails = scheduledEmails.filter(email => email.id !== id);
    return scheduledEmails.length < originalLength;
  },

  searchEmails(query: string): SearchResult[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matchedScheduled: SearchResult[] = scheduledEmails
      .filter(item =>
        item.recipient.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
      )
      .map(item => ({
        id: item.id,
        recipient: item.recipient,
        subject: item.subject,
        body: item.body,
        status: item.status,
        timestamp: item.scheduledTime,
        type: 'scheduled' as const
      }));

    const matchedSent: SearchResult[] = sentEmails
      .filter(item =>
        item.recipient.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
      )
      .map(item => ({
        id: item.id,
        recipient: item.recipient,
        subject: item.subject,
        body: item.body,
        status: item.status,
        timestamp: item.sentTime,
        type: 'sent' as const
      }));

    return [...matchedScheduled, ...matchedSent];
  },

  getQueueStats(): QueueStats {
    const waiting = scheduledEmails.filter(e => e.status === 'Scheduled').length;
    const active = scheduledEmails.filter(e => e.status === 'Processing').length;
    const delayed = scheduledEmails.filter(e => e.status === 'Rate Limited').length;
    const completed = sentEmails.filter(e => e.status === 'Sent').length;
    const failed = sentEmails.filter(e => e.status === 'Failed').length;

    return {
      waiting,
      active,
      completed,
      failed,
      delayed
    };
  }
};
