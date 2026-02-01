import axios from 'axios';

// Прокси Vite: /api -> localhost:3002. Или в .env: VITE_API_URL=http://localhost:3002/api
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const API_URL = `${API_BASE}/admin`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify'),
};

export const statsApi = {
  getDashboard: () => api.get('/stats/dashboard'),
  getPendingCounts: () => api.get('/stats/pending'),
};

export const servicesApi = {
  getCategories: () => api.get('/categories'),
  createCategory: (data: { slug: string; nameRu: string; nameUz?: string; icon?: string }) =>
    api.post('/categories', data),
  updateCategory: (id: string, data: Partial<{ nameRu: string; nameUz?: string; icon?: string; isActive: boolean }>) =>
    api.patch(`/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/categories/${id}`),
  
  getServices: () => api.get('/services'),
  createService: (data: {
    categoryId: string;
    nameRu: string;
    nameUz?: string;
    descriptionRu?: string;
    price: number;
    duration?: number;
    capacity?: number;
  }) => api.post('/services', data),
  updateService: (id: string, data: Partial<{
    nameRu: string;
    nameUz?: string;
    descriptionRu?: string;
    price: number;
    duration?: number;
    capacity?: number;
    isActive: boolean;
  }>) => api.patch(`/services/${id}`, data),
  deleteService: (id: string) => api.delete(`/services/${id}`),
};

export const slotsApi = {
  getSlots: (params?: { date?: string; serviceId?: string }) =>
    api.get('/slots', { params }),
  createSlot: (data: {
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
    specialist?: string;
    capacity?: number;
  }) => api.post('/slots', data),
  createBulkSlots: (data: {
    serviceId: string;
    dates: string[];
    timeSlots: { startTime: string; endTime: string }[];
    specialist?: string;
    capacity?: number;
  }) => api.post('/slots/bulk', data),
  updateSlot: (id: string, data: Partial<{
    specialist?: string;
    capacity?: number;
    status: string;
  }>) => api.patch(`/slots/${id}`, data),
  deleteSlot: (id: string) => api.delete(`/slots/${id}`),
};

export const bookingsApi = {
  getAll: (params?: { status?: string; date?: string }) =>
    api.get('/bookings', { params }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/bookings/${id}/status`, { status }),
};

export const feedbacksApi = {
  getAll: () => api.get('/feedbacks'),
};

export type TelegramChatSettings = {
  bookingsChatId: string | null;
  barOrdersChatId: string | null;
  feedbackChatId: string | null;
};

export const settingsApi = {
  getTelegramChats: () => api.get<TelegramChatSettings>('/settings/telegram-chats'),
  updateTelegramChats: (data: Partial<TelegramChatSettings>) =>
    api.patch<TelegramChatSettings>('/settings/telegram-chats', data),
};

export const ordersApi = {
  getAll: (params?: { status?: string }) =>
    api.get('/orders', { params }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
};

export const barCategoriesApi = {
  getAll: () => api.get('/bar-categories'),
  create: (data: { slug: string; nameRu: string; nameUz?: string; icon?: string }) =>
    api.post('/bar-categories', data),
  update: (id: string, data: Partial<{ nameRu: string; nameUz: string; icon: string; isActive: boolean }>) =>
    api.patch(`/bar-categories/${id}`, data),
  delete: (id: string) => api.delete(`/bar-categories/${id}`),
};

export const clientsApi = {
  getAll: (search?: string) => api.get('/clients', { params: { search } }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: { firstName: string; lastName?: string; phone?: string }) =>
    api.post('/clients', data),
  mergeDuplicates: () =>
    api.post<{ merged: number; mergedPhones: string[] }>('/clients/merge-duplicates'),
};

export const broadcastApi = {
  send: (message: string, userIds?: string[]) =>
    api.post('/broadcast', { message, userIds }),
};

export const membershipPlansApi = {
  getAll: () => api.get('/membership-plans'),
  create: (data: {
    nameRu: string;
    nameUz?: string;
    type: string;
    durationDays: number;
    totalVisits?: number;
    maxFreezeDays?: number;
    price: number;
    serviceIds?: string[];
  }) => api.post('/membership-plans', data),
  update: (id: string, data: Partial<{
    nameRu: string;
    nameUz: string;
    type: string;
    durationDays: number;
    totalVisits: number;
    maxFreezeDays: number;
    price: number;
    isActive: boolean;
    serviceIds: string[];
  }>) => api.patch(`/membership-plans/${id}`, data),
  delete: (id: string) => api.delete(`/membership-plans/${id}`),
};

export const userMembershipsApi = {
  getAll: (status?: string) => api.get('/user-memberships', { params: { status } }),
  assign: (data: { userId: string; planId: string; paymentType?: string }) =>
    api.post('/user-memberships', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/user-memberships/${id}/status`, { status }),
  freeze: (id: string) => api.post(`/user-memberships/${id}/freeze`),
  unfreeze: (id: string) => api.post(`/user-memberships/${id}/unfreeze`),
};

export const barItemsApi = {
  getAll: () => api.get('/bar-items'),
  create: (data: {
    categoryId: string;
    nameRu: string;
    nameUz?: string;
    descriptionRu?: string;
    descriptionUz?: string;
    price: number;
    imageUrl?: string;
    volume?: string;
    calories?: number;
    proteins?: number;
    fats?: number;
    carbs?: number;
  }) => api.post('/bar-items', data),
  update: (id: string, data: Partial<{
    categoryId: string;
    nameRu: string;
    nameUz: string;
    descriptionRu: string;
    descriptionUz: string;
    price: number;
    imageUrl: string;
    volume: string;
    calories: number;
    proteins: number;
    fats: number;
    carbs: number;
    isAvailable: boolean;
  }>) => api.patch(`/bar-items/${id}`, data),
  delete: (id: string) => api.delete(`/bar-items/${id}`),
};
