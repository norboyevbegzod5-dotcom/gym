import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { authApi } from '@/shared/lib/api';
import { useUserStore, APP_TOKEN_KEY } from '@/shared/lib/store/userStore';

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useUserStore((state) => state.setUser);
  const setLanguage = useUserStore((state) => state.setLanguage);

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = phone.trim();
    if (!trimmed) {
      setError(t('auth.enterPhone'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.loginByPhone(trimmed);
      if (typeof window !== 'undefined') {
        localStorage.setItem(APP_TOKEN_KEY, data.token);
      }
      setUser({
        telegramId: data.user.id,
        firstName: data.user.firstName ?? undefined,
        lastName: data.user.lastName ?? undefined,
        username: data.user.username ?? undefined,
        phone: data.user.phone ?? undefined,
        languageCode: data.user.language,
      });
      if (data.user.language) {
        setLanguage(data.user.language);
      }
      const returnTo = searchParams.get('returnTo') || '/';
      navigate(returnTo, { replace: true });
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('auth.error'));
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">{t('auth.title')}</h1>
          <p className="login-subtitle">{t('auth.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">{t('auth.phone')}</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 900 123 45 67"
              autoComplete="tel"
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? t('common.loading') : t('auth.enter')}
          </button>
        </form>
      </div>

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fade-in 0.3s ease-out;
  }

  .login-card {
    width: 100%;
    max-width: 400px;
    background: var(--bg-card);
    border-radius: 24px;
    padding: 32px;
    border: 1px solid rgba(255, 77, 0, 0.2);
    box-shadow: 0 0 40px rgba(255, 77, 0, 0.1);
  }

  .login-header {
    text-align: center;
    margin-bottom: 28px;
  }

  .login-title {
    font-size: 26px;
    font-weight: 800;
    margin-bottom: 8px;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .login-subtitle {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .login-error {
    background: rgba(255, 68, 68, 0.15);
    color: var(--error);
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    margin-bottom: 20px;
    border: 1px solid rgba(255, 68, 68, 0.3);
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .form-input {
    width: 100%;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    font-size: 16px;
    color: var(--text-primary);
    transition: border-color 0.2s;
  }

  .form-input::placeholder {
    color: var(--text-muted);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--primary);
  }

  .form-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .login-btn {
    width: 100%;
    padding: 16px;
    background: var(--gradient-fire);
    color: #fff;
    border: none;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 0 20px rgba(255, 77, 0, 0.3);
  }

  .login-btn:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 0 30px rgba(255, 77, 0, 0.4);
  }

  .login-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
