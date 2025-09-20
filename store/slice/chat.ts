import { StateCreator } from 'zustand';

interface Message {
  id: string;
  text: string;
  timestamp: number;
}

interface Chat {
  id: string;
  name: string;
  messages: Message[];
}

export interface ChatSlice {
  chats: Chat[];
  addChat: (chat: Chat) => void;
  addMessage: (chatId: string, message: Message) => void;
  getChatById: (chatId: string) => Chat | undefined;
}

export const createChatSlice: StateCreator<any, [], [], ChatSlice> = (set, get) => ({
  chats: [],

  addChat: (chat) =>
    set((state : any) => ({ chats: [...state.chats, chat] })),

  addMessage: (chatId, message) =>
    set((state : any) => ({
      chats: state.chats.map((c : Chat) =>
        c.id === chatId ? { ...c, messages: [...c.messages, message] } : c
      ),
    })),

  getChatById: (chatId) => get().chats.find((c : Chat) => c.id === chatId),
});
