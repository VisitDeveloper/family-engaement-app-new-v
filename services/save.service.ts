import { apiClient, ApiError } from './api';
import type { PaginatedResponse } from '@/types';
import { toPaginatedResult } from '@/types';

export interface SaveService {
  savePost(postId: string): Promise<void>;
  saveResource(resourceId: string): Promise<void>;
  getSavedPosts(params?: { page?: number; limit?: number }): Promise<{ posts: unknown[]; total: number; page: number; limit: number; totalPages?: number }>;
  getSavedResources(params?: { page?: number; limit?: number }): Promise<{ resources: unknown[]; total: number; page: number; limit: number; totalPages?: number }>;
}

class SaveServiceImpl implements SaveService {
  async savePost(postId: string): Promise<void> {
    try {
      await apiClient.post(`/posts/${postId}/save`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to save post. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async saveResource(resourceId: string): Promise<void> {
    try {
      await apiClient.post(`/resources/${resourceId}/save`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to save resource. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getSavedPosts(params?: { page?: number; limit?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      const queryString = queryParams.toString();
      const endpoint = `/posts/saved/all${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get<PaginatedResponse<unknown>>(endpoint);
      return toPaginatedResult(response, 'posts');
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch saved posts. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getSavedResources(params?: { page?: number; limit?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      const queryString = queryParams.toString();
      const endpoint = `/resources/saved/all${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get<PaginatedResponse<unknown>>(endpoint);
      return toPaginatedResult(response, 'resources');
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch saved resources. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const saveService: SaveService = new SaveServiceImpl();

