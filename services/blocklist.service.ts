import { apiClient, ApiError } from './api';
import type { UserListItemDto } from '@/types';

export interface BlockListResponse {
  items: UserListItemDto[];
  total: number;
}

export interface AllowListResponse {
  items: UserListItemDto[];
  total: number;
}

export interface AddToBlockListRequest {
  userId: string;
}

export interface AddToAllowListRequest {
  userId: string;
}

export interface ApiResponse {
  message: string;
}

export interface BlocklistService {
  getBlockList(): Promise<BlockListResponse>;
  getAllowList(): Promise<AllowListResponse>;
  addToBlockList(userId: string): Promise<ApiResponse>;
  removeFromBlockList(userId: string): Promise<ApiResponse>;
  addToAllowList(userId: string): Promise<ApiResponse>;
  removeFromAllowList(userId: string): Promise<ApiResponse>;
}

class BlocklistServiceImpl implements BlocklistService {
  async getBlockList(): Promise<BlockListResponse> {
    try {
      const response = await apiClient.get<BlockListResponse>('/users/blocklist');
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch block list. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getAllowList(): Promise<AllowListResponse> {
    try {
      const response = await apiClient.get<AllowListResponse>('/users/allowlist');
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch allow list. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async addToBlockList(userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/users/blocklist', {
        userId,
      });
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to add user to block list. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async removeFromBlockList(userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete<ApiResponse>(`/users/blocklist/${userId}`);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to remove user from block list. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async addToAllowList(userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>('/users/allowlist', {
        userId,
      });
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to add user to allow list. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async removeFromAllowList(userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete<ApiResponse>(`/users/allowlist/${userId}`);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to remove user from allow list. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const blocklistService: BlocklistService = new BlocklistServiceImpl();
