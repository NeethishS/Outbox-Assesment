import { apiRequest } from './api';
import { SearchResult } from '../types';

export const searchService = {
  async searchEmails(query: string): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    const data = await apiRequest<any[]>(`/api/emails/search?q=${encodeURIComponent(query)}`);
    return (data || []).map(item => ({
      id: item.id,
      recipient: item.recipient,
      subject: item.subject,
      body: item.body,
      status: item.status,
      timestamp: item.timestamp || item.sentAt || item.scheduledAt || new Date().toISOString(),
      scheduledAt: item.scheduledAt,
      sentAt: item.sentAt,
      type: item.type || (item.status === 'SENT' || item.status === 'Sent' ? 'sent' : 'scheduled')
    }));
  }
};
