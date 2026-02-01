import { useTranslation, changeLanguage, languages, getCurrentLanguage } from '@/shared/lib/i18n';
import { useUserStore } from '@/shared/lib/store/userStore';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingsApi, usersApi, membershipsApi } from '@/shared/lib/api';

interface Membership {
  id: string;
  plan: {
    id: string;
    name: string;
    type: string;
    durationDays: number;
    totalVisits: number | null;
    maxFreezeDays: number;
  };
  startDate: string;
  endDate: string;
  remainingVisits: number | null;
  usedFreezeDays: number;
  status: string;
  isFrozen: boolean;
}

const MOTIVATIONAL_QUOTES = {
  ru: [
    { text: "Каждая тренировка делает тебя сильнее! 💪", author: "" },
    { text: "Не останавливайся, пока не станешь гордиться собой!", author: "" },
    { text: "Твоё тело может всё. Это разум нужно убедить.", author: "" },
    { text: "Боль временна, гордость навсегда! 🔥", author: "" },
    { text: "Сегодня больно, завтра — сила!", author: "" },
    { text: "Ты сильнее, чем думаешь!", author: "" },
    { text: "Успех — это сумма маленьких усилий, повторяемых каждый день.", author: "" },
    { text: "Начни сейчас. Не завтра, не в понедельник — сейчас! 🚀", author: "" },
    { text: "Дисциплина — это мост между целями и достижениями.", author: "" },
    { text: "Твоё будущее создаётся тем, что ты делаешь сегодня!", author: "" },
  ],
  uz: [
    { text: "Har bir mashg'ulot seni kuchli qiladi! 💪", author: "" },
    { text: "O'zingdan faxrlanmaguncha to'xtama!", author: "" },
    { text: "Tanang hamma narsaga qodir. Aqlni ishontirish kerak.", author: "" },
    { text: "Og'riq vaqtinchalik, faxr abadiy! 🔥", author: "" },
    { text: "Bugun og'riq, ertaga — kuch!", author: "" },
    { text: "Sen o'ylaganingdan kuchlisan!", author: "" },
    { text: "Muvaffaqiyat — har kuni takrorlanadigan kichik harakatlar yig'indisi.", author: "" },
    { text: "Hozir boshlash. Ertaga emas, dushanbada emas — hozir! 🚀", author: "" },
    { text: "Intizom — maqsadlar va yutuqlar o'rtasidagi ko'prik.", author: "" },
    { text: "Kelajaging bugun qilgan ishlaringdan yaratiladi!", author: "" },
  ],
};

