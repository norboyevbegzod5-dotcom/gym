import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

import '@/shared/lib/i18n';
import { useUserStore } from '@/shared/lib/store/userStore';
import { MainLayout } from '@/shared/ui/layouts/MainLayout';

// Pages
import { HomePage } from '@/features/home/HomePage';
import { ServicesPage } from '@/features/services/ServicesPage';
import { ServiceDetailPage } from '@/features/services/ServiceDetailPage';
import { BookingsPage } from '@/features/bookings/BookingsPage';
import { BarPage } from '@/features/bar/BarPage';
import { MyOrdersPage } from '@/features/bar/MyOrdersPage';
import { ProfilePage } from '@/features/profile/ProfilePage';

export const App = () => {
  const setUser = useUserStore((state) => state.setUser);
  const setLanguage = useUserStore((state) => state.setLanguage);

  useEffect(() => {
    // Инициализация Telegram WebApp
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      // Сообщаем Telegram, что приложение готово
      tg.ready();
      
      // Разворачиваем на весь экран
      tg.expand();
      
      // Получаем данные пользователя
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUser({
          telegramId: String(user.id),
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          languageCode: user.language_code,
        });
        
        // Устанавливаем язык
        if (user.language_code) {
          setLanguage(user.language_code);
        }
      }
    }
  }, [setUser, setLanguage]);

  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:categoryId" element={<ServicesPage />} />
          <Route path="/service/:serviceId" element={<ServiceDetailPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bar" element={<BarPage />} />
          <Route path="/bar/orders" element={<MyOrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};
