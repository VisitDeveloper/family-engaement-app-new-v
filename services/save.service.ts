import { apiClient, ApiError } from './api';

export interface SaveService {
  savePost(postId: string): Promise<void>;
  saveResource(resourceId: string): Promise<void>;
  unsaveResource(resourceId: string): Promise<void>;
  isPostSaved(postId: string): Promise<boolean>;
  isResourceSaved(resourceId: string): Promise<boolean>;
  getSavedPosts(params?: { page?: number; limit?: number }): Promise<any>;
  getSavedResources(params?: { page?: number; limit?: number }): Promise<any>;
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

  async unsaveResource(resourceId: string): Promise<void> {
    try {
      await apiClient.delete(`/resources/${resourceId}/save`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to unsave resource. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async isPostSaved(postId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ isSaved: boolean }>(`/posts/${postId}/save/status`);
      return response.isSaved;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to check save status. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async isResourceSaved(resourceId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ isSaved: boolean }>(`/resources/${resourceId}/save/status`);
      return response.isSaved;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to check save status. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getSavedPosts(params?: { page?: number; limit?: number }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const queryString = queryParams.toString();
      const endpoint = `/posts/saved/all${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any>(endpoint);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch saved posts. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getSavedResources(params?: { page?: number; limit?: number }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const queryString = queryParams.toString();
      const endpoint = `/resources/saved/all${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<any>(endpoint);
      return response;
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

