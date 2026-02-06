import { apiClient, ApiError } from './api';
import type { CommentResponseDto, CreateCommentDto, AuthorResponseDto } from '@/types';
import type { PaginatedResponse, PaginatedResult } from '@/types';
import { toPaginatedResult } from '@/types';

export type { CommentResponseDto, CreateCommentDto, AuthorResponseDto };

export interface UpdateCommentDto {
  content: string;
}

export interface GetCommentsParams {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'mostLiked';
}

export type GetCommentRepliesResponse = PaginatedResult<CommentResponseDto, 'replies'>;

export interface CommentService {
  getPostComments(postId: string, params?: GetCommentsParams): Promise<CommentResponseDto[]>;
  getCommentById(commentId: string): Promise<CommentResponseDto>;
  createComment(postId: string, data: CreateCommentDto): Promise<CommentResponseDto>;
  updateComment(commentId: string, data: UpdateCommentDto): Promise<CommentResponseDto>;
  deleteComment(commentId: string): Promise<void>;
  replyToComment(commentId: string, data: CreateCommentDto): Promise<CommentResponseDto>;
  getCommentReplies(commentId: string, params?: GetCommentsParams): Promise<GetCommentRepliesResponse>;
}

class CommentServiceImpl implements CommentService {
  async getPostComments(postId: string, params?: GetCommentsParams): Promise<CommentResponseDto[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.sort) {
        queryParams.append('sort', params.sort);
      }

      const queryString = queryParams.toString();
      const endpoint = `/posts/${postId}/comments${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<CommentResponseDto[]>(endpoint);
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

  async getCommentById(commentId: string): Promise<CommentResponseDto> {
    try {
      const response = await apiClient.get<CommentResponseDto>(`/posts/comments/${commentId}`);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch comment. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async createComment(postId: string, data: CreateCommentDto): Promise<CommentResponseDto> {
    try {
      const response = await apiClient.post<CommentResponseDto>(`/posts/${postId}/comments`, data);
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

  async updateComment(commentId: string, data: UpdateCommentDto): Promise<CommentResponseDto> {
    try {
      const response = await apiClient.put<CommentResponseDto>(`/posts/comments/${commentId}`, data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to update comment. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      await apiClient.delete(`/posts/comments/${commentId}`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to delete comment. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async replyToComment(commentId: string, data: CreateCommentDto): Promise<CommentResponseDto> {
    try {
      const response = await apiClient.post<CommentResponseDto>(`/posts/comments/${commentId}/reply`, {
        ...data,
        parentCommentId: commentId,
      });
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

  async getCommentReplies(commentId: string, params?: GetCommentsParams): Promise<GetCommentRepliesResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.sort) {
        queryParams.append('sort', params.sort);
      }

      
      const queryString = queryParams.toString();
      const endpoint = `/posts/comments/${commentId}/replies${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get<PaginatedResponse<CommentResponseDto>>(endpoint);
      return toPaginatedResult(response, 'replies');
    } catch (error) {
      

      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to fetch comment replies. Please try again.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const commentService: CommentService = new CommentServiceImpl();

