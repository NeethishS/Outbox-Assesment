import { apiRequest } from './api';
import { ScheduledEmail, SentEmail, ScheduleEmailPayload } from '../types';

export const emailService = {
  async getScheduledEmails(): Promise<ScheduledEmail[]> {
    const data = await apiRequest<any[]>('/api/emails/scheduled');
    return (data || []).map(item => ({
      id: item.id,
      recipient: item.recipient,
      subject: item.subject,
      body: item.body,
      scheduledTime: item.scheduledTime || item.scheduledAt,
      scheduledAt: item.scheduledAt || item.scheduledTime,
      status: item.status,
      delaySeconds: item.delaySeconds || 0,
      hourlyLimit: item.hourlyLimit || 200,
      createdAt: item.createdAt || new Date().toISOString(),
      sentAt: item.sentAt || null,
      failureReason: item.failureReason || null,
      sender: item.sender
    }));
  },

  async getSentEmails(): Promise<SentEmail[]> {
    const data = await apiRequest<any[]>('/api/emails/sent');
    return (data || []).map(item => ({
      id: item.id,
      recipient: item.recipient,
      subject: item.subject,
      body: item.body,
      sentTime: item.sentTime || item.sentAt || new Date().toISOString(),
      sentAt: item.sentAt || item.sentTime,
      status: item.status || 'SENT',
      failureReason: item.failureReason || null,
      sender: item.sender
    }));
  },

  async scheduleEmails(payload: ScheduleEmailPayload): Promise<{ success: boolean; count: number; scheduled: ScheduledEmail[] }> {
    const result = await apiRequest<{ success: boolean; count: number; scheduled: any[] }>('/api/emails/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const scheduledNormalized: ScheduledEmail[] = (result.scheduled || []).map(item => ({
      id: item.id,
      recipient: item.recipient,
      subject: item.subject,
      body: item.body,
      scheduledTime: item.scheduledTime || item.scheduledAt || payload.startTime,
      scheduledAt: item.scheduledAt || payload.startTime,
      status: item.status || 'SCHEDULED',
      delaySeconds: item.delaySeconds || payload.delaySeconds,
      hourlyLimit: item.hourlyLimit || payload.hourlyLimit,
      createdAt: item.createdAt || new Date().toISOString()
    }));

    return {
      success: result.success,
      count: result.count || scheduledNormalized.length,
      scheduled: scheduledNormalized
    };
  },

  async cancelScheduledEmail(id: string): Promise<boolean> {
    await apiRequest(`/api/emails/${id}`, { method: 'DELETE' });
    return true;
  }
};
