import { apiRequest } from './api';
import { SlackConnection } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://reachinbox-backend-api-tceq.onrender.com';

export const slackService = {
  async getStatus(): Promise<SlackConnection> {
    try {
      const data = await apiRequest<SlackConnection>('/api/integrations/slack/status');
      return {
        connected: data.connected || false,
        teamName: data.teamName,
        channel: data.channel,
        connectedAt: data.connectedAt || data.createdAt
      };
    } catch {
      return { connected: false };
    }
  },

  async initiateOAuth(): Promise<void> {
    const slackConnectUrl = `${API_BASE_URL.replace(/\/api\/?$/, '')}/auth/slack/connect`;
    window.location.href = slackConnectUrl;
  },

  async disconnect(): Promise<SlackConnection> {
    await apiRequest('/api/integrations/slack', { method: 'DELETE' });
    return { connected: false };
  }
};
