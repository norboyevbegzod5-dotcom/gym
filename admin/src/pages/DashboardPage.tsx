import { useState, useEffect } from 'react';
import { statsApi } from '../api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalOrders: number;
  todayBookings: number;
  todayOrders: number;
  revenue: number;
  bookingsByDay: Array<{ date: string; count: number }>;
  usersWithMemberships: number;
  activeMembershipsCount: number;
  completedVisits: number;
  todayVisits: number;
  bookingsByService: Array<{ serviceName: string; count: number }>;
  visitsByDay: Array<{ date: string; count: number }>;
}

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsApi.getDashboard();
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' UZS';
  };

  if (loading) {
    return <div className="page-loading">Загрузка...</div>;
  }

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Дашборд</h1>

      {/* Основные показатели */}
      <section className="section">
        <h2 className="section-title">Основные показатели</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.totalUsers ?? 0}</span>
              <span className="stat-label">Пользователей</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎟️</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.usersWithMemberships ?? 0}</span>
              <span className="stat-label">Пользователей с абонементами</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.activeMembershipsCount ?? 0}</span>
              <span className="stat-label">Активных абонементов</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.completedVisits ?? 0}</span>
              <span className="stat-label">Посещений всего</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.todayBookings ?? 0}</span>
              <span className="stat-label">Записей сегодня</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏃</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.todayVisits ?? 0}</span>
              <span className="stat-label">Посещений сегодня</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🍹</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.todayOrders ?? 0}</span>
              <span className="stat-label">Заказов сегодня</span>
            </div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <span className="stat-value">{formatPrice(stats?.revenue ?? 0)}</span>
              <span className="stat-label">Выручка (месяц)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Графики по дате */}
      <section className="section chart-section">
        <h2 className="section-title">Записи и посещения по дням (последние 7 дней)</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={stats?.bookingsByDay?.map((d, i) => ({
                date: d.date,
                Записи: d.count,
                Посещения: stats?.visitsByDay?.[i]?.count ?? 0,
              })) ?? []}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Записи" fill="#3390ec" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Посещения" fill="#00c853" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* По названию услуг (за месяц) */}
      <section className="section chart-section">
        <h2 className="section-title">Записи по услугам (за текущий месяц)</h2>
        {stats?.bookingsByService?.length ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={stats.bookingsByService}
                layout="vertical"
                margin={{ left: 120, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="serviceName" width={110} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Записей" fill="#2575c9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="empty-chart">Нет записей за месяц</p>
        )}
      </section>

      {/* Итоги */}
      <section className="section">
        <h2 className="section-title">Итого</h2>
        <div className="summary-row">
          <div className="summary-card">
            <h3>Всего записей</h3>
            <span className="summary-value">{stats?.totalBookings ?? 0}</span>
          </div>
          <div className="summary-card">
            <h3>Всего посещений</h3>
            <span className="summary-value">{stats?.completedVisits ?? 0}</span>
          </div>
          <div className="summary-card">
            <h3>Всего заказов бара</h3>
            <span className="summary-value">{stats?.totalOrders ?? 0}</span>
          </div>
        </div>
      </section>

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .dashboard-page {
    max-width: 1200px;
  }

  .page-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 24px;
    color: #1a1a2e;
  }

  .page-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 400px;
    color: #666;
  }

  .section {
    margin-bottom: 32px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #1a1a2e;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .stat-card.highlight {
    background: linear-gradient(135deg, #3390ec 0%, #2575c9 100%);
    color: #fff;
  }

  .stat-icon {
    font-size: 32px;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
  }

  .stat-label {
    font-size: 12px;
    opacity: 0.85;
    line-height: 1.3;
  }

  .chart-section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .chart-section .section-title {
    margin-bottom: 20px;
  }

  .chart-container {
    min-height: 280px;
  }

  .empty-chart {
    color: #666;
    padding: 24px;
    text-align: center;
  }

  .summary-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .summary-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .summary-card h3 {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }

  .summary-value {
    font-size: 32px;
    font-weight: 700;
    color: #1a1a2e;
  }

  @media (max-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .summary-row {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
`;
