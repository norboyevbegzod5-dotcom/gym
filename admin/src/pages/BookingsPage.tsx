import { useState, useEffect } from 'react';
import { bookingsApi } from '../api';

interface Booking {
  id: string;
  status: string;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    phone: string | null;
  };
  slot: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    specialist: string | null;
    service: {
      nameRu: string;
    };
  };
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждено',
  CANCELLED_BY_USER: 'Отменено клиентом',
  CANCELLED_BY_ADMIN: 'Отменено админом',
  COMPLETED: 'Завершено',
};

const statusColors: Record<string, string> = {
  PENDING: '#ff9800',
  CONFIRMED: '#4caf50',
  CANCELLED_BY_USER: '#9e9e9e',
  CANCELLED_BY_ADMIN: '#f44336',
  COMPLETED: '#2196f3',
};

export const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : undefined;
      const response = await bookingsApi.getAll(params);
      setBookings(response.data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await bookingsApi.updateStatus(id, status);
      fetchBookings();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserName = (user: Booking['user']) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    if (user.username) return `@${user.username}`;
    return 'Неизвестный';
  };

  return (
    <div className="bookings-page">
      <div className="page-header">
        <h1 className="page-title">Записи</h1>
        <div className="header-actions">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Все статусы</option>
            <option value="PENDING">Ожидают</option>
            <option value="CONFIRMED">Подтверждённые</option>
            <option value="COMPLETED">Завершённые</option>
            <option value="CANCELLED_BY_USER">Отменённые</option>
          </select>
        </div>
      </div>

      <div className="section">
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : bookings.length === 0 ? (
          <div className="empty">Нет записей</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Услуга</th>
                  <th>Дата</th>
                  <th>Время</th>
                  <th>Специалист</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div className="user-cell">
                        <span className="user-name">{getUserName(booking.user)}</span>
                        {booking.user.phone && (
                          <span className="user-phone">{booking.user.phone}</span>
                        )}
                      </div>
                    </td>
                    <td>{booking.slot.service.nameRu}</td>
                    <td>{formatDate(booking.slot.date)}</td>
                    <td>
                      {formatTime(booking.slot.startTime)} - {formatTime(booking.slot.endTime)}
                    </td>
                    <td>{booking.slot.specialist || '—'}</td>
                    <td>
                      <span
                        className="status"
                        style={{ background: `${statusColors[booking.status]}20`, color: statusColors[booking.status] }}
                      >
                        {statusLabels[booking.status] || booking.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        {booking.status === 'PENDING' && (
                          <>
                            <button
                              className="btn-small success"
                              onClick={() => handleStatusChange(booking.id, 'CONFIRMED')}
                            >
                              Подтвердить
                            </button>
                            <button
                              className="btn-small danger"
                              onClick={() => handleStatusChange(booking.id, 'CANCELLED_BY_ADMIN')}
                            >
                              Отменить
                            </button>
                          </>
                        )}
                        {booking.status === 'CONFIRMED' && (
                          <button
                            className="btn-small primary"
                            onClick={() => handleStatusChange(booking.id, 'COMPLETED')}
                          >
                            Завершить
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .bookings-page {
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

  .section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .loading, .empty {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    font-size: 12px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
  }

  .user-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .user-name {
    font-weight: 500;
  }

  .user-phone {
    font-size: 12px;
    color: #666;
  }

  .status {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .btn-small {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
  }

  .btn-small.success {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .btn-small.danger {
    background: #ffebee;
    color: #c62828;
  }

  .btn-small.primary {
    background: #e3f2fd;
    color: #1565c0;
  }
`;
