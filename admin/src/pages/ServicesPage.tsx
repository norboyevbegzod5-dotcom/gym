import { useState, useEffect } from 'react';
import { servicesApi } from '../api';

interface Category {
  id: string;
  slug: string;
  nameRu: string;
  nameUz: string | null;
  icon: string | null;
  isActive: boolean;
}

interface Service {
  id: string;
  categoryId: string;
  nameRu: string;
  nameUz: string | null;
  descriptionRu: string | null;
  price: number;
  duration: number | null;
  capacity: number;
  isActive: boolean;
  category: Category;
}

interface CategoryForm {
  slug: string;
  nameRu: string;
  nameUz: string;
  icon: string;
}

interface ServiceForm {
  categoryId: string;
  nameRu: string;
  nameUz: string;
  descriptionRu: string;
  price: string;
  duration: string;
  capacity: string;
}

export const ServicesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ slug: '', nameRu: '', nameUz: '', icon: '' });
  const [serviceForm, setServiceForm] = useState<ServiceForm>({ categoryId: '', nameRu: '', nameUz: '', descriptionRu: '', price: '', duration: '', capacity: '1' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [catRes, srvRes] = await Promise.all([
        servicesApi.getCategories(),
        servicesApi.getServices(),
      ]);
      setCategories(catRes.data);
      setServices(srvRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' UZS';
  };

  const handleToggleActive = async (type: 'category' | 'service', id: string, isActive: boolean) => {
    try {
      if (type === 'category') {
        await servicesApi.updateCategory(id, { isActive: !isActive });
      } else {
        await servicesApi.updateService(id, { isActive: !isActive });
      }
      fetchData();
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  // Category handlers
  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        slug: category.slug,
        nameRu: category.nameRu,
        nameUz: category.nameUz || '',
        icon: category.icon || '',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ slug: '', nameRu: '', nameUz: '', icon: '' });
    }
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.nameRu || !categoryForm.slug) return;
    setSaving(true);
    try {
      if (editingCategory) {
        await servicesApi.updateCategory(editingCategory.id, {
          nameRu: categoryForm.nameRu,
          nameUz: categoryForm.nameUz || undefined,
          icon: categoryForm.icon || undefined,
        });
      } else {
        await servicesApi.createCategory({
          slug: categoryForm.slug,
          nameRu: categoryForm.nameRu,
          nameUz: categoryForm.nameUz || undefined,
          icon: categoryForm.icon || undefined,
        });
      }
      setShowCategoryModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save category:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Удалить категорию? Все услуги в ней тоже будут удалены!')) return;
    try {
      await servicesApi.deleteCategory(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  // Service handlers
  const openServiceModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        categoryId: service.categoryId,
        nameRu: service.nameRu,
        nameUz: service.nameUz || '',
        descriptionRu: service.descriptionRu || '',
        price: service.price.toString(),
        duration: service.duration?.toString() || '',
        capacity: service.capacity.toString(),
      });
    } else {
      setEditingService(null);
      setServiceForm({
        categoryId: categories[0]?.id || '',
        nameRu: '',
        nameUz: '',
        descriptionRu: '',
        price: '',
        duration: '',
        capacity: '1',
      });
    }
    setShowServiceModal(true);
  };

  const saveService = async () => {
    if (!serviceForm.nameRu || !serviceForm.price || !serviceForm.categoryId) return;
    setSaving(true);
    try {
      const data = {
        categoryId: serviceForm.categoryId,
        nameRu: serviceForm.nameRu,
        nameUz: serviceForm.nameUz || undefined,
        descriptionRu: serviceForm.descriptionRu || undefined,
        price: parseFloat(serviceForm.price),
        duration: serviceForm.duration ? parseInt(serviceForm.duration) : undefined,
        capacity: parseInt(serviceForm.capacity) || 1,
      };
      if (editingService) {
        await servicesApi.updateService(editingService.id, data);
      } else {
        await servicesApi.createService(data);
      }
      setShowServiceModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save service:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('Удалить услугу?')) return;
    try {
      await servicesApi.deleteService(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  if (loading) {
    return <div className="page-loading">Загрузка...</div>;
  }

  return (
    <div className="services-page">
      <div className="page-header">
        <h1 className="page-title">Услуги</h1>
        <div className="header-actions">
          <button className="btn secondary" onClick={() => openCategoryModal()}>
            + Категория
          </button>
          <button className="btn primary" onClick={() => openServiceModal()}>
            + Услуга
          </button>
        </div>
      </div>

      <div className="section">
        <h2>Категории</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Иконка</th>
                <th>Название (RU)</th>
                <th>Название (UZ)</th>
                <th>Slug</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.icon || '—'}</td>
                  <td>{cat.nameRu}</td>
                  <td>{cat.nameUz || '—'}</td>
                  <td><code>{cat.slug}</code></td>
                  <td>
                    <span className={`status ${cat.isActive ? 'active' : 'inactive'}`}>
                      {cat.isActive ? 'Активна' : 'Скрыта'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" onClick={() => openCategoryModal(cat)} title="Редактировать">✏️</button>
                      <button className="btn-icon" onClick={() => handleToggleActive('category', cat.id, cat.isActive)} title={cat.isActive ? 'Скрыть' : 'Показать'}>
                        {cat.isActive ? '🙈' : '👁️'}
                      </button>
                      <button className="btn-icon danger" onClick={() => deleteCategory(cat.id)} title="Удалить">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h2>Услуги</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Название</th>
                <th>Категория</th>
                <th>Цена</th>
                <th>Длительность</th>
                <th>Мест</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {services.map((srv) => (
                <tr key={srv.id}>
                  <td>{srv.nameRu}</td>
                  <td>{srv.category?.nameRu || '—'}</td>
                  <td>{formatPrice(srv.price)}</td>
                  <td>{srv.duration ? `${srv.duration} мин` : '—'}</td>
                  <td>{srv.capacity}</td>
                  <td>
                    <span className={`status ${srv.isActive ? 'active' : 'inactive'}`}>
                      {srv.isActive ? 'Активна' : 'Скрыта'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" onClick={() => openServiceModal(srv)} title="Редактировать">✏️</button>
                      <button className="btn-icon" onClick={() => handleToggleActive('service', srv.id, srv.isActive)} title={srv.isActive ? 'Скрыть' : 'Показать'}>
                        {srv.isActive ? '🙈' : '👁️'}
                      </button>
                      <button className="btn-icon danger" onClick={() => deleteService(srv.id)} title="Удалить">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCategory ? 'Редактировать категорию' : 'Новая категория'}</h3>
            <div className="form-group">
              <label>Slug (URL)</label>
              <input
                type="text"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                placeholder="fitness"
                disabled={!!editingCategory}
              />
            </div>
            <div className="form-group">
              <label>Название (RU) *</label>
              <input
                type="text"
                value={categoryForm.nameRu}
                onChange={(e) => setCategoryForm({ ...categoryForm, nameRu: e.target.value })}
                placeholder="Фитнес"
              />
            </div>
            <div className="form-group">
              <label>Название (UZ)</label>
              <input
                type="text"
                value={categoryForm.nameUz}
                onChange={(e) => setCategoryForm({ ...categoryForm, nameUz: e.target.value })}
                placeholder="Fitnes"
              />
            </div>
            <div className="form-group">
              <label>Иконка (emoji)</label>
              <input
                type="text"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                placeholder="🏋️"
              />
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowCategoryModal(false)}>Отмена</button>
              <button className="btn primary" onClick={saveCategory} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingService ? 'Редактировать услугу' : 'Новая услуга'}</h3>
            <div className="form-group">
              <label>Категория *</label>
              <select
                value={serviceForm.categoryId}
                onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nameRu}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Название (RU) *</label>
              <input
                type="text"
                value={serviceForm.nameRu}
                onChange={(e) => setServiceForm({ ...serviceForm, nameRu: e.target.value })}
                placeholder="Персональная тренировка"
              />
            </div>
            <div className="form-group">
              <label>Название (UZ)</label>
              <input
                type="text"
                value={serviceForm.nameUz}
                onChange={(e) => setServiceForm({ ...serviceForm, nameUz: e.target.value })}
                placeholder="Shaxsiy mashg'ulot"
              />
            </div>
            <div className="form-group">
              <label>Описание (RU)</label>
              <textarea
                value={serviceForm.descriptionRu}
                onChange={(e) => setServiceForm({ ...serviceForm, descriptionRu: e.target.value })}
                placeholder="Индивидуальные занятия с тренером"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Цена (UZS) *</label>
                <input
                  type="number"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  placeholder="150000"
                />
              </div>
              <div className="form-group">
                <label>Длительность (мин)</label>
                <input
                  type="number"
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                  placeholder="60"
                />
              </div>
              <div className="form-group">
                <label>Мест</label>
                <input
                  type="number"
                  value={serviceForm.capacity}
                  onChange={(e) => setServiceForm({ ...serviceForm, capacity: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowServiceModal(false)}>Отмена</button>
              <button className="btn primary" onClick={saveService} disabled={saving}>
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
  .services-page {
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

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn.primary {
    background: #3390ec;
    color: #fff;
  }

  .btn.primary:hover {
    background: #2980d9;
  }

  .btn.primary:disabled {
    background: #a0c4e8;
    cursor: not-allowed;
  }

  .btn.secondary {
    background: #fff;
    color: #333;
    border: 1px solid #ddd;
  }

  .btn.secondary:hover {
    background: #f5f5f5;
  }

  .section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .section h2 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #1a1a2e;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    font-size: 12px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    font-size: 14px;
  }

  code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }

  .status {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .status.active {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .status.inactive {
    background: #fafafa;
    color: #999;
  }

  .actions {
    display: flex;
    gap: 4px;
  }

  .btn-icon {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .btn-icon:hover {
    background: #f0f0f0;
  }

  .btn-icon.danger:hover {
    background: #ffebee;
  }

  .page-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 400px;
    color: #666;
  }

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
    z-index: 1000;
  }

  .modal {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #1a1a2e;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #666;
    margin-bottom: 6px;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #3390ec;
  }

  .form-group input:disabled {
    background: #f5f5f5;
    color: #999;
  }

  .form-group textarea {
    min-height: 80px;
    resize: vertical;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #eee;
  }
`;
