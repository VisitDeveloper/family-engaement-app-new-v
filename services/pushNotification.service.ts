import { apiClient } from './api';

export interface RegisterTokenRequest {
  token: string;
  deviceId: string;
  deviceName: string;
  platform: 'ios' | 'android' | 'web';
}

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  deviceId: string | null;
  deviceName: string | null;
  platform: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class PushNotificationService {
  /**
   * Register token on server
   */
  async registerToken(data: RegisterTokenRequest): Promise<PushToken> {
    const response = await apiClient.post<PushToken>(
      '/push-notifications/register',
      data
    );
    return response;
  }

  /**
   * Unregister token from server
   */
  async unregisterToken(token: string): Promise<void> {
    const encodedToken = encodeURIComponent(token);
    await apiClient.delete(`/push-notifications/unregister?token=${encodedToken}`);
  }

  /**
   * Get list of user tokens
   */
  async getUserTokens(): Promise<PushToken[]> {
    const response = await apiClient.get<PushToken[]>(
      '/push-notifications/tokens'
    );
    return response;
  }
}

export const pushNotificationService = new PushNotificationService();
