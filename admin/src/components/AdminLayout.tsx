import { ReactNode, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { statsApi } from '../api';

interface AdminLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export const AdminLayout = ({ children, onLogout }: AdminLayoutProps) => {
  const [pendingBookings, setPendingBookings] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  const fetchCounts = async () => {
    try {
      const response = await statsApi.getPendingCounts();
      setPendingBookings(response.data.pendingBookings);
      setPendingOrders(response.data.pendingOrders);
    } catch (err) {
      console.error('Failed to fetch counts:', err);
    }
  };

  useEffect(() => {
    fetchCounts();
    // Обновляем счётчики каждые 30 секунд
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/', label: 'Дашборд', icon: '📊', badge: 0 },
    { path: '/clients', label: 'Клиенты', icon: '👥', badge: 0 },
    { path: '/membership-plans', label: 'Тарифы', icon: '💳', badge: 0 },
    { path: '/memberships', label: 'Абонементы', icon: '🎟️', badge: 0 },
    { path: '/services', label: 'Услуги', icon: '🏋️', badge: 0 },
    { path: '/bar-items', label: 'Товары бара', icon: '☕', badge: 0 },
    { path: '/slots', label: 'Расписание', icon: '📅', badge: 0 },
    { path: '/bookings', label: 'Записи', icon: '📝', badge: pendingBookings },
    { path: '/orders', label: 'Заказы бара', icon: '🍹', badge: pendingOrders },
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>CentrisFit</h1>
          <span>Admin Panel</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      <style>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 240px;
          background: #1a1a2e;
          color: #fff;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
        }

        .sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-header h1 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .sidebar-header span {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
          margin-bottom: 4px;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .nav-item.active {
          background: #3390ec;
          color: #fff;
        }

        .nav-icon {
          font-size: 18px;
        }

        .nav-label {
          font-size: 14px;
          font-weight: 500;
          flex: 1;
        }

        .nav-badge {
          background: #f44336;
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logout-btn {
          width: 100%;
          padding: 10px;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .main-content {
          flex: 1;
          margin-left: 240px;
          padding: 32px;
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
};
