import { apiClient, ApiError } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  access_token: string; // فقط access_token
  user?: {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    role?: 'admin' | 'teacher' | 'parent';
    avatar?: string;
    image?: string;
    [key: string]: any; // برای فیلدهای اضافی که ممکن است از API بیایند
  };
  data?: {
    user?: any;
    access_token?: string;
  };
  message?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface ChangePasswordResponse {
  message?: string;
  success?: boolean;
  access_token?: string; // ممکن است API یک token جدید برگرداند
  data?: {
    access_token?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  image?: string;
  profilePicture?: string;
  role?: 'admin' | 'teacher' | 'parent';
  [key: string]: any; // برای فیلدهای اضافی که ممکن است از API بیایند
}

export interface ProfileResponse {
 
  // ممکن است API مستقیماً user را برگرداند
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  image?: string;
  profilePicture?: string;
  role?: 'admin' | 'teacher' | 'parent';
  [key: string]: any;
}

export interface AuthService {
  login(credentials: LoginRequest): Promise<AuthResponse>;
  register(data: RegisterRequest): Promise<AuthResponse>;
  logout(): Promise<void>;
  changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse>;
  getProfile(): Promise<ProfileResponse>;
}

class AuthServiceImpl implements AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      // استفاده از access_token
      const accessToken = response.access_token || response.data?.access_token;
      if (accessToken) {
        await apiClient.setAuthToken(accessToken);
      }

      // اگر user در data باشد، آن را به response.user منتقل می‌کنیم
      if (response.data?.user && !response.user) {
        response.user = response.data.user;
      }

      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Login failed. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        email: data.email,
        password: data.password,
      });

      // استفاده از access_token
      const accessToken = response.access_token || response.data?.access_token;
      if (accessToken) {
        await apiClient.setAuthToken(accessToken);
      }

      // اگر user در data باشد، آن را به response.user منتقل می‌کنیم
      if (response.data?.user && !response.user) {
        response.user = response.data.user;
      }

      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Registration failed. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async logout(): Promise<void> {
    try {
      // فراخوانی API logout در صورت وجود endpoint
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // اگر endpoint وجود نداشت یا خطا داد، ادامه می‌دهیم
        console.log('Logout API endpoint not available or failed, clearing token locally');
      }
      
      // پاک کردن token از storage
      await apiClient.clearAuthToken();
    } catch (error) {
      console.error('Error during logout:', error);
      // حتی اگر خطا رخ دهد، token را پاک می‌کنیم
      await apiClient.clearAuthToken();
    }
  }

  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
      const response = await apiClient.put<ChangePasswordResponse>('/auth/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      // اگر API یک token جدید برگرداند، آن را ذخیره می‌کنیم
      const accessToken = response.access_token || response.data?.access_token;
      if (accessToken) {
        await apiClient.setAuthToken(accessToken);
      }

      return response;
    } catch (error) {
      const apiError = error as ApiError;
      
      // اگر خطای 401 یا 403 باشد، token باطل شده و باید دوباره لاگین کنیم
      if (apiError.status === 401 || apiError.status === 403) {
        // Token باطل شده، آن را پاک می‌کنیم
        await apiClient.clearAuthToken();
      }
      
      throw {
        message: apiError.message || 'Password change failed. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await apiClient.get<ProfileResponse>('/auth/profile');

      // اگر user در data باشد، آن را به response.user منتقل می‌کنیم
      if (response.data?.user && !response.user) {
        response.user = response.data.user;
      }

      // اگر API مستقیماً user را برگرداند (بدون wrapper)، آن را به response.user منتقل می‌کنیم
      if (!response.user && (response.id || response.email)) {
        response.user = {
          id: response.id || '',
          email: response.email || '',
          firstName: response.firstName,
          lastName: response.lastName,
          name: response.name,
          phone: response.phone,
          avatar: response.avatar || response.image || response.profilePicture,
          role: response.role,
          ...response,
        } as UserProfile;
      }

      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch profile. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const authService: AuthService = new AuthServiceImpl();

