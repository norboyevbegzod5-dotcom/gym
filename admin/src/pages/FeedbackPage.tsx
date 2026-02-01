import { useState, useEffect } from 'react';
import { feedbacksApi } from '../api';

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  booking: {
    user: {
      firstName: string | null;
      lastName: string | null;
      username: string | null;
      phone: string | null;
    };
    slot: {
      date: string;
      startTime: string;
      service: { nameRu: string };
    };
  };
}

export const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await feedbacksApi.getAll();
      setFeedbacks(response.data);
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const getUserName = (user: Feedback['booking']['user']) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    if (user.username) return `@${user.username}`;
    if (user.phone) return user.phone;
    return '—';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="feedback-page">
        <h1 className="page-title">Отзывы</h1>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="feedback-page">
      <div className="page-header">
        <h1 className="page-title">Отзывы</h1>
        <p className="page-subtitle">
          Отзывы после занятий. Уведомления отправляются в группу Telegram (FEEDBACK_CHAT_ID).
        </p>
      </div>

      {feedbacks.length === 0 ? (
        <div className="empty-state">
          <p>Пока нет отзывов.</p>
        </div>
      ) : (
        <div className="feedback-list">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="feedback-card">
              <div className="feedback-header">
                <span className="feedback-user">{getUserName(fb.booking.user)}</span>
                <span className="feedback-date">{formatDate(fb.createdAt)}</span>
              </div>
              <div className="feedback-meta">
                <span className="feedback-service">{fb.booking.slot.service.nameRu}</span>
                <span className="feedback-session-date">
                  Занятие: {formatDate(fb.booking.slot.date)} {formatTime(fb.booking.slot.startTime)}
                </span>
              </div>
              <div className="feedback-rating">
                <span className="rating-label">Оценка:</span>
                <span className="rating-stars">{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
                <span className="rating-value">{fb.rating}/5</span>
              </div>
              {fb.comment && (
                <div className="feedback-comment">
                  <span className="comment-label">Комментарий:</span>
                  <p>{fb.comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .feedback-page {
          max-width: 900px;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1a1a2e;
        }
        .page-subtitle {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        .empty-state {
          padding: 48px 24px;
          text-align: center;
          color: #666;
        }
        .feedback-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .feedback-card {
          padding: 20px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .feedback-user {
          font-weight: 600;
          font-size: 16px;
          color: #1a1a2e;
        }
        .feedback-date {
          font-size: 13px;
          color: #999;
        }
        .feedback-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }
        .feedback-service {
          font-size: 14px;
          color: #333;
        }
        .feedback-session-date {
          font-size: 12px;
          color: #666;
        }
        .feedback-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .rating-label {
          font-size: 13px;
          color: #666;
        }
        .rating-stars {
          font-size: 18px;
          color: #ffc107;
        }
        .rating-value {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
        }
        .feedback-comment {
          padding-top: 12px;
          border-top: 1px solid #eee;
        }
        .comment-label {
          font-size: 12px;
          color: #999;
          display: block;
          margin-bottom: 4px;
        }
        .feedback-comment p {
          margin: 0;
          font-size: 14px;
          color: #333;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};
