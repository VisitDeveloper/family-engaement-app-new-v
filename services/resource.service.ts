import { apiClient, ApiError } from './api';
import type { ResourceResponseDto, GetResourcesParams, RateResourceDto } from '@/types';
import type { PaginatedResponse, PaginatedResult } from '@/types';
import { toPaginatedResult } from '@/types';

export type { ResourceResponseDto, GetResourcesParams, RateResourceDto };

export type GetResourcesResponse = PaginatedResult<ResourceResponseDto, 'resources'>;

export interface ResourceService {
  getAll(params?: GetResourcesParams): Promise<GetResourcesResponse>;
  getById(id: string): Promise<ResourceResponseDto>;
  create(data: Partial<ResourceResponseDto>): Promise<ResourceResponseDto>;
  update(id: string, data: Partial<ResourceResponseDto>): Promise<ResourceResponseDto>;
  delete(id: string): Promise<void>;
  rateResource(id: string, rating: RateResourceDto): Promise<void>;
  saveResource(id: string): Promise<void>;
}

class ResourceServiceImpl implements ResourceService {
  async getAll(params?: GetResourcesParams): Promise<GetResourcesResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.filter) {
        queryParams.append('filter', params.filter);
      }
      if (params?.category) {
        queryParams.append('category', params.category);
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }

      const queryString = queryParams.toString();
      const endpoint = `/resources${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get<PaginatedResponse<ResourceResponseDto>>(endpoint);
      return toPaginatedResult(response, 'resources');
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch resources. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getById(id: string): Promise<ResourceResponseDto> {
    try {
      const response = await apiClient.get<ResourceResponseDto>(`/resources/${id}`);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch resource. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async create(data: Partial<ResourceResponseDto>): Promise<ResourceResponseDto> {
    try {
      const response = await apiClient.post<ResourceResponseDto>('/resources', data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to create resource. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async update(id: string, data: Partial<ResourceResponseDto>): Promise<ResourceResponseDto> {
    try {
      const response = await apiClient.put<ResourceResponseDto>(`/resources/${id}`, data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to update resource. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/resources/${id}`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to delete resource. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async rateResource(id: string, rating: RateResourceDto): Promise<void> {
    try {
      await apiClient.post(`/resources/${id}/rate`, rating);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to rate resource. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async saveResource(id: string): Promise<void> {
    try {
      await apiClient.post(`/resources/${id}/save`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to save resource. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const resourceService: ResourceService = new ResourceServiceImpl();
