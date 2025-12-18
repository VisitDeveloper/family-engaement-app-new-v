import { apiClient, ApiError } from "./api";

// Types
export type ConversationType = "direct" | "group";

export interface UserDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
}

export interface ConversationResponseDto {
  id: string;
  type: ConversationType;
  name?: Record<string, any> | string | null;
  description?: Record<string, any> | string | null;
  imageUrl?: string | null;
  inviteLink?: string | null;
  inviteCode?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage?: MessageResponseDto | null;
  participantCount: number;
  participants?: UserDto[];
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

export interface MessageResponseDto {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: UserDto | null;
  content?: string | null;
  type: "text" | "image" | "video" | "audio" | "file" | "poll";
  mediaUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  pollId?: string | null;
  replyToId?: string | null;
  replyTo?: MessageResponseDto | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageDto {
  conversationId: string;
  content?: string;
  type: "text" | "image" | "video" | "audio" | "file" | "poll";
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  pollId?: string;
  replyToId?: string;
}

export interface GetMessagesParams {
  page?: number;
  limit?: number;
  before?: string; // Message ID to fetch messages before
}

export interface PollOptionResponseDto {
  id: string;
  text: string;
  voteCount: number;
  voters?: UserDto[];
}

export interface PollResponseDto {
  id: string;
  conversationId: string;
  question: string;
  options: PollOptionResponseDto[];
  isMultipleChoice: boolean;
  isClosed: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePollOptionDto {
  text: string;
}

export interface CreatePollDto {
  conversationId: string;
  question: string;
  options: CreatePollOptionDto[];
  isMultipleChoice?: boolean;
}

export interface VotePollDto {
  optionIds: string[];
}

export interface UploadFileResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// Classroom types
export interface CreateClassroomDto {
  name: Record<string, any> | string;
  description?: Record<string, any> | string | null;
  imageUrl?: string | null;
  roomNumber?: string | null;
}

export interface UpdateClassroomDto {
  name?: Record<string, any> | string;
  description?: Record<string, any> | string | null;
  imageUrl?: string | null;
  roomNumber?: string | null;
}

export interface ClassroomResponseDto {
  id: string;
  name: Record<string, any> | string;
  description?: Record<string, any> | string | null;
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

export interface MessagingService {
  // Conversations
  createConversation(
    data: CreateConversationDto
  ): Promise<ConversationResponseDto>;
  getConversations(): Promise<{
    conversations: ConversationResponseDto[];
    limit: number;
    page: number;
    total: number;
  }>;
  getGroups(params?: GetGroupsParams): Promise<{
    groups: ConversationResponseDto[];
    limit: number;
    page: number;
    total: number;
  }>;
  getConversationById(id: string): Promise<ConversationResponseDto>;
  updateConversation(
    id: string,
    data: UpdateConversationDto
  ): Promise<ConversationResponseDto>;
  addMembers(conversationId: string, data: AddMembersDto): Promise<void>;
  removeMember(conversationId: string, memberId: string): Promise<void>;

