import { apiClient, ApiError } from './api';

export interface AuthorResponseDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
}

export interface PostResponseDto {
  id: string;
  description: string;
  tags?: string[] | null;
  recommended: boolean;
  visibility: 'everyone' | 'followers' | 'private';
  images?: string[] | null;
  files?: string[] | null;
  author: AuthorResponseDto;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  isSaved?: boolean;
  isLiked?: boolean;
  lastComment?: CommentResponseDto | null;
}

export interface CommentResponseDto {
  id: string;
  content: string;
  author: AuthorResponseDto;
  parentCommentId?: string | null;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  replies?: CommentResponseDto[];
}

export interface CreatePostDto {
  description: string;
  tags?: string[];
  recommended?: boolean;
  visibility?: 'everyone' | 'followers' | 'private';
  images?: string[];
  files?: string[];
}

export interface UpdatePostDto {
  description?: string;
  tags?: string[];
  recommended?: boolean;
  visibility?: 'everyone' | 'followers' | 'private';
  images?: string[];
  files?: string[];
}

export interface CreateCommentDto {
  content: string;
}

export interface GetPostsParams {
  page?: number;
  limit?: number;
  filter?: 'all' | 'media' | 'reports' | 'recommended' | 'saved';
}

export interface PostService {
  getAll(params?: GetPostsParams): Promise<{ posts: PostResponseDto[], limit: number, page: number, total: number }>;
  getById(id: string): Promise<PostResponseDto>;
  create(data: CreatePostDto): Promise<PostResponseDto>;
  update(id: string, data: UpdatePostDto): Promise<PostResponseDto>;
  delete(id: string): Promise<void>;
  likePost(id: string): Promise<void>;
  savePost(id: string): Promise<void>;
  getPostComments(id: string): Promise<CommentResponseDto[]>;
  createComment(id: string, data: CreateCommentDto): Promise<CommentResponseDto>;
  replyToComment(commentId: string, data: CreateCommentDto): Promise<CommentResponseDto>;
  likeComment(commentId: string): Promise<void>;
  getSavedPosts(params?: GetPostsParams): Promise<{ posts: PostResponseDto[], limit: number, page: number, total: number }>;
}

class PostServiceImpl implements PostService {
  async getAll(params?: GetPostsParams): Promise<{ posts: PostResponseDto[], limit: number, page: number, total: number }> {
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

      const queryString = queryParams.toString();
      const endpoint = `/posts${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<{ posts: PostResponseDto[], limit: number, page: number, total: number }>(endpoint);
      console.log(response);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch posts. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getById(id: string): Promise<PostResponseDto> {
    try {
      const response = await apiClient.get<PostResponseDto>(`/posts/${id}`);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch post. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async create(data: CreatePostDto): Promise<PostResponseDto> {
    try {
      const response = await apiClient.post<PostResponseDto>('/posts', data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to create post. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async update(id: string, data: UpdatePostDto): Promise<PostResponseDto> {
    try {
      const response = await apiClient.put<PostResponseDto>(`/posts/${id}`, data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to update post. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/posts/${id}`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to delete post. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async likePost(id: string): Promise<void> {
    try {
      await apiClient.post(`/posts/${id}/like`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to like post. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async savePost(id: string): Promise<void> {
    try {
      await apiClient.post(`/posts/${id}/save`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to save post. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getPostComments(id: string): Promise<CommentResponseDto[]> {
    try {
      const response = await apiClient.get<CommentResponseDto[]>(`/posts/${id}/comments`);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch comments. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async createComment(id: string, data: CreateCommentDto): Promise<CommentResponseDto> {
    try {
      const response = await apiClient.post<CommentResponseDto>(`/posts/${id}/comments`, data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to create comment. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async replyToComment(commentId: string, data: CreateCommentDto): Promise<CommentResponseDto> {
    try {
      const response = await apiClient.post<CommentResponseDto>(`/posts/comments/${commentId}/reply`, data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to reply to comment. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async likeComment(commentId: string): Promise<void> {
    try {
      await apiClient.post(`/posts/comments/${commentId}/like`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to like comment. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getSavedPosts(params?: GetPostsParams): Promise<{ posts: PostResponseDto[], limit: number, page: number, total: number }> {
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
      
      const response = await apiClient.get<PostResponseDto[]>(endpoint);
      
      return {
        posts: Array.isArray(response) ? response : [],
        limit: params?.limit || 10,
        page: params?.page || 1,
        total: Array.isArray(response) ? response.length : 0,
      };
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch saved posts. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const postService: PostService = new PostServiceImpl();
