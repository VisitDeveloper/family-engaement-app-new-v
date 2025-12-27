import {
  ConversationResponseDto,
  MessageResponseDto,
} from "@/services/messaging.service";
import { StateCreator } from "zustand";

export interface ChatSlice {
  conversations: ConversationResponseDto[];
  messages: Record<string, MessageResponseDto[]>; // conversationId -> messages
  loading: boolean;
  error: string | null;

  // Actions
  setConversations: (conversations: ConversationResponseDto[]) => void;
  addConversation: (conversation: ConversationResponseDto) => void;
  updateConversation: (
    id: string,
    conversation: Partial<ConversationResponseDto>
  ) => void;
  removeConversation: (id: string) => void;

  setMessages: (conversationId: string, messages: MessageResponseDto[]) => void;
  addMessage: (conversationId: string, message: MessageResponseDto) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    message: Partial<MessageResponseDto>
  ) => void;
  removeMessage: (conversationId: string, messageId: string) => void;

  getConversationById: (id: string) => ConversationResponseDto | undefined;
  getMessagesByConversationId: (conversationId: string) => MessageResponseDto[];

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const createChatSlice: StateCreator<any, [], [], ChatSlice> = (
  set,
  get
) => ({
  conversations: [],
  messages: {},
  loading: false,
  error: null,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state: any) => ({
      conversations: [...state.conversations, conversation],
    })),

  updateConversation: (id, updates) =>
    set((state: any) => ({
      conversations: state.conversations.map((c: ConversationResponseDto) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeConversation: (id) =>
    set((state: any) => ({
      conversations: state.conversations.filter(
        (c: ConversationResponseDto) => c.id !== id
      ),
      messages: Object.fromEntries(
        Object.entries(state.messages).filter(([key]) => key !== id)
      ),
    })),

  setMessages: (conversationId, messages) =>
    set((state: any) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  addMessage: (conversationId, message) =>
    set((state: any) => ({
      messages: {
        ...state.messages,
        [conversationId]: [message, ...(state.messages[conversationId] || [])],
      },
      conversations: state.conversations.map((c: ConversationResponseDto) =>
        c.id === conversationId
          ? { ...c, lastMessage: message, updatedAt: message.createdAt }
          : c
      ),
    })),

  updateMessage: (conversationId, messageId, updates) =>
    set((state: any) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map(
          (m: MessageResponseDto) =>
            m.id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),

  removeMessage: (conversationId, messageId) =>
    set((state: any) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (m: MessageResponseDto) => m.id !== messageId
        ),
      },
    })),

  getConversationById: (id) =>
    (get().conversations || []).find(
      (c: ConversationResponseDto) => c.id === id
    ),

  getMessagesByConversationId: (conversationId) =>
    get().messages[conversationId] || [],

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
});
