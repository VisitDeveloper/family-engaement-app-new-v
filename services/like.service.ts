import { apiClient, ApiError } from "./api";

export interface LikeService {
  likePost(postId: string): Promise<void>;
  likeComment(commentId: string): Promise<void>;
  isPostLiked(postId: string): Promise<boolean>;
  isCommentLiked(commentId: string): Promise<boolean>;
}

class LikeServiceImpl implements LikeService {
  async likePost(postId: string): Promise<void> {
    try {
      await apiClient.post(`/posts/${postId}/like`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || "Failed to like post. Please try again.",
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

  async isPostLiked(postId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ isLiked: boolean }>(
        `/posts/${postId}/like/status`
      );
      return response.isLiked;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to check like status. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async isCommentLiked(commentId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ isLiked: boolean }>(
        `/posts/comments/${commentId}/like/status`
      );
      return response.isLiked;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to check like status. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const likeService: LikeService = new LikeServiceImpl();
