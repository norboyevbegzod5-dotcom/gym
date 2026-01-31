import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { barApi } from '@/shared/lib/api';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [readyOrdersCount, setReadyOrdersCount] = useState(0);

  useEffect(() => {
    const fetchReadyOrders = async () => {
      try {
        const response = await barApi.getMyOrders();
        const readyCount = response.data.filter(
          (order: { status: string }) => order.status === 'READY'
        ).length;
        setReadyOrdersCount(readyCount);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }
    };

    fetchReadyOrders();
    const interval = setInterval(fetchReadyOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/', label: t('main.menu.services'), icon: '🏋️', badge: 0 },
    { path: '/bookings', label: t('main.menu.myBookings'), icon: '📅', badge: 0 },
    { path: '/bar', label: t('main.menu.bar'), icon: '🍹', badge: readyOrdersCount },
    { path: '/profile', label: t('main.menu.profile'), icon: '👤', badge: 0 },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="main-layout">
      <main className="main-content">
        {children}
      </main>

      <nav className="bottom-nav">
        <div className="nav-bg" />
        {navItems.map((item, index) => (
          <button
            key={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => {
              window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
              navigate(item.path);
            }}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="nav-icon-container">
              <span className="nav-icon">{item.icon}</span>
              {item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
              {isActive(item.path) && <div className="nav-glow" />}
            </div>
            <span className="nav-label">{item.label}</span>
            {isActive(item.path) && <div className="nav-indicator" />}
          </button>
        ))}
      </nav>

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .main-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--bg-dark);
  }
  
  .main-content {
    flex: 1;
    padding: 20px;
    padding-bottom: 100px;
    animation: fade-in 0.3s ease-out;
  }
  
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 12px 8px;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    z-index: 100;
  }

  .nav-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(13, 13, 13, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 77, 0, 0.2);
  }
  
  .nav-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    padding: 8px 16px;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
    animation: slide-up 0.4s ease-out backwards;
  }
  
  .nav-item:active {
    transform: scale(0.9);
  }
  
  .nav-item.active {
    color: var(--primary);
  }

  .nav-icon-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    transition: all 0.3s;
  }

  .nav-item.active .nav-icon-container {
    background: rgba(255, 77, 0, 0.15);
  }

  .nav-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, rgba(255, 77, 0, 0.4) 0%, transparent 70%);
    pointer-events: none;
    animation: pulse-glow 2s infinite;
  }
  
  .nav-icon {
    font-size: 24px;
    transition: transform 0.3s;
    position: relative;
    z-index: 1;
  }

  .nav-item.active .nav-icon {
    transform: scale(1.1);
  }
  
  .nav-badge {
    position: absolute;
    top: 0;
    right: 0;
    min-width: 20px;
    height: 20px;
    background: var(--gradient-fire);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    animation: bounce-in 0.5s ease-out;
    box-shadow: 0 0 10px rgba(255, 77, 0, 0.5);
    z-index: 2;
  }
  
  .nav-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color 0.3s;
  }

  .nav-indicator {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 3px;
    background: var(--gradient-fire);
    border-radius: 2px;
    animation: slide-up 0.3s ease-out;
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
  }
`;
