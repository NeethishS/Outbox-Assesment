import { apiRequest } from './api';
import { User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://reachinbox-backend-api-tceq.onrender.com';

export const authService = {
  async loginWithGoogle(): Promise<void> {
    const googleOAuthUrl = `${API_BASE_URL.replace(/\/api\/?$/, '')}/auth/google`;
    window.location.href = googleOAuthUrl;
  },

  async loginWithDemo(): Promise<void> {
    const demoAuthUrl = `${API_BASE_URL.replace(/\/api\/?$/, '')}/auth/demo`;
    window.location.href = demoAuthUrl;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await apiRequest<any>('/api/auth/me');
      const user = data?.user || data;
      if (user && user.id && user.email) {
        return {
          id: user.id,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          avatarUrl: user.avatarUrl || user.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore API disconnect errors
    } finally {
      window.location.reload();
    }
  }
};
