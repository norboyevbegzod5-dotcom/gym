import { useState, useEffect } from 'react';
import { membershipPlansApi, servicesApi } from '../api';

interface Service {
  id: string;
  nameRu: string;
}

interface PlanService {
  serviceId: string;
  service: Service;
}

interface MembershipPlan {
  id: string;
  nameRu: string;
  nameUz: string | null;
  type: string;
  durationDays: number;
  totalVisits: number | null;
  maxFreezeDays: number;
  price: number;
  isActive: boolean;
  includedServices: PlanService[];
  _count: { userMemberships: number };
}

interface PlanForm {
  nameRu: string;
  nameUz: string;
  type: string;
  durationDays: string;
  totalVisits: string;
  maxFreezeDays: string;
  price: string;
  serviceIds: string[];
}

const defaultForm: PlanForm = {
  nameRu: '',
  nameUz: '',
  type: 'UNLIMITED',
  durationDays: '30',
  totalVisits: '',
  maxFreezeDays: '14',
  price: '',
  serviceIds: [],
};

export const MembershipPlansPage = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [form, setForm] = useState<PlanForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, servicesRes] = await Promise.all([
        membershipPlansApi.getAll(),
        servicesApi.getServices(),
      ]);
      setPlans(plansRes.data);
      setServices(servicesRes.data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (plan?: MembershipPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setForm({
        nameRu: plan.nameRu,
        nameUz: plan.nameUz || '',
        type: plan.type,
        durationDays: plan.durationDays.toString(),
        totalVisits: plan.totalVisits?.toString() || '',
        maxFreezeDays: plan.maxFreezeDays.toString(),
        price: plan.price.toString(),
        serviceIds: plan.includedServices.map((ps) => ps.serviceId),
      });
    } else {
      setEditingPlan(null);
      setForm(defaultForm);
    }
    setShowModal(true);
  };

  const toggleService = (serviceId: string) => {
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  const handleSave = async () => {
    if (!form.nameRu || !form.price || !form.durationDays) return;
    setSaving(true);

    const data = {
      nameRu: form.nameRu,
      nameUz: form.nameUz || undefined,
      type: form.type,
      durationDays: parseInt(form.durationDays),
      totalVisits: form.type === 'VISITS' && form.totalVisits ? parseInt(form.totalVisits) : undefined,
      maxFreezeDays: parseInt(form.maxFreezeDays),
      price: parseFloat(form.price),
      serviceIds: form.serviceIds,
    };

    try {
      if (editingPlan) {
        await membershipPlansApi.update(editingPlan.id, data);
      } else {
        await membershipPlansApi.create(data);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await membershipPlansApi.update(id, { isActive: !isActive });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот тариф?')) return;
    try {
      await membershipPlansApi.delete(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' UZS';
  };

  const formatDuration = (days: number) => {
    if (days === 30) return '1 месяц';
    if (days === 90) return '3 месяца';
    if (days === 180) return '6 месяцев';
    if (days === 365) return '1 год';
    return `${days} дней`;
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="membership-plans-page">
      <div className="page-header">
        <h1 className="page-title">Тарифы абонементов</h1>
        <button className="btn-add" onClick={() => openModal()}>
          + Добавить тариф
        </button>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card ${!plan.isActive ? 'inactive' : ''}`}>
            <div className="plan-header">
              <h3 className="plan-name">{plan.nameRu}</h3>
              <span className={`plan-type ${plan.type.toLowerCase()}`}>
                {plan.type === 'UNLIMITED' ? 'Безлимит' : 'По визитам'}
              </span>
            </div>

            <div className="plan-price">{formatPrice(plan.price)}</div>

            <div className="plan-details">
              <div className="detail-item">
                <span className="label">Срок:</span>
                <span className="value">{formatDuration(plan.durationDays)}</span>
              </div>
              {plan.type === 'VISITS' && plan.totalVisits && (
                <div className="detail-item">
                  <span className="label">Визитов:</span>
                  <span className="value">{plan.totalVisits}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="label">Заморозка:</span>
                <span className="value">до {plan.maxFreezeDays} дней</span>
              </div>
            </div>

            <div className="plan-services">
              <span className="services-label">Включённые услуги:</span>
              {plan.includedServices.length === 0 ? (
                <span className="no-services">Не выбраны</span>
              ) : (
                <div className="services-list">
                  {plan.includedServices.map((ps) => (
                    <span key={ps.serviceId} className="service-tag">
                      {ps.service.nameRu}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="plan-stats">
              <span>Активных: {plan._count.userMemberships}</span>
            </div>

            <div className="plan-actions">
              <button
                className={`btn-toggle ${plan.isActive ? 'active' : ''}`}
                onClick={() => toggleActive(plan.id, plan.isActive)}
              >
                {plan.isActive ? '✓ Активен' : '✕ Неактивен'}
              </button>
              <button className="btn-edit" onClick={() => openModal(plan)}>
                ✏️
              </button>
              <button className="btn-delete" onClick={() => handleDelete(plan.id)}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="empty-state">
          <p>Тарифы не созданы</p>
          <button className="btn-add" onClick={() => openModal()}>
            Создать первый тариф
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingPlan ? 'Редактировать тариф' : 'Новый тариф'}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Название (RU) *</label>
                <input
                  type="text"
                  value={form.nameRu}
                  onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
                  placeholder="Стандарт"
                />
              </div>
              <div className="form-group">
                <label>Название (UZ)</label>
                <input
                  type="text"
                  value={form.nameUz}
                  onChange={(e) => setForm({ ...form, nameUz: e.target.value })}
                  placeholder="Standart"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Тип *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="UNLIMITED">Безлимит</option>
                  <option value="VISITS">По визитам</option>
                </select>
              </div>
              <div className="form-group">
                <label>Срок (дней) *</label>
                <select
                  value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                >
                  <option value="30">1 месяц (30)</option>
                  <option value="90">3 месяца (90)</option>
                  <option value="180">6 месяцев (180)</option>
                  <option value="365">1 год (365)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Цена (UZS) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="500000"
                />
              </div>
              {form.type === 'VISITS' && (
                <div className="form-group">
                  <label>Кол-во визитов *</label>
                  <input
                    type="number"
                    value={form.totalVisits}
                    onChange={(e) => setForm({ ...form, totalVisits: e.target.value })}
                    placeholder="12"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Макс. заморозка (дней)</label>
                <input
                  type="number"
                  value={form.maxFreezeDays}
                  onChange={(e) => setForm({ ...form, maxFreezeDays: e.target.value })}
                  placeholder="14"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Включённые услуги</label>
              <div className="services-checkboxes">
                {services.map((service) => (
                  <label key={service.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={form.serviceIds.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                    />
                    <span>{service.nameRu}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Отмена
              </button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
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
  .membership-plans-page {
    max-width: 1200px;
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

  .plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .plan-card {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;
  }

  .plan-card.inactive {
    opacity: 0.6;
  }

  .plan-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .plan-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .plan-name {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0;
  }

  .plan-type {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .plan-type.unlimited {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .plan-type.visits {
    background: #fff3e0;
    color: #ef6c00;
  }

  .plan-price {
    font-size: 28px;
    font-weight: 800;
    color: #3390ec;
    margin-bottom: 16px;
  }

  .plan-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }

  .detail-item .label {
    color: #666;
  }

  .detail-item .value {
    font-weight: 500;
    color: #1a1a2e;
  }

  .plan-services {
    margin-bottom: 16px;
  }

  .services-label {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
  }

  .no-services {
    color: #999;
    font-style: italic;
    font-size: 13px;
  }

  .services-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .service-tag {
    padding: 4px 10px;
    background: #f0f0f0;
    border-radius: 12px;
    font-size: 12px;
    color: #666;
  }

  .plan-stats {
    font-size: 13px;
    color: #666;
    margin-bottom: 16px;
  }

  .plan-actions {
    display: flex;
    gap: 8px;
  }

  .btn-toggle {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    background: #f5f5f5;
    color: #666;
  }

  .btn-toggle.active {
    background: #e8f5e9;
    border-color: #2e7d32;
    color: #2e7d32;
  }

  .btn-edit, .btn-delete {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
  }

  .btn-edit {
    background: #f0f0f0;
  }

  .btn-delete {
    background: #ffebee;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
  }

  .empty-state .btn-add {
    margin-top: 20px;
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
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal h3 {
    font-size: 20px;
    margin: 0 0 24px 0;
    color: #1a1a2e;
  }

  .form-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .form-row .form-group {
    flex: 1;
    min-width: 150px;
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

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3390ec;
  }

  .services-checkboxes {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    cursor: pointer;
  }

  .checkbox-item input {
    width: 16px;
    height: 16px;
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
