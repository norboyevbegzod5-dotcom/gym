import axios from 'axios';
import i18n from '../i18n';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления Telegram init data и языка
api.interceptors.request.use((config) => {
  const tg = window.Telegram?.WebApp;
  
  // Добавляем Telegram init data для авторизации
  if (tg?.initData) {
    config.headers['X-Telegram-Init-Data'] = tg.initData;
  }
  
  // Добавляем текущий язык
  config.headers['Accept-Language'] = i18n.language;
  
  return config;
});

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Можно добавить обработку 401, показ ошибок и т.д.
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

export const usersApi = {
  getMe: () => api.get('/users/me'),
  
  updateLanguage: (language: string) => 
    api.patch('/users/language', { language }),
};

export const membershipsApi = {
  getPlans: (lang?: string) =>
    api.get('/memberships/plans', { params: { lang } }),
  
  getMy: () => api.get('/memberships/my'),
  
  freeze: () => api.post('/memberships/my/freeze'),
  
  unfreeze: () => api.post('/memberships/my/unfreeze'),
  
  checkService: (serviceId: string) =>
    api.get('/memberships/check-service', { params: { serviceId } }),
};
