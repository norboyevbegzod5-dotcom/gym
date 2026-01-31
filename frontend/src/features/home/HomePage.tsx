import { useTranslation } from '@/shared/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Категории услуг с градиентами
const serviceCategories = [
  { id: 'membership', icon: '💳', gradient: 'linear-gradient(135deg, #FFD600 0%, #FF9500 100%)' },
  { id: 'group', icon: '👥', gradient: 'linear-gradient(135deg, #00D4FF 0%, #0066FF 100%)' },
  { id: 'personal', icon: '🏃', gradient: 'linear-gradient(135deg, #FF4D00 0%, #FF0066 100%)' },
  { id: 'massage', icon: '💆', gradient: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)' },
  { id: 'sauna', icon: '🧖', gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF4D00 100%)' },
  { id: 'solarium', icon: '☀️', gradient: 'linear-gradient(135deg, #FFD600 0%, #FF6B35 100%)' },
];

export const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    navigate(`/services/${categoryId}`);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-badge">CentrisFit</div>
        <h1 className="hero-title">{t('services.title')}</h1>
        <p className="hero-subtitle">Твой путь к идеальной форме</p>
      </div>

      {/* Categories Grid */}
      <div className="categories-grid">
        {serviceCategories.map((category, index) => (
          <button
            key={category.id}
            className={`category-card ${loaded ? 'animate' : ''}`}
            onClick={() => handleCategoryClick(category.id)}
            style={{ 
              '--gradient': category.gradient,
              '--delay': `${index * 0.08}s`,
            } as React.CSSProperties}
          >
            <div className="card-glow" />
            <div className="card-content">
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">
                {t(`services.categories.${category.id}`)}
              </span>
            </div>
            <div className="card-arrow">→</div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-value">24/7</span>
          <span className="stat-label">Доступ</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">50+</span>
          <span className="stat-label">Тренеров</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">1000+</span>
          <span className="stat-label">Клиентов</span>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .home-page {
    padding-bottom: 20px;
  }

  /* Hero Section */
  .hero-section {
    text-align: center;
    margin-bottom: 32px;
    animation: slide-up 0.5s ease-out;
  }

  .hero-badge {
    display: inline-block;
    padding: 6px 16px;
    background: var(--gradient-fire);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 16px;
    animation: bounce-in 0.6s ease-out 0.2s backwards;
  }

  .hero-title {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 8px;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .hero-subtitle {
    font-size: 16px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  /* Categories Grid */
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }

  .category-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px;
    min-height: 140px;
    background: var(--bg-card);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: translateY(30px);
  }

  .category-card.animate {
    animation: card-appear 0.5s ease-out forwards;
    animation-delay: var(--delay);
  }

  @keyframes card-appear {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .category-card:active {
    transform: scale(0.95) !important;
  }

  .category-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--gradient);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .category-card:hover::before {
    opacity: 1;
  }

  .card-glow {
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: var(--gradient);
    opacity: 0;
    filter: blur(60px);
    transition: opacity 0.4s;
    pointer-events: none;
  }

  .category-card:hover .card-glow {
    opacity: 0.15;
  }

  .card-content {
    position: relative;
    z-index: 1;
  }

  .category-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    font-size: 28px;
    margin-bottom: 12px;
    transition: all 0.3s;
  }

  .category-card:hover .category-icon {
    transform: scale(1.1) rotate(-5deg);
    background: rgba(255, 77, 0, 0.15);
  }

  .category-name {
    display: block;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    text-align: left;
    line-height: 1.3;
  }

  .card-arrow {
    position: absolute;
    bottom: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    font-size: 16px;
    color: var(--text-muted);
    transition: all 0.3s;
  }

  .category-card:hover .card-arrow {
    background: var(--primary);
    color: white;
    transform: translateX(4px);
  }

  /* Quick Stats */
  .quick-stats {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 24px;
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid rgba(255, 77, 0, 0.2);
    animation: slide-up 0.5s ease-out 0.4s backwards;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 800;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stat-label {
    font-size: 12px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .stat-divider {
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
  }
`;
