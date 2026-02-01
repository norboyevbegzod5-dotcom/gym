import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

import '@/shared/lib/i18n';
import { useUserStore, APP_TOKEN_KEY } from '@/shared/lib/store/userStore';
import { usersApi } from '@/shared/lib/api';
import { MainLayout } from '@/shared/ui/layouts/MainLayout';

// Pages
import { HomePage } from '@/features/home/HomePage';
import { ServicesPage } from '@/features/services/ServicesPage';
import { ServiceDetailPage } from '@/features/services/ServiceDetailPage';
import { BookingsPage } from '@/features/bookings/BookingsPage';
import { BarPage } from '@/features/bar/BarPage';
import { MyOrdersPage } from '@/features/bar/MyOrdersPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { MembershipPlanDetailPage } from '@/features/membership/MembershipPlanDetailPage';
import { LoginPage } from '@/features/auth/LoginPage';

function mapMeToUser(me: { id: string; phone: string | null; firstName: string | null; lastName: string | null; username: string | null; language: string }) {
  return {
    telegramId: me.id,
    firstName: me.firstName ?? undefined,
    lastName: me.lastName ?? undefined,
    username: me.username ?? undefined,
    phone: me.phone ?? undefined,
    languageCode: me.language,
  };
}

export const App = () => {
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const setUser = useUserStore((state) => state.setUser);
  const setLanguage = useUserStore((state) => state.setLanguage);
  const setLoading = useUserStore((state) => state.setLoading);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem(APP_TOKEN_KEY) : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    usersApi
      .getMe()
      .then((res) => {
        setUser(mapMeToUser(res.data));
        if (res.data.language) setLanguage(res.data.language);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setUser, setLanguage, setLoading]);

  const loadingEl = (
    <div className="app-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-secondary)' }}>
      Загрузка...
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isLoading ? loadingEl : user ? <Navigate to="/" replace /> : <LoginPage />
        } />
        <Route path="*" element={
          isLoading ? loadingEl : !user ? <LoginPage /> : (
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/:categoryId" element={<ServicesPage />} />
                <Route path="/service/:serviceId" element={<ServiceDetailPage />} />
                <Route path="/membership/plan/:planId" element={<MembershipPlanDetailPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/bar" element={<BarPage />} />
                <Route path="/bar/orders" element={<MyOrdersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </MainLayout>
          )
        } />
      </Routes>
    </BrowserRouter>
  );
};
