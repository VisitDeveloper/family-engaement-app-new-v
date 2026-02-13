import type {
  AuthResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ProfileResponseDto,
  RefreshTokenResponse,
  UpdateProfilePictureResponse,
  UpdateProfileRequest,
  UpdateSettingsRequest,
  UserResponseDto,
  UserSettings,
} from "@/types";
import { unregisterPushTokenOnLogout } from "@/utils/pushNotifications";
import { apiClient, ApiError } from "./api";

export type { AuthResponse, ProfileResponseDto, RefreshTokenResponse, UpdateProfilePictureResponse, UserResponseDto };

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword?: string;
}

/** Profile as used in app (alias + index signature for extra API fields) */
export interface ProfileResponse extends ProfileResponseDto {
  [key: string]: unknown;
}

/** UserProfile alias for profile display */
export type UserProfile = ProfileResponseDto & { phone?: string;[key: string]: unknown };

export interface AuthService {
  login(credentials: LoginRequest): Promise<AuthResponse>;
  register(data: RegisterRequest): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<RefreshTokenResponse>;
  changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse>;
  getProfile(): Promise<ProfileResponse>;
  updateProfile(body: UpdateProfileRequest): Promise<ProfileResponse>;
  /** PATCH /auth/settings — only send fields to update */
  updateSettings(body: UpdateSettingsRequest): Promise<{ settings: UserSettings }>;
  updateProfilePicture(imageUri: string): Promise<UpdateProfilePictureResponse>;
}

class AuthServiceImpl implements AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/login",
        credentials
      );

      // Use access_token and refresh_token
      const accessToken = response.access_token || response.data?.access_token;
      const refreshToken = response.refresh_token || response.data?.refresh_token;

      if (accessToken) {
        await apiClient.setAuthToken(accessToken);
      }

      if (refreshToken) {
        await apiClient.setRefreshToken(refreshToken);
      }

      // If user is in data, we transfer it to response.user
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

      // Use access_token and refresh_token
      const accessToken = response.access_token || response.data?.access_token;
      const refreshToken = response.refresh_token || response.data?.refresh_token;

      if (accessToken) {
        await apiClient.setAuthToken(accessToken);
      }

      if (refreshToken) {
        await apiClient.setRefreshToken(refreshToken);
      }

      // If user is in data, we transfer it to response.user
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
      // Unregister push notification token
      await unregisterPushTokenOnLogout();

      // Call logout API if endpoint exists
      try {
        await apiClient.post("/auth/logout");
      } catch {
        // If endpoint doesn't exist or errors, continue
        console.log(
          "Logout API endpoint not available or failed, clearing token locally"
        );
      }

      // Clear tokens from storage
      await apiClient.clearAuthToken();
      await apiClient.clearRefreshToken();
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if an error occurs, we clear the tokens
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

      // Save new tokens
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

      // If error is 401 or 403, token is invalid and we need to login again
      if (apiError.status === 401 || apiError.status === 403) {
        // Token is invalid, clear it
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
      const response = await apiClient.get<ProfileResponseDto>("/auth/profile");
      return response as ProfileResponse;
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

  async updateProfile(body: UpdateProfileRequest): Promise<ProfileResponse> {
    try {
      const response = await apiClient.put<ProfileResponseDto>(
        "/auth/profile",
        body
      );
      return response as ProfileResponse;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to update profile. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async updateSettings(body: UpdateSettingsRequest): Promise<{ settings: UserSettings }> {
    try {
      // PATCH: فقط فیلدهایی که مقدار دارن برن (همون که تغییر کرده)
      const payload = Object.fromEntries(
        Object.entries(body).filter(([, v]) => v !== undefined)
      ) as UpdateSettingsRequest;
      const response = await apiClient.patch<{ settings: UserSettings }>(
        "/auth/settings",
        payload
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to update settings. Please try again.",
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
