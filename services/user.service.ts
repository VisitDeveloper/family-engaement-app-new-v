import { apiClient, ApiError } from './api';
import type { UserListItemDto, ParentDto } from '@/types';
import type { PaginatedResponse, PaginatedResult } from '@/types';
import { toPaginatedResult } from '@/types';

export type { UserListItemDto, ParentDto };

export interface GetParentsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'parent' | 'teacher' | 'student' | ('parent' | 'teacher' | 'student')[];
}

export type GetParentsResponse = PaginatedResult<ParentDto, 'users'>;
export type GetUsersResponse = PaginatedResult<UserListItemDto, 'users'>;

export interface UserService {
  getAll(params?: GetUsersParams): Promise<GetUsersResponse>;
  getParents(params?: GetParentsParams): Promise<GetParentsResponse>;
}

class UserServiceImpl implements UserService {
  async getAll(params?: GetUsersParams): Promise<GetUsersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.role) {
        // If role is an array, add each one separately
        if (Array.isArray(params.role)) {
          params.role.forEach((r) => {
            queryParams.append('role', r);
          });
        } else {
          queryParams.append('role', params.role);
        }
      }

      const queryString = queryParams.toString();
      const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get<PaginatedResponse<UserListItemDto>>(endpoint);
      return toPaginatedResult(response, 'users');
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch users. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getParents(params?: GetParentsParams): Promise<GetParentsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }

      const queryString = queryParams.toString();
      const endpoint = `/users/parents${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get<PaginatedResponse<ParentDto>>(endpoint);
      return toPaginatedResult(response, 'users');
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch parents. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const userService: UserService = new UserServiceImpl();

