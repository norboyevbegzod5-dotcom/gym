import { useState, useEffect } from 'react';
import { ordersApi } from '../api';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  item: {
    nameRu: string;
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    phone: string | null;
  };
  items: OrderItem[];
}

const statusLabels: Record<string, string> = {
  PENDING: 'Новый',
  PREPARING: 'Готовится',
  READY: 'Готов',
  COMPLETED: 'Выдан',
  CANCELLED: 'Отменён',
};

const statusColors: Record<string, string> = {
  PENDING: '#ff9800',
  PREPARING: '#2196f3',
  READY: '#4caf50',
  COMPLETED: '#9e9e9e',
  CANCELLED: '#f44336',
};

export const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : undefined;
      const response = await ordersApi.getAll(params);
      setOrders(response.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await ordersApi.updateStatus(id, status);
      fetchOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' UZS';
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserName = (user: Order['user']) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    if (user.username) return `@${user.username}`;
    return 'Неизвестный';
  };

  const getNextStatus = (current: string): string | null => {
    switch (current) {
      case 'PENDING': return 'PREPARING';
      case 'PREPARING': return 'READY';
      case 'READY': return 'COMPLETED';
      default: return null;
    }
  };

  const getNextStatusLabel = (current: string): string | null => {
    const next = getNextStatus(current);
    return next ? statusLabels[next] : null;
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1 className="page-title">Заказы бара</h1>
        <div className="header-actions">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Все статусы</option>
            <option value="PENDING">Новые</option>
            <option value="PREPARING">Готовятся</option>
            <option value="READY">Готовы</option>
            <option value="COMPLETED">Выданы</option>
          </select>
        </div>
      </div>

      <div className="orders-grid">
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : orders.length === 0 ? (
          <div className="empty">Нет заказов</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-id">#{order.id.slice(-6)}</span>
                <span
                  className="status"
                  style={{
                    background: `${statusColors[order.status]}20`,
                    color: statusColors[order.status],
                  }}
                >
                  {statusLabels[order.status]}
                </span>
              </div>

              <div className="order-customer">
                <div className="customer-info">
                  <span className="customer-name">{getUserName(order.user)}</span>
                  {order.user.phone && (
                    <a href={`tel:${order.user.phone}`} className="customer-phone">📱 {order.user.phone}</a>
                  )}
                </div>
                <span className="order-time">{formatTime(order.createdAt)}</span>
              </div>

              <div className="order-items">
                {order.items.map((item) => (
                  <div key={item.id} className="order-item">
                    <span className="item-qty">{item.quantity}x</span>
                    <span className="item-name">{item.item.nameRu}</span>
                    <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <span className="order-total">{formatPrice(order.total)}</span>
                <div className="order-actions">
                  {getNextStatus(order.status) && (
                    <button
                      className="btn-action"
                      onClick={() => handleStatusChange(order.id, getNextStatus(order.status)!)}
                    >
                      → {getNextStatusLabel(order.status)}
                    </button>
                  )}
                  {order.status === 'PENDING' && (
                    <button
                      className="btn-action danger"
                      onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                    >
                      Отменить
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .orders-page {
    max-width: 1400px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .header-actions select {
    padding: 10px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    background: #fff;
  }

  .orders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .loading, .empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px;
    color: #666;
    background: #fff;
    border-radius: 12px;
  }

  .order-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .order-id {
    font-weight: 700;
    font-size: 16px;
    color: #1a1a2e;
  }

  .status {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .order-customer {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }

  .customer-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .customer-name {
    font-weight: 500;
  }

  .customer-phone {
    font-size: 13px;
    color: #3390ec;
    text-decoration: none;
  }

  .customer-phone:hover {
    text-decoration: underline;
  }

  .order-time {
    font-size: 12px;
    color: #666;
  }

  .order-items {
    margin-bottom: 16px;
  }

  .order-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
  }

  .item-qty {
    font-weight: 600;
    color: #3390ec;
    min-width: 28px;
  }

  .item-name {
    flex: 1;
  }

  .item-price {
    font-size: 13px;
    color: #666;
  }

  .order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #eee;
  }

  .order-total {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .order-actions {
    display: flex;
    gap: 8px;
  }

  .btn-action {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    background: #3390ec;
    color: #fff;
  }

  .btn-action.danger {
    background: #ffebee;
    color: #c62828;
  }
`;
