import { useEffect, useState } from 'react';
import { useTranslation } from '@/shared/lib/i18n';
import { useParams, useNavigate } from 'react-router-dom';
import { membershipsApi } from '@/shared/lib/api';

interface MembershipPlan {
  id: string;
  name: string;
  type: string;
  durationDays: number;
  totalVisits: number | null;
  price: number;
  includedServices: Array<{ id: string; name: string }>;
}

export const MembershipPlanDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!planId) {
      navigate('/services/membership');
      return;
    }

    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await membershipsApi.getPlans(i18n.language);
        const found = response.data.find((p: MembershipPlan) => p.id === planId);
        if (found) {
          setPlan(found);
        } else {
          setError(t('membership.planNotFound'));
        }
      } catch (err) {
        console.error('Failed to fetch plan:', err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [planId, i18n.language, navigate, t]);

  const handleBack = () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    navigate(-1);
  };

  const handlePurchase = async () => {
    if (!planId) return;

    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    setPurchasing(true);
    setError(null);

    try {
      await membershipsApi.purchase(planId);
      setSuccess(true);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err: unknown) {
      console.error('Purchase failed:', err);
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
          ? String((err.response.data as { message?: unknown }).message)
          : t('membership.purchaseError');
      setError(msg);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price: number) => {
    return (
      new Intl.NumberFormat(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU', {
        style: 'decimal',
        minimumFractionDigits: 0,
      }).format(price) + ' UZS'
    );
  };

  if (success) {
    return (
      <div className="membership-plan-page">
        <div className="success-state">
          <span className="success-icon">✓</span>
          <h2>{t('membership.purchaseSuccess')}</h2>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="membership-plan-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="membership-plan-page">
        <div className="page-header">
          <button className="back-btn" onClick={handleBack}>
            <span>←</span>
          </button>
          <h1 className="page-title">{t('membership.planTitle')}</h1>
        </div>
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            {t('common.retry')}
          </button>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="membership-plan-page">
      <div className="page-header">
        <button className="back-btn" onClick={handleBack}>
          <span>←</span>
        </button>
        <h1 className="page-title">{plan.name}</h1>
      </div>

      <div className="plan-detail">
        <div className="plan-type-badge">
          {plan.type === 'UNLIMITED'
            ? t('membership.unlimited')
            : t('membership.visits')}
        </div>
        <div className="plan-meta">
          {plan.type === 'UNLIMITED' ? (
            <p>{t('membership.unlimitedDays', { days: plan.durationDays })}</p>
          ) : (
            <p>
              {t('membership.visitsPlan', {
                visits: plan.totalVisits,
                days: plan.durationDays,
              })}
            </p>
          )}
        </div>
        {plan.includedServices.length > 0 && (
          <div className="included-services">
            <h3>{t('membership.includedServices')}</h3>
            <ul>
              {plan.includedServices.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="plan-price">{formatPrice(plan.price)}</div>
      </div>

      {error && <div className="error-inline">{error}</div>}

      <div className="purchase-section">
        <button
          className="purchase-btn"
          disabled={purchasing}
          onClick={handlePurchase}
        >
          {purchasing ? t('common.loading') : t('membership.buy')}
        </button>
      </div>

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .membership-plan-page {
    padding-bottom: 100px;
    animation: fade-in 0.3s ease-out;
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
    width: 44px;
    height: 44px;
    background: var(--bg-card);
    border: 2px solid rgba(255, 77, 0, 0.3);
    border-radius: 14px;
    font-size: 20px;
    cursor: pointer;
    color: var(--primary);
    transition: all 0.3s;
  }

  .back-btn:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .plan-detail {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    margin-bottom: 24px;
  }

  .plan-type-badge {
    display: inline-block;
    padding: 6px 14px;
    background: rgba(255, 77, 0, 0.2);
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--primary);
    margin-bottom: 16px;
  }

  .plan-meta {
    margin-bottom: 20px;
  }

  .plan-meta p {
    margin: 0;
    font-size: 15px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .included-services {
    margin-bottom: 20px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .included-services h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0 0 10px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .included-services ul {
    margin: 0;
    padding-left: 20px;
    color: var(--text-primary);
    font-size: 14px;
    line-height: 1.6;
  }

  .plan-price {
    font-size: 24px;
    font-weight: 800;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .error-inline {
    padding: 12px 16px;
    background: rgba(255, 68, 68, 0.15);
    border: 1px solid rgba(255, 68, 68, 0.3);
    border-radius: 12px;
    color: var(--error);
    font-size: 14px;
    margin-bottom: 16px;
  }

  .purchase-section {
    position: fixed;
    bottom: 70px;
    left: 0;
    right: 0;
    padding: 16px;
    background: var(--tg-theme-bg-color, var(--bg-page));
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .purchase-btn {
    width: 100%;
    padding: 16px;
    background: var(--gradient-fire);
    color: #fff;
    border: none;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
    box-shadow: 0 0 20px rgba(255, 77, 0, 0.3);
  }

  .purchase-btn:hover:not(:disabled) {
    opacity: 0.95;
  }

  .purchase-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
    color: var(--text-secondary);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--bg-card);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .retry-btn {
    margin-top: 20px;
    padding: 14px 32px;
    background: var(--gradient-fire);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    box-shadow: 0 0 20px rgba(255, 77, 0, 0.3);
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
    background: var(--success);
    color: #fff;
    font-size: 40px;
    border-radius: 50%;
    margin-bottom: 20px;
  }

  .success-state h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
`;
