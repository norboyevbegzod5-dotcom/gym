import { useEffect, useState } from 'react';
import { useTranslation } from '@/shared/lib/i18n';
import { bookingsApi } from '@/shared/lib/api';

interface Booking {
  id: string;
  status: string;
  comment: string | null;
  createdAt: string;
  slot: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    trainer: string | null;
    service: {
      id: string;
      name: string;
      price: number;
    };
  };
}

export const BookingsPage = () => {
  const { t, i18n } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingsApi.getMy();
      setBookings(response.data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelClick = (bookingId: string) => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    setShowConfirm(bookingId);
  };

  const handleCancelConfirm = async (bookingId: string) => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    setCancellingId(bookingId);
    setShowConfirm(null);

    try {
      await bookingsApi.cancel(bookingId);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#4caf50';
      case 'PENDING':
        return '#ff9800';
      case 'CANCELLED_BY_USER':
      case 'CANCELLED_BY_ADMIN':
        return '#f44336';
      case 'COMPLETED':
        return '#9e9e9e';
      default:
        return '#999';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#e8f5e9';
      case 'PENDING':
        return '#fff3e0';
      case 'READY':
        return '#e3f2fd';
      default:
        return 'transparent';
    }
  };

  const isUpcoming = (booking: Booking) => {
    const bookingDate = new Date(booking.slot.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today && 
           !['CANCELLED_BY_USER', 'CANCELLED_BY_ADMIN', 'COMPLETED'].includes(booking.status);
  };

  const upcomingBookings = bookings.filter(isUpcoming);
  const pastBookings = bookings.filter(b => !isUpcoming(b));

  if (loading) {
    return (
      <div className="bookings-page">
        <h1 className="page-title">{t('bookings.title')}</h1>
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
      <div className="bookings-page">
        <h1 className="page-title">{t('bookings.title')}</h1>
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchBookings}>
            {t('common.retry')}
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <h1 className="page-title">{t('bookings.title')}</h1>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <p>{t('bookings.empty')}</p>
        </div>
      ) : (
        <>
          {/* Upcoming bookings */}
          {upcomingBookings.length > 0 && (
            <div className="bookings-section">
              <h2 className="section-title">{t('bookings.upcoming')}</h2>
              <div className="bookings-list">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="booking-card">
                    {booking.status === 'CONFIRMED' && (
                      <div className="status-banner confirmed">
                        {t('bookings.status.CONFIRMED')}
                      </div>
                    )}
                    <div className="booking-header">
                      <h3 className="booking-service">{booking.slot.service.name}</h3>
                      <span 
                        className="booking-status"
                        style={{ 
                          color: getStatusColor(booking.status),
                          background: getStatusBg(booking.status),
                        }}
                      >
                        {t(`bookings.status.${booking.status}`)}
                      </span>
                    </div>
                    <div className="booking-details">
                      <div className="booking-datetime">
                        <span className="booking-date">{formatDate(booking.slot.date)}</span>
                        <span className="booking-time">
                          {formatTime(booking.slot.startTime)} - {formatTime(booking.slot.endTime)}
                        </span>
                      </div>
                      {booking.slot.trainer && (
                        <div className="booking-trainer">
                          {t('booking.specialist')}: {booking.slot.trainer}
                        </div>
                      )}
                    </div>
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelClick(booking.id)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id 
                        ? t('common.loading') 
                        : t('bookings.cancelBooking')
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past bookings */}
          {pastBookings.length > 0 && (
            <div className="bookings-section">
              <h2 className="section-title">{t('bookings.past')}</h2>
              <div className="bookings-list past">
                {pastBookings.map((booking) => (
                  <div key={booking.id} className="booking-card past">
                    <div className="booking-header">
                      <h3 className="booking-service">{booking.slot.service.name}</h3>
                      <span 
                        className="booking-status"
                        style={{ color: getStatusColor(booking.status) }}
                      >
                        {t(`bookings.status.${booking.status}`)}
                      </span>
                    </div>
                    <div className="booking-details">
                      <div className="booking-datetime">
                        <span className="booking-date">{formatDate(booking.slot.date)}</span>
                        <span className="booking-time">
                          {formatTime(booking.slot.startTime)} - {formatTime(booking.slot.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-text">{t('bookings.confirmCancel')}</p>
            <div className="modal-buttons">
              <button 
                className="modal-btn secondary"
                onClick={() => setShowConfirm(null)}
              >
                {t('common.back')}
              </button>
              <button 
                className="modal-btn danger"
                onClick={() => handleCancelConfirm(showConfirm)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .bookings-page {
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

  .bookings-section {
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

  .bookings-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .booking-card {
    padding: 16px;
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 12px;
  }

  .booking-card.past {
    opacity: 0.7;
  }

  .booking-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .booking-service {
    font-size: 16px;
    font-weight: 600;
    color: var(--tg-theme-text-color, #000);
    margin: 0;
  }

  .booking-status {
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 6px;
  }

  .status-banner {
    padding: 10px 16px;
    margin: -16px -16px 12px -16px;
    border-radius: 12px 12px 0 0;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
  }

  .status-banner.confirmed {
    background: #4caf50;
    color: #fff;
  }

  .status-banner.ready {
    background: #2196f3;
    color: #fff;
  }

  .booking-details {
    margin-bottom: 12px;
  }

  .booking-datetime {
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
  }

  .booking-date {
    font-size: 14px;
    color: var(--tg-theme-text-color, #000);
  }

  .booking-time {
    font-size: 14px;
    color: var(--tg-theme-hint-color, #999);
  }

  .booking-trainer {
    font-size: 13px;
    color: var(--tg-theme-hint-color, #999);
  }

  .cancel-btn {
    width: 100%;
    padding: 10px;
    background: transparent;
    color: #f44336;
    border: 1px solid #f44336;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
  }

  .cancel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 1000;
  }

  .modal {
    background: var(--tg-theme-bg-color, #fff);
    border-radius: 16px;
    padding: 24px;
    max-width: 300px;
    width: 100%;
  }

  .modal-text {
    font-size: 16px;
    color: var(--tg-theme-text-color, #000);
    margin: 0 0 20px 0;
    text-align: center;
  }

  .modal-buttons {
    display: flex;
    gap: 12px;
  }

  .modal-btn {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .modal-btn.secondary {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    color: var(--tg-theme-text-color, #000);
  }

  .modal-btn.danger {
    background: #f44336;
    color: #fff;
  }
`;
