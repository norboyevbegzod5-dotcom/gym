import { useState, useEffect } from 'react';
import { settingsApi, TelegramChatSettings } from '../api';

export const SettingsPage = () => {
  const [settings, setSettings] = useState<TelegramChatSettings>({
    bookingsChatId: null,
    barOrdersChatId: null,
    feedbackChatId: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsApi.getTelegramChats();
      setSettings(response.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setMessage({ type: 'error', text: 'Не удалось загрузить настройки' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: keyof TelegramChatSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value.trim() || null,
    }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await settingsApi.updateTelegramChats(settings);
      setMessage({ type: 'success', text: 'Настройки сохранены' });
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMessage({ type: 'error', text: 'Не удалось сохранить настройки' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <h1 className="page-title">Настройки</h1>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Настройки</h1>
        <p className="page-subtitle">
          ID чатов/групп Telegram для уведомлений. Если не заданы — используются значения из .env или ADMIN_CHAT_ID.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section">
          <h2>Telegram-чаты для уведомлений</h2>

          <div className="form-group">
            <label htmlFor="bookingsChatId">ID группы для записей (BOOKINGS_CHAT_ID)</label>
            <input
              id="bookingsChatId"
              type="text"
              value={settings.bookingsChatId ?? ''}
              onChange={(e) => handleChange('bookingsChatId', e.target.value)}
              placeholder="-1001234567890"
            />
          </div>

          <div className="form-group">
            <label htmlFor="barOrdersChatId">ID группы для заказов бара (BAR_ORDERS_CHAT_ID)</label>
            <input
              id="barOrdersChatId"
              type="text"
              value={settings.barOrdersChatId ?? ''}
              onChange={(e) => handleChange('barOrdersChatId', e.target.value)}
              placeholder="-1001234567890"
            />
          </div>

          <div className="form-group">
            <label htmlFor="feedbackChatId">ID группы для отзывов (FEEDBACK_CHAT_ID)</label>
            <input
              id="feedbackChatId"
              type="text"
              value={settings.feedbackChatId ?? ''}
              onChange={(e) => handleChange('feedbackChatId', e.target.value)}
              placeholder="-1001234567890"
            />
          </div>
        </div>

        {message && (
          <p className={message.type === 'success' ? 'message success' : 'message error'}>
            {message.text}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>

      <style>{`
        .settings-page {
          max-width: 600px;
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
        .settings-form {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .settings-section h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 20px 0;
          color: #333;
        }
        .settings-section .form-group {
          margin-bottom: 16px;
        }
        .settings-section .form-group:last-of-type {
          margin-bottom: 0;
        }
        .form-group label {
          display: block;
          font-size: 13px;
          color: #666;
          margin-bottom: 6px;
        }
        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
        }
        .form-group input:focus {
          outline: none;
          border-color: #3390ec;
        }
        .form-group input::placeholder {
          color: #999;
        }
        .message {
          margin: 16px 0 0 0;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 14px;
        }
        .message.success {
          background: #e8f5e9;
          color: #2e7d32;
        }
        .message.error {
          background: #ffebee;
          color: #c62828;
        }
        .btn-primary {
          margin-top: 24px;
          padding: 12px 24px;
          background: #3390ec;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-primary:hover:not(:disabled) {
          background: #2878d4;
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
