import { apiClient, ApiError } from "./api";
import type {
  PostResponseDto,
  CommentResponseDto,
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  GetPostsParams,
} from "@/types";
import type { PaginatedResponse, PaginatedResult } from "@/types";
import { toPaginatedResult } from "@/types";

export type {
  PostResponseDto,
  CommentResponseDto,
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  GetPostsParams,
};

export type GetPostsResponse = PaginatedResult<PostResponseDto, "posts">;

export interface PostService {
  getAll(params?: GetPostsParams): Promise<GetPostsResponse>;
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
  getSavedPosts(params?: GetPostsParams): Promise<GetPostsResponse>;
}

class PostServiceImpl implements PostService {
  async getAll(
    params?: GetPostsParams
  ): Promise<{
    posts: PostResponseDto[];
    limit: number;
    page: number;
    total: number;
  }> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) {
        queryParams.append("page", params.page.toString());
      }
      if (params?.limit) {
        queryParams.append("limit", params.limit.toString());
      }
      if (params?.filter) {
        queryParams.append("filter", params.filter);
      }

      const queryString = queryParams.toString();
      const endpoint = `/posts${queryString ? `?${queryString}` : ""}`;
      const response = await apiClient.get<PaginatedResponse<PostResponseDto>>(endpoint);
      return toPaginatedResult(response, "posts");
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || "Failed to fetch posts. Please try again.",
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
        message: apiError.message || "Failed to fetch post. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async create(data: CreatePostDto): Promise<PostResponseDto> {
    try {
      const response = await apiClient.post<PostResponseDto>("/posts", data);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || "Failed to create post. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async update(id: string, data: UpdatePostDto): Promise<PostResponseDto> {
    try {
      const response = await apiClient.put<PostResponseDto>(
        `/posts/${id}`,
        data
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || "Failed to update post. Please try again.",
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
        message: apiError.message || "Failed to delete post. Please try again.",
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
        message: apiError.message || "Failed to like post. Please try again.",
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
        message: apiError.message || "Failed to save post. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getPostComments(id: string): Promise<CommentResponseDto[]> {
    try {
      const response = await apiClient.get<CommentResponseDto[]>(
        `/posts/${id}/comments`
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to fetch comments. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async createComment(
    id: string,
    data: CreateCommentDto
  ): Promise<CommentResponseDto> {
    try {
      const response = await apiClient.post<CommentResponseDto>(
        `/posts/${id}/comments`,
        data
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to create comment. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async replyToComment(
    commentId: string,
    data: CreateCommentDto
  ): Promise<CommentResponseDto> {
    try {
      const response = await apiClient.post<CommentResponseDto>(
        `/posts/comments/${commentId}/reply`,
        data
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to reply to comment. Please try again.",
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
        message:
          apiError.message || "Failed to like comment. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getSavedPosts(
    params?: GetPostsParams
  ): Promise<{
    posts: PostResponseDto[];
    limit: number;
    page: number;
    total: number;
  }> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) {
        queryParams.append("page", params.page.toString());
      }
      if (params?.limit) {
        queryParams.append("limit", params.limit.toString());
      }

      const queryString = queryParams.toString();
      const endpoint = `/posts/saved/all${
        queryString ? `?${queryString}` : ""
      }`;
      const response = await apiClient.get<PaginatedResponse<PostResponseDto>>(endpoint);
      return toPaginatedResult(response, "posts");
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to fetch saved posts. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const postService: PostService = new PostServiceImpl();