  // Messages
  createMessage(data: CreateMessageDto): Promise<MessageResponseDto>;
  getMessages(
    conversationId: string,
    params?: GetMessagesParams
  ): Promise<{
    messages: MessageResponseDto[];
    limit: number;
    page: number;
    total: number;
  }>;
  markMessageAsRead(messageId: string): Promise<void>;
  markConversationAsRead(conversationId: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;

  // File Uploads
  uploadImage(file: FormData): Promise<UploadFileResponse>;
  uploadVideo(file: FormData): Promise<UploadFileResponse>;
  uploadAudio(file: FormData): Promise<UploadFileResponse>;
  uploadFile(file: FormData): Promise<UploadFileResponse>;
  uploadMultipleFiles(files: FormData): Promise<UploadFileResponse[]>;

  // Polls
  createPoll(data: CreatePollDto): Promise<PollResponseDto>;
  getPoll(pollId: string): Promise<PollResponseDto>;
  votePoll(pollId: string, data: VotePollDto): Promise<void>;
  closePoll(pollId: string): Promise<void>;

  // Classrooms
  createClassroom(data: CreateClassroomDto): Promise<ClassroomResponseDto>;
  getClassrooms(): Promise<ClassroomResponseDto[]>;
  getClassroomById(id: string): Promise<ClassroomResponseDto>;
  updateClassroom(
    id: string,
    data: UpdateClassroomDto
  ): Promise<ClassroomResponseDto>;
  deleteClassroom(id: string): Promise<void>;
}

class MessagingServiceImpl implements MessagingService {
  // Conversations
  async createConversation(
    data: CreateConversationDto
  ): Promise<ConversationResponseDto> {
    try {
      const response = await apiClient.post<ConversationResponseDto>(
        "/messaging/conversations",
        data
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message ||
          "Failed to create conversation. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getConversations(): Promise<{
    conversations: ConversationResponseDto[];
    limit: number;
    page: number;
    total: number;
  }> {
    try {
      const response = await apiClient.get<{
        conversations: ConversationResponseDto[];
        limit: number;
        page: number;
        total: number;
      }>("/messaging/conversations");
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message ||
          "Failed to fetch conversations. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getGroups(params?: GetGroupsParams): Promise<{
    groups: ConversationResponseDto[];
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
      const endpoint = `/messaging/groups${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await apiClient.get<{
        groups: ConversationResponseDto[];
        limit: number;
        page: number;
        total: number;
      }>(endpoint);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to fetch groups. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getConversationById(id: string): Promise<ConversationResponseDto> {
    try {
      const response = await apiClient.get<ConversationResponseDto>(
        `/messaging/conversations/${id}`
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to fetch conversation. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async updateConversation(
    id: string,
    data: UpdateConversationDto
  ): Promise<ConversationResponseDto> {
    try {
      const response = await apiClient.put<ConversationResponseDto>(
        `/messaging/conversations/${id}`,
        data
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message ||
          "Failed to update conversation. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async addMembers(conversationId: string, data: AddMembersDto): Promise<void> {
    try {
      await apiClient.post(
        `/messaging/conversations/${conversationId}/members`,
        data
      );
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || "Failed to add members. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async removeMember(conversationId: string, memberId: string): Promise<void> {
    try {
      await apiClient.delete(
        `/messaging/conversations/${conversationId}/members/${memberId}`
      );
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to remove member. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  // Messages
  async createMessage(data: CreateMessageDto): Promise<MessageResponseDto> {
    try {
      const response = await apiClient.post<MessageResponseDto>(
        "/messaging/messages",
        data
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to send message. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getMessages(
    conversationId: string,
    params?: GetMessagesParams
  ): Promise<{
    messages: MessageResponseDto[];
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
      if (params?.before) {
        queryParams.append("before", params.before);
      }

      const queryString = queryParams.toString();
      const endpoint = `/messaging/conversations/${conversationId}/messages${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await apiClient.get<{
        messages: MessageResponseDto[];
        limit: number;
        page: number;
        total: number;
      }>(endpoint);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to fetch messages. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await apiClient.patch(`/messaging/messages/${messageId}/read`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message ||
          "Failed to mark message as read. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    try {
      await apiClient.patch(`/messaging/conversations/${conversationId}/read`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message ||
          "Failed to mark conversation as read. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await apiClient.delete(`/messaging/messages/${messageId}`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to delete message. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  // File Uploads
  async uploadImage(file: FormData): Promise<UploadFileResponse> {
    try {
      const response = await apiClient.uploadFile<UploadFileResponse>(
        "/messaging/upload/image",
        file
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to upload image. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async uploadVideo(file: FormData): Promise<UploadFileResponse> {
    try {
      const response = await apiClient.uploadFile<UploadFileResponse>(
        "/messaging/upload/video",
        file
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to upload video. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async uploadAudio(file: FormData): Promise<UploadFileResponse> {
    try {
      const response = await apiClient.uploadFile<UploadFileResponse>(
        "/messaging/upload/audio",
        file
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to upload audio. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async uploadFile(file: FormData): Promise<UploadFileResponse> {
    try {
      const response = await apiClient.uploadFile<UploadFileResponse>(
        "/messaging/upload/file",
        file
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || "Failed to upload file. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async uploadMultipleFiles(files: FormData): Promise<UploadFileResponse[]> {
    try {
      const response = await apiClient.uploadFile<UploadFileResponse[]>(
        "/messaging/upload/multiple",
        files
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to upload files. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  // Polls
  async createPoll(data: CreatePollDto): Promise<PollResponseDto> {
    try {
      const response = await apiClient.post<PollResponseDto>(
        "/messaging/polls",
        data
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || "Failed to create poll. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getPoll(pollId: string): Promise<PollResponseDto> {
    try {
      const response = await apiClient.get<PollResponseDto>(
        `/messaging/polls/${pollId}`
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || "Failed to fetch poll. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async votePoll(pollId: string, data: VotePollDto): Promise<void> {
    try {
      await apiClient.post(`/messaging/polls/${pollId}/vote`, data);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to vote on poll. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async closePoll(pollId: string): Promise<void> {
    try {
      await apiClient.patch(`/messaging/polls/${pollId}/close`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || "Failed to close poll. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  // Classrooms
  async createClassroom(
    data: CreateClassroomDto
  ): Promise<ClassroomResponseDto> {
    try {
      const response = await apiClient.post<ClassroomResponseDto>(
        "/messaging/classrooms",
        data
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to create classroom. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getClassrooms(): Promise<ClassroomResponseDto[]> {
    try {
      const response = await apiClient.get<ClassroomResponseDto[]>(
        "/messaging/classrooms"
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to fetch classrooms. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async getClassroomById(id: string): Promise<ClassroomResponseDto> {
    try {
      const response = await apiClient.get<ClassroomResponseDto>(
        `/messaging/classrooms/${id}`
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to fetch classroom. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async updateClassroom(
    id: string,
    data: UpdateClassroomDto
  ): Promise<ClassroomResponseDto> {
    try {
      const response = await apiClient.put<ClassroomResponseDto>(
        `/messaging/classrooms/${id}`,
        data
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to update classroom. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async deleteClassroom(id: string): Promise<void> {
    try {
      await apiClient.delete(`/messaging/classrooms/${id}`);
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message:
          apiError.message || "Failed to delete classroom. Please try again.",
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const messagingService: MessagingService = new MessagingServiceImpl();
