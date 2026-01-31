import { useEffect, useState } from 'react';
import { useTranslation } from '@/shared/lib/i18n';
import { barApi } from '@/shared/lib/api';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  item: {
    id: string;
    nameRu: string;
    nameUz?: string;
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export const MyOrdersPage = () => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await barApi.getMyOrders();
      setOrders(response.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds to catch status updates
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU').format(price) + ' UZS';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#ff9800';
      case 'PREPARING':
        return '#2196f3';
      case 'READY':
        return '#4caf50';
      case 'COMPLETED':
        return '#9e9e9e';
      case 'CANCELLED':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const isActiveOrder = (order: Order) => {
    return ['PENDING', 'PREPARING', 'READY'].includes(order.status);
  };

  const activeOrders = orders.filter(isActiveOrder);
  const pastOrders = orders.filter(o => !isActiveOrder(o));

  if (loading) {
    return (
      <div className="orders-page">
        <h1 className="page-title">{t('bar.myOrders')}</h1>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <h1 className="page-title">{t('bar.myOrders')}</h1>
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchOrders}>
            {t('common.retry')}
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1 className="page-title">{t('bar.myOrders')}</h1>

      {orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🍹</span>
          <p>{t('bar.noOrders')}</p>
        </div>
      ) : (
        <>
          {/* Active orders */}
          {activeOrders.length > 0 && (
            <div className="orders-section">
              <div className="orders-list">
                {activeOrders.map((order) => (
                  <div key={order.id} className="order-card">
                    {order.status === 'READY' && (
                      <div className="status-banner ready">
                        {t('bar.status.READY')}
                      </div>
                    )}
                    <div className="order-header">
                      <span className="order-time">{formatTime(order.createdAt)}</span>
                      <span 
                        className="order-status"
                        style={{ 
                          color: getStatusColor(order.status),
                          background: order.status === 'READY' ? '#e8f5e9' : 
                                      order.status === 'PREPARING' ? '#e3f2fd' : '#fff3e0',
                        }}
                      >
                        {t(`bar.status.${order.status}`)}
                      </span>
                    </div>
                    <div className="order-items">
                      {order.items.map((item) => (
                        <div key={item.id} className="order-item">
                          <span className="item-qty">{item.quantity}x</span>
                          <span className="item-name">
                            {i18n.language === 'uz' && item.item.nameUz 
                              ? item.item.nameUz 
                              : item.item.nameRu}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="order-total">
                      {t('bar.total')}: <strong>{formatPrice(order.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past orders */}
          {pastOrders.length > 0 && (
            <div className="orders-section">
              <h2 className="section-title">{t('bookings.past')}</h2>
              <div className="orders-list past">
                {pastOrders.map((order) => (
                  <div key={order.id} className="order-card past">
                    <div className="order-header">
                      <span className="order-time">{formatTime(order.createdAt)}</span>
                      <span 
                        className="order-status"
                        style={{ color: getStatusColor(order.status) }}
                      >
                        {t(`bar.status.${order.status}`)}
                      </span>
                    </div>
                    <div className="order-items">
                      {order.items.map((item) => (
                        <div key={item.id} className="order-item">
                          <span className="item-qty">{item.quantity}x</span>
                          <span className="item-name">
                            {i18n.language === 'uz' && item.item.nameUz 
                              ? item.item.nameUz 
                              : item.item.nameRu}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="order-total">
                      {t('bar.total')}: <strong>{formatPrice(order.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .orders-page {
    padding-bottom: 20px;
  }

  .page-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
    color: var(--tg-theme-text-color, #000);
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: var(--tg-theme-hint-color, #999);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--tg-theme-secondary-bg-color, #f0f0f0);
    border-top-color: var(--tg-theme-button-color, #3390ec);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 12px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .retry-btn {
    margin-top: 16px;
    padding: 10px 24px;
    background: var(--tg-theme-button-color, #3390ec);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
  }

  .orders-section {
    margin-bottom: 24px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--tg-theme-hint-color, #999);
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .order-card {
    padding: 16px;
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 12px;
    overflow: hidden;
  }

  .order-card.past {
    opacity: 0.7;
  }

  .status-banner {
    padding: 12px 16px;
    margin: -16px -16px 12px -16px;
    font-size: 15px;
    font-weight: 600;
    text-align: center;
    animation: pulse 2s infinite;
  }

  .status-banner.ready {
    background: #4caf50;
    color: #fff;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .order-time {
    font-size: 13px;
    color: var(--tg-theme-hint-color, #999);
  }

  .order-status {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
  }

  .order-items {
    margin-bottom: 12px;
  }

  .order-item {
    display: flex;
    gap: 8px;
    padding: 4px 0;
    font-size: 14px;
    color: var(--tg-theme-text-color, #000);
  }

  .item-qty {
    font-weight: 600;
    color: var(--tg-theme-button-color, #3390ec);
    min-width: 24px;
  }

  .order-total {
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 15px;
    color: var(--tg-theme-text-color, #000);
  }

  .order-total strong {
    color: var(--tg-theme-button-color, #3390ec);
  }
`;
