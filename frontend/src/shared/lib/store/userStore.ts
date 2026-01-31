import { create } from 'zustand';

export const APP_TOKEN_KEY = 'app_token';

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

  setUser: (user: TelegramUser | null) => void;
  setLanguage: (lang: string) => void;
  setLoading: (loading: boolean) => void;
  updatePhone: (phone: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
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

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(APP_TOKEN_KEY);
    }
    set({ user: null });
  },
}));
