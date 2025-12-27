import { apiClient, ApiError } from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword?: string;
}

// UserResponseDto from API
export interface UserResponseDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "teacher" | "parent";
  phoneNumber?: string;
  profilePicture?: string;
  childName?: string;
  subjects?: string[];
}

// LoginResponseDto from API
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserResponseDto;
  message: string;
  data?: {
    user?: any;
    access_token?: string;
    refresh_token?: string;
  };
}

// RefreshTokenResponse from API
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  message: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  // confirmPassword?: string;
}

export interface ChangePasswordResponse {
  message?: string;
  success?: boolean;
  access_token?: string; // ممکن است API یک token جدید برگرداند
  data?: {
    access_token?: string;
  };
}

// ProfileResponseDto from API
export interface ProfileResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "teacher" | "parent";
  phoneNumber?: string;
  profilePicture?: string;
  subjects?: string[]; // Array of subjects/interests
  childName?: string; // Child's name (for parent role)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  [key: string]: any; // برای فیلدهای اضافی که ممکن است از API بیایند
}

// UserProfile interface that maps API fields
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phone?: string; // backward compatibility
  profilePicture?: string;
  role: "admin" | "teacher" | "parent";
  subjects?: string[]; // Array of subjects/interests
  childName?: string; // Child's name (for parent role)
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface UpdateProfilePictureResponse {
  message?: string;
  profilePicture?: string;
  user?: ProfileResponse;
}

export interface AuthService {
  login(credentials: LoginRequest): Promise<AuthResponse>;
  register(data: RegisterRequest): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<RefreshTokenResponse>;
  changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse>;
  getProfile(): Promise<ProfileResponse>;
  updateProfilePicture(imageUri: string): Promise<UpdateProfilePictureResponse>;
}

class AuthServiceImpl implements AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/login",
        credentials
      );

      // استفاده از access_token و refresh_token
      const accessToken = response.access_token || response.data?.access_token;
      const refreshToken = response.refresh_token || response.data?.refresh_token;
      
      if (accessToken) {
        await apiClient.setAuthToken(accessToken);
      }
      
      if (refreshToken) {
        await apiClient.setRefreshToken(refreshToken);
      }

      // اگر user در data باشد، آن را به response.user منتقل می‌کنیم
      if (response.data?.user && !response.user) {
        response.user = response.data.user;
      }

      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || "Login failed. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/register", {
        email: data.email,
        password: data.password,
      });

      // استفاده از access_token و refresh_token
      const accessToken = response.access_token || response.data?.access_token;
      const refreshToken = response.refresh_token || response.data?.refresh_token;
      
      if (accessToken) {
        await apiClient.setAuthToken(accessToken);
      }
      
      if (refreshToken) {
        await apiClient.setRefreshToken(refreshToken);
      }

      // اگر user در data باشد، آن را به response.user منتقل می‌کنیم
      if (response.data?.user && !response.user) {
        response.user = response.data.user;
      }

      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || "Registration failed. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async logout(): Promise<void> {
    try {
      // فراخوانی API logout در صورت وجود endpoint
      try {
        await apiClient.post("/auth/logout");
      } catch {
        // اگر endpoint وجود نداشت یا خطا داد، ادامه می‌دهیم
        console.log(
          "Logout API endpoint not available or failed, clearing token locally"
        );
      }

      // پاک کردن token ها از storage
      await apiClient.clearAuthToken();
      await apiClient.clearRefreshToken();
    } catch (error) {
      console.error("Error during logout:", error);
      // حتی اگر خطا رخ دهد، token ها را پاک می‌کنیم
      await apiClient.clearAuthToken();
      await apiClient.clearRefreshToken();
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await apiClient.post<RefreshTokenResponse>(
        "/auth/refresh",
        { refresh_token: refreshToken }
      );

      // ذخیره token های جدید
      if (response.access_token) {
        await apiClient.setAuthToken(response.access_token);
      }
      
      if (response.refresh_token) {
        await apiClient.setRefreshToken(response.refresh_token);
      }

      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || "Failed to refresh token. Please login again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async changePassword(
    data: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> {
    try {
      const response = await apiClient.put<ChangePasswordResponse>(
        "/auth/change-password",
        {
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
          // confirmPassword: data.confirmPassword,
        }
      );

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
        message:
          apiError.message || "Password change failed. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await apiClient.get<ProfileResponse>("/auth/profile");
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to fetch profile. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async updateProfilePicture(
    imageUri: string
  ): Promise<UpdateProfilePictureResponse> {
    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Extract filename from URI
      const filename = imageUri.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      // Append file to FormData
      formData.append("file", {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);

      const response = await apiClient.uploadFile<UpdateProfilePictureResponse>(
        "/auth/profile/picture",
        formData
      );

      return response;
    } catch (error) {
      console.log(error);
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message ||
          "Failed to update profile picture. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const authService: AuthService = new AuthServiceImpl();
