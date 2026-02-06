import type { AuthorResponseDto } from './common.types';

export interface PostResponseDto {
  id: string;
  description: string;
  tags?: string[] | null;
  recommended: boolean;
  visibility: 'everyone' | 'followers' | 'private';
  images?: string[] | null;
  files?: string[] | null;
  classroomId?: string | null;
  classroom?: { id: string; name: string } | null;
  author: AuthorResponseDto;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  isSaved?: boolean;
  isLiked?: boolean;
  comments?: CommentResponseDto[];
  hasMoreComments?: boolean;
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
  classroomId?: string | null;
}

export interface UpdatePostDto {
  description?: string;
  tags?: string[];
  recommended?: boolean;
  visibility?: 'everyone' | 'followers' | 'private';
  images?: string[];
  files?: string[];
  classroomId?: string | null;
}

export interface CreateCommentDto {
  content: string;
}

export interface GetPostsParams {
  page?: number;
  limit?: number;
  filter?: 'all' | 'media' | 'reports' | 'recommended' | 'saved';
}
