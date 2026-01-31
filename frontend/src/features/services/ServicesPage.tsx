import { useEffect, useState } from 'react';
import { useTranslation } from '@/shared/lib/i18n';
import { useParams, useNavigate } from 'react-router-dom';
import { servicesApi } from '@/shared/lib/api';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
}

export const ServicesPage = () => {
  const { t, i18n } = useTranslation();
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      navigate('/');
      return;
    }

    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await servicesApi.getByCategory(categoryId, i18n.language);
        setServices(response.data);
      } catch (err) {
        console.error('Failed to fetch services:', err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [categoryId, i18n.language, navigate, t]);

  const handleServiceClick = (serviceId: string) => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    navigate(`/service/${serviceId}`);
  };

  const handleBack = () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    navigate('/');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(price) + ' UZS';
  };

  if (loading) {
    return (
      <div className="services-page">
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
      <div className="services-page">
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

  return (
    <div className="services-page">
      <div className="page-header">
        <button className="back-btn" onClick={handleBack}>
          <span>←</span>
        </button>
        <h1 className="page-title">
          {t(`services.categories.${categoryId}`)}
        </h1>
      </div>

      {services.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p>{t('services.empty')}</p>
        </div>
      ) : (
        <div className="services-list">
          {services.map((service) => (
            <button
              key={service.id}
              className="service-card"
              onClick={() => handleServiceClick(service.id)}
            >
              <div className="service-info">
                <h3 className="service-name">{service.name}</h3>
                {service.description && (
                  <p className="service-description">{service.description}</p>
                )}
                <div className="service-meta">
                  <span className="service-duration">
                    {t('services.duration', { minutes: service.durationMinutes })}
                  </span>
                </div>
              </div>
              <div className="service-price">
                {formatPrice(service.price)}
              </div>
              <span className="arrow">›</span>
            </button>
          ))}
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .services-page {
    padding-bottom: 20px;
    animation: fade-in 0.3s ease-out;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 16px;
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
    font-size: 22px;
    font-weight: 800;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }

  .loading-state,
  .error-state,
  .empty-state {
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

  .empty-icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
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

  .services-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .service-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: var(--bg-card);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    cursor: pointer;
    text-align: left;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .service-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--gradient-fire);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .service-card:hover::before {
    opacity: 1;
  }

  .service-card:hover {
    border-color: rgba(255, 77, 0, 0.3);
    transform: translateX(4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .service-card:active {
    transform: scale(0.98);
  }

  .service-info {
    flex: 1;
    min-width: 0;
  }

  .service-name {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 6px 0;
  }

  .service-description {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 10px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
  }

  .service-meta {
    display: flex;
    gap: 12px;
  }

  .service-duration {
    font-size: 12px;
    color: var(--text-muted);
    background: rgba(255, 255, 255, 0.05);
    padding: 4px 10px;
    border-radius: 6px;
  }

  .service-price {
    font-size: 16px;
    font-weight: 800;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
  }

  .arrow {
    font-size: 24px;
    color: var(--primary);
    transition: transform 0.3s;
  }

  .service-card:hover .arrow {
    transform: translateX(4px);
  }
`;
