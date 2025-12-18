import { apiClient, ApiError } from './api';

export interface ParentDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
  phoneNumber?: string | null;
  role?: 'parent' | 'admin' | 'teacher';
  childName?: string | null;
}

export interface GetParentsParams {
  page?: number;
  limit?: number;
}

// Standard NestJS/Swagger paginated response structure
export interface GetParentsResponse {
  users: ParentDto[];
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface UserService {
  getParents(params?: GetParentsParams): Promise<GetParentsResponse>;
}

class UserServiceImpl implements UserService {
  async getParents(params?: GetParentsParams): Promise<GetParentsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
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