export const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
  const [goal, setGoal] = useState(12); // Default: 12 workouts per month
  const [completed, setCompleted] = useState(0);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal, setTempGoal] = useState(goal);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [phone, setPhone] = useState<string | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [freezeLoading, setFreezeLoading] = useState(false);

  // Load goal from localStorage
  useEffect(() => {
    const savedGoal = localStorage.getItem('fitness_goal');
    if (savedGoal) {
      setGoal(parseInt(savedGoal));
      setTempGoal(parseInt(savedGoal));
    }
  }, []);

  // Fetch user profile with phone and membership
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, membershipRes] = await Promise.all([
          usersApi.getMe(),
          membershipsApi.getMy(),
        ]);
        
        if (profileRes.data.phone) {
          setPhone(profileRes.data.phone);
        }
        
        if (membershipRes.data) {
          setMembership(membershipRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch completed bookings for this month
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await bookingsApi.getMy();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const completedThisMonth = response.data.filter((booking: { status: string; createdAt: string }) => {
          const bookingDate = new Date(booking.createdAt);
          return booking.status === 'COMPLETED' && bookingDate >= startOfMonth;
        }).length;
        
        // Also count confirmed bookings as "in progress"
        const confirmedThisMonth = response.data.filter((booking: { status: string; createdAt: string }) => {
          const bookingDate = new Date(booking.createdAt);
          return (booking.status === 'COMPLETED' || booking.status === 'CONFIRMED') && bookingDate >= startOfMonth;
        }).length;
        
        setCompleted(confirmedThisMonth);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
  }, []);

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      const quotes = MOTIVATIONAL_QUOTES[i18n.language as keyof typeof MOTIVATIONAL_QUOTES] || MOTIVATIONAL_QUOTES.ru;
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 10000); // Change every 10 seconds

    return () => clearInterval(interval);
  }, [i18n.language]);

  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang);
    setCurrentLang(lang);
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  };

  const handleSaveGoal = () => {
    setGoal(tempGoal);
    localStorage.setItem('fitness_goal', tempGoal.toString());
    setShowGoalModal(false);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
  };

  const remaining = Math.max(0, goal - completed);
  const progress = goal > 0 ? Math.min(100, (completed / goal) * 100) : 0;
  const quotes = MOTIVATIONAL_QUOTES[i18n.language as keyof typeof MOTIVATIONAL_QUOTES] || MOTIVATIONAL_QUOTES.ru;
  const currentQuote = quotes[quoteIndex];

  const getProgressColor = () => {
    if (progress >= 100) return 'var(--gradient-success)';
    if (progress >= 50) return 'linear-gradient(90deg, #FFD600 0%, #FF9500 100%)';
    return 'var(--gradient-fire)';
  };

  const getMotivationEmoji = () => {
    if (progress >= 100) return '🏆';
    if (progress >= 75) return '🔥';
    if (progress >= 50) return '💪';
    if (progress >= 25) return '🚀';
    return '🎯';
  };

  const handleFreeze = async () => {
    if (!membership) return;
    setFreezeLoading(true);
    try {
      await membershipsApi.freeze();
      const res = await membershipsApi.getMy();
      setMembership(res.data);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      console.error('Failed to freeze:', err);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleUnfreeze = async () => {
    if (!membership) return;
    setFreezeLoading(true);
    try {
      await membershipsApi.unfreeze();
      const res = await membershipsApi.getMy();
      setMembership(res.data);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      console.error('Failed to unfreeze:', err);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setFreezeLoading(false);
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="profile-page">
      <h1 className="page-title">{t('profile.title')}</h1>

      {/* Motivational Quote */}
      <div className="quote-card">
        <p className="quote-text">{currentQuote.text}</p>
      </div>

      {/* Statistics */}
      <div className="stats-card">
        <div className="stats-header">
          <span className="stats-emoji">{getMotivationEmoji()}</span>
          <h2 className="stats-title">{t('profile.monthlyProgress')}</h2>
          <button className="edit-goal-btn" onClick={() => setShowGoalModal(true)}>
            ✏️
          </button>
        </div>

        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progress}%`,
                background: getProgressColor(),
              }}
            />
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{goal}</span>
            <span className="stat-label">{t('profile.goal')}</span>
          </div>
          <div className="stat-item achieved">
            <span className="stat-value">{completed}</span>
            <span className="stat-label">{t('profile.achieved')}</span>
          </div>
          <div className="stat-item remaining">
            <span className="stat-value">{remaining}</span>
            <span className="stat-label">{t('profile.remaining')}</span>
          </div>
        </div>

        {progress >= 100 && (
          <div className="goal-reached">
            🎉 {t('profile.goalReached')}
          </div>
        )}
      </div>

      {/* Membership Card */}
      {membership && (
        <div className={`membership-card ${membership.isFrozen ? 'frozen' : ''}`}>
          <div className="membership-header">
            <span className="membership-icon">{membership.isFrozen ? '❄️' : '🎟️'}</span>
            <div className="membership-title">
              <h3>{t('profile.membership')}</h3>
              <span className={`membership-status ${membership.status.toLowerCase()}`}>
                {membership.isFrozen 
                  ? t('profile.membershipFrozen') 
                  : t('profile.membershipActive')
                }
              </span>
            </div>
          </div>

          {/* Large visits counter or unlimited until */}
          {!membership.isFrozen && (
            <div className="membership-visits-hero">
              {membership.plan.type === 'VISITS' && membership.remainingVisits !== null ? (
                <>
                  <span className="visits-hero-value">{membership.remainingVisits}</span>
                  <span className="visits-hero-label">{t('profile.visitsLeftShort')}</span>
                </>
              ) : (
                <span className="visits-hero-unlimited">
                  {t('profile.unlimitedUntil', { date: formatDate(membership.endDate) })}
                </span>
              )}
            </div>
          )}

          {/* Calendar strip: period start – end with today marker */}
          {!membership.isFrozen && (
            <div className="membership-calendar-strip">
              <div className="calendar-strip-labels">
                <span>{formatDate(membership.startDate)}</span>
                <span className="calendar-today-label">{t('profile.today')}</span>
                <span>{formatDate(membership.endDate)}</span>
              </div>
              <div className="calendar-strip-bar">
                <div
                  className="calendar-strip-elapsed"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        ((new Date().getTime() - new Date(membership.startDate).getTime()) /
                          (new Date(membership.endDate).getTime() -
                            new Date(membership.startDate).getTime())) *
                          100
                    )
                    )}%`,
                  }}
                />
                <div
                  className="calendar-strip-today"
                  style={{
                    left: `${Math.min(
                      100,
                      Math.max(
                        0,
                        ((new Date().getTime() - new Date(membership.startDate).getTime()) /
                          (new Date(membership.endDate).getTime() -
                            new Date(membership.startDate).getTime())) *
                          100
                    )
                    )}%`,
                  }}
                  title={t('profile.today')}
                />
              </div>
            </div>
          )}

          <div className="membership-plan">
            <span className="plan-name">{membership.plan.name}</span>
            <span className="plan-type">
              {membership.plan.type === 'UNLIMITED' 
                ? t('profile.unlimited') 
                : t('profile.visits')
              }
            </span>
          </div>

          <div className="membership-info">
            <div className="info-row">
              <span className="info-label">{t('profile.validUntil')}</span>
              <span className="info-value">{formatDate(membership.endDate)}</span>
            </div>
            
            {!membership.isFrozen && (
              <div className="info-row">
                <span className="info-label">{t('profile.daysLeft')}</span>
                <span className="info-value days-left">{getDaysRemaining(membership.endDate)}</span>
              </div>
            )}

            {membership.plan.type === 'VISITS' && membership.remainingVisits !== null && (
              <div className="info-row">
                <span className="info-label">{t('profile.visitsLeft')}</span>
                <span className="info-value visits-count">
                  {membership.remainingVisits} / {membership.plan.totalVisits}
                </span>
              </div>
            )}

            <div className="info-row">
              <span className="info-label">{t('profile.freezeDays')}</span>
              <span className="info-value">
                {membership.usedFreezeDays} / {membership.plan.maxFreezeDays}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {!membership.isFrozen && (
            <div className="membership-progress">
              <div 
                className="membership-progress-fill"
                style={{ 
                  width: `${Math.max(0, Math.min(100, 
                    (getDaysRemaining(membership.endDate) / membership.plan.durationDays) * 100
                  ))}%`
                }}
              />
            </div>
          )}

          {/* Freeze/Unfreeze Button */}
          {membership.status === 'ACTIVE' && (
            <button 
              className="freeze-btn"
              onClick={handleFreeze}
              disabled={freezeLoading || membership.usedFreezeDays >= membership.plan.maxFreezeDays}
            >
              {freezeLoading ? '...' : `❄️ ${t('profile.freezeMembership')}`}
            </button>
          )}

          {membership.status === 'FROZEN' && (
            <button 
              className="unfreeze-btn"
              onClick={handleUnfreeze}
              disabled={freezeLoading}
            >
              {freezeLoading ? '...' : `☀️ ${t('profile.unfreezeMembership')}`}
            </button>
          )}
        </div>
      )}

      {/* User Info */}
      <div className="profile-card">
        <div className="user-info">
          <div className="avatar">
            {user?.firstName?.[0] || '👤'}
          </div>
          <div className="user-details">
            <div className="user-name">
              {user?.firstName} {user?.lastName}
            </div>
            {user?.username && (
              <div className="user-username">@{user.username}</div>
            )}
            {phone && (
              <div className="user-phone">📱 {phone}</div>
            )}
          </div>
        </div>
        {/* Выйти — сразу под карточкой пользователя, видно без прокрутки */}
        <button
          type="button"
          className="logout-btn profile-logout"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
            window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
          }}
        >
          🚪 {t('auth.logout')}
        </button>
      </div>

      {/* Language Selection */}
      <div className="settings-section">
        <h2 className="section-title">{t('profile.language')}</h2>
        <div className="language-options">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-btn ${currentLang === lang.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-name">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('profile.setGoal')}</h3>
            <p className="modal-hint">{t('profile.goalHint')}</p>
            
            <div className="goal-input-container">
              <button 
                className="goal-btn"
                onClick={() => setTempGoal(Math.max(1, tempGoal - 1))}
              >
                −
              </button>
              <span className="goal-value">{tempGoal}</span>
              <button 
                className="goal-btn"
                onClick={() => setTempGoal(tempGoal + 1)}
              >
                +
              </button>
            </div>

            <div className="goal-presets">
              {[8, 12, 16, 20].map((preset) => (
                <button
                  key={preset}
                  className={`preset-btn ${tempGoal === preset ? 'active' : ''}`}
                  onClick={() => setTempGoal(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowGoalModal(false)}>
                {t('common.cancel')}
              </button>
              <button className="modal-btn primary" onClick={handleSaveGoal}>
                {t('common.save')}
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
  .profile-page {
    padding-bottom: 20px;
    animation: fade-in 0.3s ease-out;
  }
  
  .page-title {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 24px;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .quote-card {
    background: var(--gradient-fire);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 24px;
    color: #fff;
    position: relative;
    overflow: hidden;
    animation: slide-up 0.4s ease-out;
  }

  .quote-card::before {
    content: '"';
    position: absolute;
    top: -20px;
    left: 10px;
    font-size: 120px;
    opacity: 0.2;
    font-family: Georgia, serif;
  }

  .quote-text {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.5;
    margin: 0;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .stats-card {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid rgba(255, 77, 0, 0.2);
    animation: slide-up 0.4s ease-out 0.1s backwards;
  }

  .stats-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .stats-emoji {
    font-size: 32px;
    animation: float 3s ease-in-out infinite;
  }

  .stats-title {
    flex: 1;
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
  }

  .edit-goal-btn {
    width: 40px;
    height: 40px;
    background: rgba(255, 77, 0, 0.15);
    border: none;
    border-radius: 12px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .edit-goal-btn:hover {
    background: var(--primary);
    transform: scale(1.1);
  }

  .progress-container {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }

  .progress-bar {
    flex: 1;
    height: 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 8px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 20px rgba(255, 77, 0, 0.5);
  }

  .progress-text {
    font-size: 18px;
    font-weight: 800;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    min-width: 50px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .stat-item {
    text-align: center;
    padding: 16px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s;
  }

  .stat-item:hover {
    border-color: rgba(255, 77, 0, 0.3);
    background: rgba(255, 77, 0, 0.1);
  }

  .stat-value {
    display: block;
    font-size: 32px;
    font-weight: 800;
    color: var(--text-primary);
  }

  .stat-item.achieved .stat-value {
    background: var(--gradient-success);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stat-item.remaining .stat-value {
    background: linear-gradient(135deg, #FFD600 0%, #FF9500 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stat-label {
    display: block;
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 6px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .goal-reached {
    margin-top: 20px;
    padding: 16px;
    background: rgba(0, 255, 136, 0.15);
    border: 1px solid var(--success);
    color: var(--success);
    border-radius: 12px;
    text-align: center;
    font-weight: 700;
    animation: bounce-in 0.5s ease-out;
  }

  /* Membership Card */
  .membership-card {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 24px;
    border: 2px solid var(--accent);
    animation: slide-up 0.4s ease-out 0.15s backwards;
    position: relative;
    overflow: hidden;
  }

  .membership-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--gradient-fire);
  }

  .membership-card.frozen {
    border-color: #3390ec;
  }

  .membership-card.frozen::before {
    background: linear-gradient(90deg, #3390ec 0%, #1565c0 100%);
  }

  .membership-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .membership-icon {
    font-size: 36px;
  }

  .membership-title {
    flex: 1;
  }

  .membership-title h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .membership-status {
    font-size: 14px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 12px;
  }

  .membership-status.active {
    background: rgba(0, 255, 136, 0.2);
    color: var(--success);
  }

  .membership-status.frozen {
    background: rgba(51, 144, 236, 0.2);
    color: #3390ec;
  }

  .membership-visits-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 20px 0;
    margin-bottom: 16px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 16px;
  }

  .visits-hero-value {
    font-size: 48px;
    font-weight: 800;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
  }

  .visits-hero-label {
    font-size: 14px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .visits-hero-unlimited {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    text-align: center;
  }

  .membership-calendar-strip {
    margin-bottom: 20px;
  }

  .calendar-strip-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .calendar-today-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--primary);
    text-transform: uppercase;
  }

  .calendar-strip-bar {
    position: relative;
    height: 12px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    overflow: visible;
  }

  .calendar-strip-elapsed {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    border-radius: 6px;
    background: var(--gradient-fire);
    opacity: 0.6;
    transition: width 0.3s ease;
  }

  .calendar-strip-today {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 3px;
    background: var(--primary);
    border-radius: 2px;
    transform: translateX(-50%);
    box-shadow: 0 0 8px rgba(255, 77, 0, 0.6);
    z-index: 1;
  }

  .membership-plan {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .plan-name {
    font-size: 22px;
    font-weight: 800;
    color: var(--text-primary);
  }

  .plan-type {
    font-size: 12px;
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: var(--text-secondary);
    text-transform: uppercase;
  }

  .membership-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .info-label {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .info-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .info-value.days-left {
    color: var(--accent);
    font-size: 16px;
  }

  .info-value.visits-count {
    color: var(--success);
  }

  .membership-progress {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .membership-progress-fill {
    height: 100%;
    background: var(--gradient-fire);
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  .freeze-btn, .unfreeze-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .freeze-btn {
    background: rgba(51, 144, 236, 0.2);
    color: #3390ec;
    border: 1px solid rgba(51, 144, 236, 0.3);
  }

  .freeze-btn:hover {
    background: rgba(51, 144, 236, 0.3);
  }

  .freeze-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .unfreeze-btn {
    background: linear-gradient(135deg, #FFD600 0%, #FF9500 100%);
    color: #000;
  }

  .unfreeze-btn:hover {
    transform: scale(1.02);
  }

  .unfreeze-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .profile-card {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    animation: slide-up 0.4s ease-out 0.2s backwards;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: var(--gradient-fire);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 700;
    box-shadow: 0 0 20px rgba(255, 77, 0, 0.3);
  }
  
  .user-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
  }
  
  .user-username {
    font-size: 14px;
    color: var(--text-secondary);
    margin-top: 2px;
  }

  .user-phone {
    font-size: 14px;
    color: var(--primary);
    margin-top: 4px;
  }
  
  .settings-section {
    margin-bottom: 24px;
    animation: slide-up 0.4s ease-out 0.3s backwards;
  }
  
  .section-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-secondary);
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  
  .language-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .language-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: var(--bg-card);
    border: 2px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .language-btn:hover {
    border-color: rgba(255, 77, 0, 0.3);
    background: var(--bg-card-hover);
  }
  
  .language-btn.active {
    border-color: var(--primary);
    background: rgba(255, 77, 0, 0.1);
    box-shadow: 0 0 20px rgba(255, 77, 0, 0.2);
  }
  
  .lang-flag {
    font-size: 28px;
  }
  
  .lang-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .logout-btn,
  .logout-btn.profile-logout {
    width: 100%;
    padding: 16px 20px;
    background: rgba(255, 68, 68, 0.15);
    border: 2px solid rgba(255, 68, 68, 0.3);
    border-radius: 16px;
    font-size: 16px;
    font-weight: 600;
    color: var(--error);
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 16px;
  }

  .logout-btn:hover,
  .logout-btn.profile-logout:hover {
    background: rgba(255, 68, 68, 0.25);
    border-color: var(--error);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 1000;
    animation: fade-in 0.2s ease-out;
  }

  .modal {
    background: var(--bg-card);
    border: 1px solid rgba(255, 77, 0, 0.3);
    border-radius: 24px;
    padding: 32px;
    width: 100%;
    max-width: 340px;
    animation: bounce-in 0.4s ease-out;
  }

  .modal h3 {
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 8px 0;
    text-align: center;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .modal-hint {
    font-size: 14px;
    color: var(--text-secondary);
    text-align: center;
    margin: 0 0 24px 0;
  }

  .goal-input-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    margin-bottom: 24px;
  }

  .goal-btn {
    width: 56px;
    height: 56px;
    border: none;
    border-radius: 16px;
    background: var(--gradient-fire);
    color: #fff;
    font-size: 28px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    box-shadow: 0 0 20px rgba(255, 77, 0, 0.3);
  }

  .goal-btn:active {
    transform: scale(0.9);
  }

  .goal-value {
    font-size: 64px;
    font-weight: 800;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    min-width: 100px;
    text-align: center;
  }

  .goal-presets {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 28px;
  }

  .preset-btn {
    padding: 12px 20px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: transparent;
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .preset-btn:hover {
    border-color: var(--primary);
  }

  .preset-btn.active {
    background: var(--gradient-fire);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 0 20px rgba(255, 77, 0, 0.3);
  }

  .modal-actions {
    display: flex;
    gap: 12px;
  }

  .modal-btn {
    flex: 1;
    padding: 16px;
    border: none;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.3s;
  }

  .modal-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  .modal-btn.secondary:hover {
    border-color: rgba(255, 255, 255, 0.3);
  }

  .modal-btn.primary {
    background: var(--gradient-fire);
    color: #fff;
    box-shadow: 0 0 20px rgba(255, 77, 0, 0.3);
  }

  .modal-btn.primary:active {
    transform: scale(0.95);
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
`;
