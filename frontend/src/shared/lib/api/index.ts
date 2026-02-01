import axios from 'axios';
import i18n from '../i18n';
import { useUserStore, APP_TOKEN_KEY } from '../store/userStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем Bearer токен и язык к запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(APP_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Accept-Language'] = i18n.language;
  return config;
});

// При 401 очищаем токен, сбрасываем user и редиректим на /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(APP_TOKEN_KEY);
      useUserStore.getState().setUser(null);
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Типизированные методы API
export const servicesApi = {
  getCategories: (lang?: string) => 
    api.get('/services/categories', { params: { lang } }),
  
  getByCategory: (slug: string, lang?: string) => 
    api.get(`/services/category/${slug}`, { params: { lang } }),
  
  getSlots: (serviceId: string, date: string) => 
    api.get(`/services/${serviceId}/slots`, { params: { date } }),
};

export const bookingsApi = {
  create: (slotId: string, comment?: string) => 
    api.post('/bookings', { slotId, comment }),
  
  getMy: () => api.get('/bookings'),
  
  cancel: (id: string) => api.delete(`/bookings/${id}`),
};

export const barApi = {
  getMenu: (lang?: string) => 
    api.get('/bar/menu', { params: { lang } }),
  
  createOrder: (items: Array<{ itemId: string; quantity: number }>) => 
    api.post('/bar/orders', { items }),
  
  getMyOrders: () => api.get('/bar/orders'),
};

export const authApi = {
  loginByPhone: (phone: string) =>
    api.post<{ token: string; user: { id: string; phone: string | null; firstName: string | null; lastName: string | null; username: string | null; language: string } }>('/auth/phone', { phone }),
};

export const usersApi = {
  getMe: () => api.get('/users/me'),
  
  updateLanguage: (language: string) => 
    api.patch('/users/language', { language }),
};

export const membershipsApi = {
  getPlans: (lang?: string) =>
    api.get('/memberships/plans', { params: { lang } }),
  
  getMy: () => api.get('/memberships/my'),
  
  purchase: (planId: string, paymentType?: string) =>
    api.post('/memberships/purchase', { planId, paymentType: paymentType || 'OFFLINE' }),
  
  freeze: () => api.post('/memberships/my/freeze'),
  
  unfreeze: () => api.post('/memberships/my/unfreeze'),
  
  checkService: (serviceId: string) =>
    api.get('/memberships/check-service', { params: { serviceId } }),
};
