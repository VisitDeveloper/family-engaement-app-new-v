import { performAutoLogout } from '@/utils/auto-logout';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3006';

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

class ApiClient {
  private baseURL: string;
  private getLanguage: (() => string) | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // متد برای تنظیم function که زبان را برمی‌گرداند
  setLanguageGetter(getter: () => string): void {
    this.getLanguage = getter;
  }

  private async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  private async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('refresh_token');
      return token;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  private async setRefreshTokenInternal(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('refresh_token', token);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  }

  async removeRefreshToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('Error removing refresh token:', error);
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    await this.setRefreshTokenInternal(token);
  }

  async clearRefreshToken(): Promise<void> {
    await this.removeRefreshToken();
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) {
      // اگر در حال refresh هستیم، در صف منتظر بمان
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;
    const refreshToken = await this.getRefreshToken();

    if (!refreshToken) {
      this.processQueue(new Error('No refresh token available'), null);
      this.isRefreshing = false;
      return null;
    }

    try {
      const acceptLanguage = this.getLanguage ? this.getLanguage() : 'en';
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': acceptLanguage,
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // اگر refresh token نامعتبر بود
        this.processQueue(
          {
            message: data.message || 'Failed to refresh token',
            status: response.status,
            data,
          },
          null
        );
        this.isRefreshing = false;
        return null;
      }

      const { access_token, refresh_token: newRefreshToken } = data;

      // ذخیره token های جدید
      if (access_token) {
        await this.setToken(access_token);
      }
      if (newRefreshToken) {
        await this.setRefreshTokenInternal(newRefreshToken);
      }

      // پردازش صف
      this.processQueue(null, access_token);
      this.isRefreshing = false;

      return access_token;
    } catch (error) {
      // اگر refresh token نامعتبر بود
      this.processQueue(error, null);
      this.isRefreshing = false;
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const token = await this.getToken();
    
    const headers = new Headers();
    
    // Copy existing headers
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers.set(key, value);
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers.set(key, value);
        });
      } else {
        Object.entries(options.headers).forEach(([key, value]) => {
          headers.set(key, String(value));
        });
      }
    }
    
    // Don't set Content-Type for FormData, let the browser set it with boundary
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // اضافه کردن Accept-Language header
    // پیش‌فرض: en-US، اما اگر language getter تنظیم شده باشد، از آن استفاده می‌کند
    const acceptLanguage = this.getLanguage ? this.getLanguage() : 'en';
    headers.set('Accept-Language', acceptLanguage);

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // اگر خطای 401 (Unauthorized) باشد و قبلاً retry نکرده‌ایم
        if (response.status === 401 && retryCount === 0) {
          // سعی می‌کنیم token را refresh کنیم
          const newAccessToken = await this.refreshAccessToken();
          
          if (newAccessToken) {
            // retry درخواست با token جدید
            return this.request<T>(endpoint, options, retryCount + 1);
          } else {
            // اگر refresh موفق نبود، logout می‌کنیم
            performAutoLogout().catch((logoutError) => {
              console.error('Error during auto logout:', logoutError);
            });
            
            // throw error برای اینکه درخواست اصلی fail شود
            const error: ApiError = {
              message: data.message || 'Session expired. Please login again.',
              status: response.status,
              data,
            };
            throw error;
          }
        }
        
        const error: ApiError = {
          message: data.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          data,
        };
        
        throw error;
      }

      return data as T;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw {
          message: 'Network error. Please check your connection.',
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async uploadFile<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
  }

  async setAuthToken(token: string): Promise<void> {
    await this.setToken(token);
  }

  async clearAuthToken(): Promise<void> {
    await this.removeToken();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

