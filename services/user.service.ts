import { apiClient, ApiError } from './api';

export interface ParentDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
  phoneNumber?: string | null;
  role?: 'parent' | 'admin' | 'teacher' | 'student';
  childName?: string | null;
}

export interface GetParentsParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Standard NestJS/Swagger paginated response structure
export interface GetParentsResponse {
  users: ParentDto[];
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface UserListItemDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
  phoneNumber?: string | null;
  role?: 'parent' | 'admin' | 'teacher' | 'student';
  childName?: string | null;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'parent' | 'teacher' | 'student' | ('parent' | 'teacher' | 'student')[];
}

export interface GetUsersResponse {
  users: UserListItemDto[];
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

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
        // اگر role یک array است، هر کدام را جداگانه اضافه کن
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
      
      const response = await apiClient.get<GetUsersResponse>(endpoint);
      return response;
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
      
      const response = await apiClient.get<GetParentsResponse>(endpoint);
      return response;
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

