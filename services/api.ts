import AsyncStorage from '@react-native-async-storage/async-storage';
import { performAutoLogout } from '@/utils/auto-logout';

const API_BASE_URL = 'http://localhost:3006';

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

class ApiClient {
  private baseURL: string;
  private getLanguage: (() => string) | null = null;

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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
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
        const error: ApiError = {
          message: data.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          data,
        };
        
        // اگر خطای 401 (Unauthorized) باشد، به صورت خودکار logout می‌کنیم
        if (response.status === 401) {
          // اجرای logout خودکار در پس‌زمینه (بدون await تا blocking نشود)
          performAutoLogout().catch((logoutError) => {
            console.error('Error during auto logout:', logoutError);
          });
        }
        
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

