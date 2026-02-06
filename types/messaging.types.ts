export type ConversationType = 'direct' | 'group';

export interface UserDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
}

export interface MessageResponseDto {
  id: string;
  conversationId: string;
  senderId?: string | null;
  sender?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
  content?: string | null;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'poll' | 'announcement';
  mediaUrl?: string | null;
  fileName?: string | null;
  originalFilename?: string | null;
  fileSize?: string | null;
  mimeType?: string | null;
  duration?: string | null;
  thumbnailUrl?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  polls?: PollResponseDto[] | null;
  statuses?: string[] | null;
  userStatus?: string | null;
}

export interface ConversationResponseDto {
  id: string;
  type: ConversationType;
  name?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  inviteLink?: string | null;
  inviteCode?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  lastMessage?: MessageResponseDto | null;
  participantCount?: number;
  participants?: { id: string; user: UserDto }[];
}

export interface CreateConversationDto {
  type: ConversationType;
  name?: string;
  description?: string;
  imageUrl?: string;
  memberIds?: string[];
}

export interface UpdateConversationDto {
  name?: string;
  description?: string;
  imageUrl?: string;
}

export interface AddMembersDto {
  memberIds: string[];
}

export interface CreateMessageDto {
  conversationId: string;
  content?: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'poll' | 'announcement';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number | string;
  mimeType?: string;
  duration?: string;
  thumbnailUrl?: string;
  pollId?: string;
  replyToId?: string;
}

export interface UpdateMessageDto {
  content: string;
}

export interface GetMessagesParams {
  page?: number;
  limit?: number;
  before?: string;
}

export interface PollOptionResponseDto {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
  userVoted: boolean;
}

export interface PollResponseDto {
  id: string;
  question: string;
  options: PollOptionResponseDto[];
  isClosed: boolean;
  isMultipleChoice?: boolean;
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePollOptionDto {
  text: string;
}

export interface CreatePollDto {
  messageId: string;
  question: string;
  options: CreatePollOptionDto[];
}

export interface VotePollDto {
  pollOptionId: string;
}

export interface UploadFileResponse {
  url: string;
  originalName: string;
  size: number;
  mimetype: string;
  thumbnailUrl?: string;
}

export interface CreateClassroomDto {
  name: Record<string, unknown> | string;
  description?: Record<string, unknown> | string | null;
  imageUrl?: string | null;
  roomNumber?: string | null;
}

export interface UpdateClassroomDto {
  name?: Record<string, unknown> | string;
  description?: Record<string, unknown> | string | null;
  imageUrl?: string | null;
  roomNumber?: string | null;
}

export interface ClassroomResponseDto {
  id: string;
  name: Record<string, unknown> | string;
  description?: Record<string, unknown> | string | null;
  imageUrl?: string | null;
  roomNumber?: string | null;
  teacherId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetGroupsParams {
  page?: number;
  limit?: number;
}
