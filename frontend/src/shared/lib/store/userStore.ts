import { create } from 'zustand';

export interface TelegramUser {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  phone?: string;
}

interface UserState {
  user: TelegramUser | null;
  language: string;
  isLoading: boolean;
  
  setUser: (user: TelegramUser) => void;
  setLanguage: (lang: string) => void;
  setLoading: (loading: boolean) => void;
  updatePhone: (phone: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  language: 'ru',
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),
  
  setLanguage: (language) => set({ language }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  updatePhone: (phone) =>
    set((state) => ({
      user: state.user ? { ...state.user, phone } : null,
    })),
}));
