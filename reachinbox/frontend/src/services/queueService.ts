import { apiRequest } from './api';
import { QueueStats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://reachinbox-backend-api-tceq.onrender.com';

export const queueService = {
  async getQueueStats(): Promise<QueueStats> {
    const data = await apiRequest<any>('/api/queue/stats');
    const counts = data.counts || data;
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: counts.paused || 0
    };
  },

  getBullMQDashboardUrl(): string {
    return `${API_BASE_URL.replace(/\/api\/?$/, '')}/admin/queues`;
  }
};
