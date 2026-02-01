import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ServicesPage } from './pages/ServicesPage';
import { SlotsPage } from './pages/SlotsPage';
import { BookingsPage } from './pages/BookingsPage';
import { OrdersPage } from './pages/OrdersPage';
import { BarItemsPage } from './pages/BarItemsPage';
import { ClientsPage } from './pages/ClientsPage';
import { MembershipPlansPage } from './pages/MembershipPlansPage';
import { UserMembershipsPage } from './pages/UserMembershipsPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminLayout } from './components/AdminLayout';
import { authApi } from './api';

export const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('admin_token');
    if (token) {
      authApi.verify()
        .then(() => setIsAuthenticated(true))
        .catch(() => {
          localStorage.removeItem('admin_token');
          setIsAuthenticated(false);
        });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('admin_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}>
        Загрузка...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated 
              ? <Navigate to="/" replace /> 
              : <LoginPage onLogin={handleLogin} />
          } 
        />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <AdminLayout onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/clients" element={<ClientsPage />} />
                  <Route path="/membership-plans" element={<MembershipPlansPage />} />
                  <Route path="/memberships" element={<UserMembershipsPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/bar-items" element={<BarItemsPage />} />
                  <Route path="/slots" element={<SlotsPage />} />
                  <Route path="/bookings" element={<BookingsPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/feedbacks" element={<FeedbackPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </AdminLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
