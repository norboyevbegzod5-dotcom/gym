import { useState, useEffect } from 'react';
import { userMembershipsApi, membershipPlansApi, clientsApi } from '../api';

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  phone: string | null;
}

interface MembershipPlan {
  id: string;
  nameRu: string;
  type: string;
  durationDays: number;
  totalVisits: number | null;
  price: number;
}

interface MembershipFreeze {
  id: string;
  freezeStart: string;
  freezeEnd: string | null;
  daysFrozen: number;
}

interface UserMembership {
  id: string;
  user: User;
  plan: MembershipPlan;
  startDate: string;
  endDate: string;
  remainingVisits: number | null;
  usedFreezeDays: number;
  status: string;
  paymentType: string;
  freezes: MembershipFreeze[];
}

interface Client {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

export const UserMembershipsPage = () => {
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ userId: '', planId: '', paymentType: 'OFFLINE' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membershipsRes, plansRes, clientsRes] = await Promise.all([
        userMembershipsApi.getAll(filter || undefined),
        membershipPlansApi.getAll(),
        clientsApi.getAll(),
      ]);
      setMemberships(membershipsRes.data);
      setPlans(plansRes.data);
      setClients(clientsRes.data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleAssign = async () => {
    if (!assignForm.userId || !assignForm.planId) return;
    setSaving(true);
    try {
      await userMembershipsApi.assign(assignForm);
      setShowAssignModal(false);
      setAssignForm({ userId: '', planId: '', paymentType: 'OFFLINE' });
      fetchData();
    } catch (err) {
      console.error('Failed to assign:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleFreeze = async (id: string) => {
    if (!confirm('Заморозить абонемент?')) return;
    try {
      await userMembershipsApi.freeze(id);
      fetchData();
    } catch (err) {
      console.error('Failed to freeze:', err);
    }
  };

  const handleUnfreeze = async (id: string) => {
    if (!confirm('Разморозить абонемент?')) return;
    try {
      await userMembershipsApi.unfreeze(id);
      fetchData();
    } catch (err) {
      console.error('Failed to unfreeze:', err);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Отменить абонемент? Это действие нельзя отменить.')) return;
    try {
      await userMembershipsApi.updateStatus(id, 'CANCELLED');
      fetchData();
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getClientName = (user: User) => {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Без имени';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#2e7d32';
      case 'FROZEN': return '#1565c0';
      case 'EXPIRED': return '#666';
      case 'CANCELLED': return '#c62828';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Активен';
      case 'FROZEN': return 'Заморожен';
      case 'EXPIRED': return 'Истёк';
      case 'CANCELLED': return 'Отменён';
      default: return status;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="user-memberships-page">
      <div className="page-header">
        <h1 className="page-title">Абонементы клиентов</h1>
        <button className="btn-add" onClick={() => setShowAssignModal(true)}>
          + Назначить абонемент
        </button>
      </div>

      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Все статусы</option>
          <option value="ACTIVE">Активные</option>
          <option value="FROZEN">Замороженные</option>
          <option value="EXPIRED">Истёкшие</option>
          <option value="CANCELLED">Отменённые</option>
        </select>
        <span className="count">Найдено: {memberships.length}</span>
      </div>

      <div className="memberships-table">
        <div className="table-header">
          <div className="col-client">Клиент</div>
          <div className="col-plan">Тариф</div>
          <div className="col-dates">Период</div>
          <div className="col-visits">Визиты</div>
          <div className="col-status">Статус</div>
          <div className="col-actions">Действия</div>
        </div>

        <div className="table-body">
          {memberships.map((m) => (
            <div key={m.id} className="table-row">
              <div className="col-client">
                <span className="client-name">{getClientName(m.user)}</span>
                {m.user.phone && (
                  <span className="client-phone">{m.user.phone}</span>
                )}
              </div>
              <div className="col-plan">
                <span className="plan-name">{m.plan.nameRu}</span>
                <span className="plan-type">
                  {m.plan.type === 'UNLIMITED' ? 'Безлимит' : 'По визитам'}
                </span>
              </div>
              <div className="col-dates">
                <span className="date-range">
                  {formatDate(m.startDate)} — {formatDate(m.endDate)}
                </span>
                {m.status === 'ACTIVE' && (
                  <span className="days-remaining">
                    Осталось: {getDaysRemaining(m.endDate)} дн.
                  </span>
                )}
              </div>
              <div className="col-visits">
                {m.plan.type === 'VISITS' ? (
                  <span className="visits-count">
                    {m.remainingVisits} / {m.plan.totalVisits}
                  </span>
                ) : (
                  <span className="unlimited-badge">∞</span>
                )}
              </div>
              <div className="col-status">
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(m.status) + '20', color: getStatusColor(m.status) }}
                >
                  {getStatusLabel(m.status)}
                </span>
                {m.usedFreezeDays > 0 && (
                  <span className="freeze-info">
                    Заморожено: {m.usedFreezeDays} дн.
                  </span>
                )}
              </div>
              <div className="col-actions">
                {m.status === 'ACTIVE' && (
                  <button className="btn-action freeze" onClick={() => handleFreeze(m.id)} title="Заморозить">
                    ❄️
                  </button>
                )}
                {m.status === 'FROZEN' && (
                  <button className="btn-action unfreeze" onClick={() => handleUnfreeze(m.id)} title="Разморозить">
                    ☀️
                  </button>
                )}
                {(m.status === 'ACTIVE' || m.status === 'FROZEN') && (
                  <button className="btn-action cancel" onClick={() => handleCancel(m.id)} title="Отменить">
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {memberships.length === 0 && (
        <div className="empty-state">
          <p>Абонементы не найдены</p>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Назначить абонемент</h3>

            <div className="form-group">
              <label>Клиент *</label>
              <select
                value={assignForm.userId}
                onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
              >
                <option value="">Выберите клиента</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {getClientName(client as User)} {client.phone && `(${client.phone})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Тариф *</label>
              <select
                value={assignForm.planId}
                onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
              >
                <option value="">Выберите тариф</option>
                {plans.filter(p => p.isActive !== false).map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nameRu} — {new Intl.NumberFormat('ru-RU').format(plan.price)} UZS
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Тип оплаты</label>
              <select
                value={assignForm.paymentType}
                onChange={(e) => setAssignForm({ ...assignForm, paymentType: e.target.value })}
              >
                <option value="OFFLINE">Наличные / Карта (офлайн)</option>
                <option value="ONLINE">Онлайн оплата</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAssignModal(false)}>
                Отмена
              </button>
              <button className="btn-save" onClick={handleAssign} disabled={saving}>
                {saving ? 'Назначение...' : 'Назначить'}
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
  .user-memberships-page {
    max-width: 1400px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .btn-add {
    padding: 10px 20px;
    background: linear-gradient(135deg, #3390ec 0%, #0066cc 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .filters {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }

  .filters select {
    padding: 10px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
  }

  .count {
    font-size: 14px;
    color: #666;
  }

  .memberships-table {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .table-header {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr 100px 120px 100px;
    gap: 16px;
    padding: 16px 20px;
    background: #f8f9fa;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: #666;
  }

  .table-body {
    max-height: 600px;
    overflow-y: auto;
  }

  .table-row {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr 100px 120px 100px;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
    align-items: center;
  }

  .col-client {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .client-name {
    font-weight: 600;
    color: #1a1a2e;
  }

  .client-phone {
    font-size: 12px;
    color: #666;
  }

  .col-plan {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .plan-name {
    font-weight: 500;
    color: #1a1a2e;
  }

  .plan-type {
    font-size: 11px;
    color: #999;
  }

  .col-dates {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .date-range {
    font-size: 13px;
    color: #1a1a2e;
  }

  .days-remaining {
    font-size: 11px;
    color: #3390ec;
    font-weight: 500;
  }

  .visits-count {
    font-weight: 600;
    color: #1a1a2e;
  }

  .unlimited-badge {
    font-size: 20px;
    color: #2e7d32;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .freeze-info {
    display: block;
    font-size: 11px;
    color: #666;
    margin-top: 4px;
  }

  .col-actions {
    display: flex;
    gap: 6px;
  }

  .btn-action {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-action.freeze {
    background: #e3f2fd;
  }

  .btn-action.unfreeze {
    background: #fff3e0;
  }

  .btn-action.cancel {
    background: #ffebee;
    color: #c62828;
    font-size: 14px;
    font-weight: 700;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
  }

  /* Modal */
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
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    width: 100%;
    max-width: 450px;
  }

  .modal h3 {
    font-size: 20px;
    margin: 0 0 24px 0;
    color: #1a1a2e;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    font-size: 13px;
    color: #666;
    margin-bottom: 6px;
  }

  .form-group select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }

  .btn-cancel, .btn-save {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .btn-cancel {
    background: #f0f0f0;
    color: #666;
  }

  .btn-save {
    background: linear-gradient(135deg, #3390ec 0%, #0066cc 100%);
    color: #fff;
  }

  .btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
