import { useEffect, useState } from 'react';
import { useTranslation } from '@/shared/lib/i18n';
import { useParams, useNavigate } from 'react-router-dom';
import { servicesApi, bookingsApi, membershipsApi } from '@/shared/lib/api';

interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  trainer: string | null;
}

export const ServiceDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCoveredByMembership, setIsCoveredByMembership] = useState(false);
  const [membershipInfo, setMembershipInfo] = useState<{ type: string; remainingVisits: number | null } | null>(null);

  // Generate next 7 days for date picker
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  // Check if service is covered by membership
  useEffect(() => {
    if (!serviceId) return;
    
    const checkMembership = async () => {
      try {
        const response = await membershipsApi.checkService(serviceId);
        setIsCoveredByMembership(response.data.isCovered);
        if (response.data.membership) {
          setMembershipInfo(response.data.membership);
        }
      } catch (err) {
        console.error('Failed to check membership:', err);
      }
    };

    checkMembership();
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId) return;

    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      setSelectedSlot(null);
      try {
        const response = await servicesApi.getSlots(serviceId, selectedDate);
        setSlots(response.data);
      } catch (err) {
        console.error('Failed to fetch slots:', err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [serviceId, selectedDate, t]);

  const handleBack = () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    navigate(-1);
  };

  const handleDateSelect = (date: string) => {
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    setSelectedDate(date);
  };

  const handleSlotSelect = (slotId: string) => {
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    setSelectedSlot(slotId === selectedSlot ? null : slotId);
  };

  const handleBooking = async () => {
    if (!selectedSlot) return;

    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    setBooking(true);
    setError(null);

    try {
      await bookingsApi.create(selectedSlot);
      setSuccess(true);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      
      // Redirect to bookings page after 1.5 seconds
      setTimeout(() => {
        navigate('/bookings');
      }, 1500);
    } catch (err: unknown) {
      console.error('Booking failed:', err);
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message 
        : t('common.error');
      setError(errorMessage || t('common.error'));
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return t('booking.today');
    }
    if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return t('booking.tomorrow');
    }

    return date.toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // "09:00:00" -> "09:00"
  };

  const availableSlots = slots.filter(s => s.status === 'available');

  if (success) {
    return (
      <div className="service-detail-page">
        <div className="success-state">
          <span className="success-icon">✓</span>
          <h2>{t('booking.success')}</h2>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="service-detail-page">
      <div className="page-header">
        <button className="back-btn" onClick={handleBack}>
          <span>←</span>
        </button>
        <h1 className="page-title">{t('booking.title')}</h1>
      </div>

      {/* Date picker */}
      <div className="section">
        <h2 className="section-title">{t('booking.selectDate')}</h2>
        <div className="dates-row">
          {dates.map((date) => (
            <button
              key={date}
              className={`date-btn ${selectedDate === date ? 'active' : ''}`}
              onClick={() => handleDateSelect(date)}
            >
              <span className="date-day">
                {new Date(date).getDate()}
              </span>
              <span className="date-weekday">
                {formatDate(date).split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div className="section">
        <h2 className="section-title">{t('booking.selectTime')}</h2>
        
        {loading ? (
          <div className="loading-inline">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div className="error-inline">
            <p>{error}</p>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="empty-inline">
            <p>{t('booking.noSlots')}</p>
          </div>
        ) : (
          <div className="slots-grid">
            {availableSlots.map((slot) => (
              <button
                key={slot.id}
                className={`slot-btn ${selectedSlot === slot.id ? 'active' : ''}`}
                onClick={() => handleSlotSelect(slot.id)}
              >
                <span className="slot-time">
                  {formatTime(slot.startTime)}
                </span>
                {slot.trainer && (
                  <span className="slot-trainer">{slot.trainer}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Membership Badge */}
      {isCoveredByMembership && (
        <div className="membership-badge">
          <span className="badge-icon">🎟️</span>
          <span className="badge-text">{t('profile.includedInMembership')}</span>
          {membershipInfo?.type === 'VISITS' && membershipInfo.remainingVisits !== null && (
            <span className="badge-visits">({membershipInfo.remainingVisits} {t('profile.visitsLeft')})</span>
          )}
        </div>
      )}

      {/* Book button */}
      <div className="book-section">
        <button
          className={`book-btn ${isCoveredByMembership ? 'membership' : ''}`}
          disabled={!selectedSlot || booking}
          onClick={handleBooking}
        >
          {booking 
            ? t('common.loading') 
            : isCoveredByMembership 
              ? `🎟️ ${t('booking.confirm')}` 
              : t('booking.confirm')
          }
        </button>
      </div>

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .service-detail-page {
    padding-bottom: 100px;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border: none;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    color: var(--tg-theme-text-color, #000);
  }

  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--tg-theme-text-color, #000);
    margin: 0;
  }

  .section {
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

  .dates-row {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
    -webkit-overflow-scrolling: touch;
  }

  .date-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 56px;
    padding: 12px 8px;
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .date-btn.active {
    background: var(--tg-theme-button-color, #3390ec);
    border-color: var(--tg-theme-button-color, #3390ec);
  }

  .date-btn.active .date-day,
  .date-btn.active .date-weekday {
    color: var(--tg-theme-button-text-color, #fff);
  }

  .date-day {
    font-size: 18px;
    font-weight: 600;
    color: var(--tg-theme-text-color, #000);
  }

  .date-weekday {
    font-size: 11px;
    color: var(--tg-theme-hint-color, #999);
    text-transform: uppercase;
  }

  .slots-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .slot-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 14px 8px;
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border: 2px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .slot-btn.active {
    background: var(--tg-theme-button-color, #3390ec);
    border-color: var(--tg-theme-button-color, #3390ec);
  }

  .slot-btn.active .slot-time {
    color: var(--tg-theme-button-text-color, #fff);
  }

  .slot-btn.active .slot-trainer {
    color: rgba(255, 255, 255, 0.8);
  }

  .slot-time {
    font-size: 16px;
    font-weight: 600;
    color: var(--tg-theme-text-color, #000);
  }

  .slot-trainer {
    font-size: 11px;
    color: var(--tg-theme-hint-color, #999);
  }

  .loading-inline,
  .error-inline,
  .empty-inline {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--tg-theme-hint-color, #999);
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--tg-theme-secondary-bg-color, #f0f0f0);
    border-top-color: var(--tg-theme-button-color, #3390ec);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .membership-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(0, 200, 83, 0.15) 0%, rgba(0, 150, 63, 0.15) 100%);
    border: 1px solid rgba(0, 200, 83, 0.3);
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .badge-icon {
    font-size: 20px;
  }

  .badge-text {
    font-size: 14px;
    font-weight: 600;
    color: #00c853;
  }

  .badge-visits {
    font-size: 12px;
    color: var(--tg-theme-hint-color, #999);
  }

  .book-section {
    position: fixed;
    bottom: 92px;
    left: 0;
    right: 0;
    padding: 16px;
    background: var(--tg-theme-bg-color, #fff);
    border-top: 1px solid var(--tg-theme-secondary-bg-color, #f0f0f0);
  }

  .book-btn {
    width: 100%;
    padding: 16px;
    background: var(--tg-theme-button-color, #3390ec);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .book-btn.membership {
    background: linear-gradient(135deg, #00c853 0%, #00963f 100%);
  }

  .book-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
  }

  .success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: #4caf50;
    color: #fff;
    font-size: 40px;
    border-radius: 50%;
    margin-bottom: 20px;
  }

  .success-state h2 {
    font-size: 20px;
    color: var(--tg-theme-text-color, #000);
    margin: 0;
  }
`;
