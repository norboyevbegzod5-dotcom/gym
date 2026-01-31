import { useState, useEffect } from 'react';
import { barItemsApi, barCategoriesApi } from '../api';

interface BarCategory {
  id: string;
  slug: string;
  nameRu: string;
  nameUz: string | null;
  icon: string | null;
  isActive: boolean;
}

interface BarItem {
  id: string;
  categoryId: string;
  category: BarCategory;
  nameRu: string;
  nameUz: string | null;
  descriptionRu: string | null;
  descriptionUz: string | null;
  price: number;
  imageUrl: string | null;
  volume: string | null;
  calories: number | null;
  proteins: number | null;
  fats: number | null;
  carbs: number | null;
  isAvailable: boolean;
}

interface ItemForm {
  categoryId: string;
  nameRu: string;
  nameUz: string;
  descriptionRu: string;
  descriptionUz: string;
  price: string;
  imageUrl: string;
  volume: string;
  calories: string;
  proteins: string;
  fats: string;
  carbs: string;
}

const defaultForm: ItemForm = {
  categoryId: '',
  nameRu: '',
  nameUz: '',
  descriptionRu: '',
  descriptionUz: '',
  price: '',
  imageUrl: '',
  volume: '',
  calories: '',
  proteins: '',
  fats: '',
  carbs: '',
};

export const BarItemsPage = () => {
  const [items, setItems] = useState<BarItem[]>([]);
  const [categories, setCategories] = useState<BarCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BarItem | null>(null);
  const [form, setForm] = useState<ItemForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');

  // Category form
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<BarCategory | null>(null);
  const [catForm, setCatForm] = useState({ slug: '', nameRu: '', nameUz: '', icon: '' });

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        barItemsApi.getAll(),
        barCategoriesApi.getAll(),
      ]);
      setItems(itemsRes.data);
      setCategories(catsRes.data);
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

  // Item handlers
  const openItemModal = (item?: BarItem) => {
    if (item) {
      setEditingItem(item);
      setForm({
        categoryId: item.categoryId,
        nameRu: item.nameRu,
        nameUz: item.nameUz || '',
        descriptionRu: item.descriptionRu || '',
        descriptionUz: item.descriptionUz || '',
        price: item.price.toString(),
        imageUrl: item.imageUrl || '',
        volume: item.volume || '',
        calories: item.calories?.toString() || '',
        proteins: item.proteins?.toString() || '',
        fats: item.fats?.toString() || '',
        carbs: item.carbs?.toString() || '',
      });
    } else {
      setEditingItem(null);
      setForm({ ...defaultForm, categoryId: categories[0]?.id || '' });
    }
    setShowModal(true);
  };

  const saveItem = async () => {
    if (!form.nameRu || !form.price || !form.categoryId) return;
    setSaving(true);

    const data = {
      categoryId: form.categoryId,
      nameRu: form.nameRu,
      nameUz: form.nameUz || undefined,
      descriptionRu: form.descriptionRu || undefined,
      descriptionUz: form.descriptionUz || undefined,
      price: parseFloat(form.price),
      imageUrl: form.imageUrl || undefined,
      volume: form.volume || undefined,
      calories: form.calories ? parseInt(form.calories) : undefined,
      proteins: form.proteins ? parseFloat(form.proteins) : undefined,
      fats: form.fats ? parseFloat(form.fats) : undefined,
      carbs: form.carbs ? parseFloat(form.carbs) : undefined,
    };

    try {
      if (editingItem) {
        await barItemsApi.update(editingItem.id, data);
      } else {
        await barItemsApi.create(data);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save item:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      await barItemsApi.update(id, { isAvailable: !isAvailable });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Удалить товар?')) return;
    try {
      await barItemsApi.delete(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // Category handlers
  const openCatModal = (cat?: BarCategory) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({
        slug: cat.slug,
        nameRu: cat.nameRu,
        nameUz: cat.nameUz || '',
        icon: cat.icon || '',
      });
    } else {
      setEditingCat(null);
      setCatForm({ slug: '', nameRu: '', nameUz: '', icon: '' });
    }
    setShowCatModal(true);
  };

  const saveCat = async () => {
    if (!catForm.nameRu || !catForm.slug) return;
    setSaving(true);
    try {
      if (editingCat) {
        await barCategoriesApi.update(editingCat.id, catForm);
      } else {
        await barCategoriesApi.create(catForm);
      }
      setShowCatModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save category:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteCat = async (id: string) => {
    if (!confirm('Удалить категорию? Все товары этой категории будут удалены!')) return;
    try {
      await barCategoriesApi.delete(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  // Group items by category
  const groupedItems = categories.map((cat) => ({
    category: cat,
    items: items.filter((item) => item.categoryId === cat.id),
  }));

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="bar-items-page">
      <div className="page-header">
        <h1 className="page-title">Меню бара</h1>
        <div className="header-actions">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'items' ? 'active' : ''}`}
              onClick={() => setActiveTab('items')}
            >
              Товары
            </button>
            <button
              className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Категории
            </button>
          </div>
          {activeTab === 'items' ? (
            <button className="btn-add" onClick={() => openItemModal()}>
              + Добавить товар
            </button>
          ) : (
            <button className="btn-add" onClick={() => openCatModal()}>
              + Добавить категорию
            </button>
          )}
        </div>
      </div>

      {activeTab === 'items' ? (
        <div className="items-container">
          {groupedItems.map(({ category, items: catItems }) => (
            <div key={category.id} className="category-group">
              <h2 className="category-header">
                <span>{category.icon} {category.nameRu}</span>
                <span className="item-count">{catItems.length} товаров</span>
              </h2>
              
              <div className="items-grid">
                {catItems.map((item) => (
                  <div key={item.id} className={`item-card ${!item.isAvailable ? 'disabled' : ''}`}>
                    <div className="item-image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.nameRu} />
                      ) : (
                        <div className="no-image">📷</div>
                      )}
                      {item.volume && <span className="volume-badge">{item.volume}</span>}
                    </div>
                    
                    <div className="item-content">
                      <h3 className="item-name">{item.nameRu}</h3>
                      {item.descriptionRu && (
                        <p className="item-desc">{item.descriptionRu}</p>
                      )}
                      
                      {item.calories && (
                        <div className="item-kbju">
                          <span className="kbju cal">{item.calories} ккал</span>
                          {item.proteins && <span className="kbju">Б: {item.proteins}</span>}
                          {item.fats && <span className="kbju">Ж: {item.fats}</span>}
                          {item.carbs && <span className="kbju">У: {item.carbs}</span>}
                        </div>
                      )}
                      
                      <div className="item-footer">
                        <span className="item-price">{formatPrice(item.price)}</span>
                        <div className="item-actions">
                          <button
                            className={`btn-toggle ${item.isAvailable ? 'on' : 'off'}`}
                            onClick={() => toggleAvailability(item.id, item.isAvailable)}
                            title={item.isAvailable ? 'В наличии' : 'Нет в наличии'}
                          >
                            {item.isAvailable ? '✓' : '✕'}
                          </button>
                          <button className="btn-edit" onClick={() => openItemModal(item)}>✏️</button>
                          <button className="btn-delete" onClick={() => deleteItem(item.id)}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="categories-list">
          {categories.map((cat) => (
            <div key={cat.id} className="category-row">
              <span className="cat-icon">{cat.icon}</span>
              <div className="cat-info">
                <span className="cat-name">{cat.nameRu}</span>
                <span className="cat-slug">{cat.slug}</span>
              </div>
              <div className="cat-actions">
                <button className="btn-edit" onClick={() => openCatModal(cat)}>✏️</button>
                <button className="btn-delete" onClick={() => deleteCat(cat.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'Редактировать товар' : 'Добавить товар'}</h3>
            
            <div className="form-grid">
              <div className="form-group full">
                <label>Категория *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.nameRu}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Название (RU) *</label>
                <input
                  type="text"
                  value={form.nameRu}
                  onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
                  placeholder="Протеиновый коктейль"
                />
              </div>

              <div className="form-group">
                <label>Название (UZ)</label>
                <input
                  type="text"
                  value={form.nameUz}
                  onChange={(e) => setForm({ ...form, nameUz: e.target.value })}
                  placeholder="Protein kokteyli"
                />
              </div>

              <div className="form-group full">
                <label>Описание (RU)</label>
                <textarea
                  value={form.descriptionRu}
                  onChange={(e) => setForm({ ...form, descriptionRu: e.target.value })}
                  placeholder="Краткое описание товара"
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Цена (UZS) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="35000"
                />
              </div>

              <div className="form-group">
                <label>Объём</label>
                <input
                  type="text"
                  value={form.volume}
                  onChange={(e) => setForm({ ...form, volume: e.target.value })}
                  placeholder="400 мл"
                />
              </div>

              <div className="form-group full">
                <label>URL картинки</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-section-title">КБЖУ (на порцию)</div>

              <div className="form-group">
                <label>Калории (ккал)</label>
                <input
                  type="number"
                  value={form.calories}
                  onChange={(e) => setForm({ ...form, calories: e.target.value })}
                  placeholder="280"
                />
              </div>

              <div className="form-group">
                <label>Белки (г)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.proteins}
                  onChange={(e) => setForm({ ...form, proteins: e.target.value })}
                  placeholder="30"
                />
              </div>

              <div className="form-group">
                <label>Жиры (г)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.fats}
                  onChange={(e) => setForm({ ...form, fats: e.target.value })}
                  placeholder="5"
                />
              </div>

              <div className="form-group">
                <label>Углеводы (г)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.carbs}
                  onChange={(e) => setForm({ ...form, carbs: e.target.value })}
                  placeholder="25"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Отмена
              </button>
              <button className="btn-save" onClick={saveItem} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal small" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCat ? 'Редактировать категорию' : 'Добавить категорию'}</h3>
            
            <div className="form-group">
              <label>Slug (латиница) *</label>
              <input
                type="text"
                value={catForm.slug}
                onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                placeholder="protein"
                disabled={!!editingCat}
              />
            </div>

            <div className="form-group">
              <label>Название (RU) *</label>
              <input
                type="text"
                value={catForm.nameRu}
                onChange={(e) => setCatForm({ ...catForm, nameRu: e.target.value })}
                placeholder="Протеин"
              />
            </div>

            <div className="form-group">
              <label>Название (UZ)</label>
              <input
                type="text"
                value={catForm.nameUz}
                onChange={(e) => setCatForm({ ...catForm, nameUz: e.target.value })}
                placeholder="Protein"
              />
            </div>

            <div className="form-group">
              <label>Иконка (эмодзи)</label>
              <input
                type="text"
                value={catForm.icon}
                onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                placeholder="💪"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowCatModal(false)}>
                Отмена
              </button>
              <button className="btn-save" onClick={saveCat} disabled={saving}>
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
  .bar-items-page {
    max-width: 1400px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .tabs {
    display: flex;
    background: #f0f0f0;
    border-radius: 8px;
    padding: 4px;
  }

  .tab {
    padding: 8px 16px;
    border: none;
    background: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    color: #666;
  }

  .tab.active {
    background: #fff;
    color: #1a1a2e;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .btn-add {
    padding: 10px 20px;
    background: #3390ec;
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

  /* Categories list */
  .categories-list {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
  }

  .category-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
  }

  .category-row:last-child {
    border-bottom: none;
  }

  .cat-icon {
    font-size: 28px;
  }

  .cat-info {
    flex: 1;
  }

  .cat-name {
    display: block;
    font-weight: 600;
    color: #1a1a2e;
  }

  .cat-slug {
    font-size: 12px;
    color: #999;
  }

  .cat-actions {
    display: flex;
    gap: 8px;
  }

  /* Items */
  .items-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .category-group {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
  }

  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 20px;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }

  .item-count {
    font-size: 14px;
    color: #999;
    font-weight: 400;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .item-card {
    background: #f8f9fa;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .item-card.disabled {
    opacity: 0.5;
  }

  .item-image {
    position: relative;
    height: 140px;
    background: #e9ecef;
  }

  .item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .no-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    color: #ccc;
  }

  .volume-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    background: rgba(0,0,0,0.7);
    color: #fff;
    font-size: 11px;
    border-radius: 4px;
  }

  .item-content {
    padding: 12px;
  }

  .item-name {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 4px 0;
  }

  .item-desc {
    font-size: 12px;
    color: #666;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }

  .item-kbju {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }

  .kbju {
    font-size: 10px;
    padding: 3px 6px;
    background: #e9ecef;
    border-radius: 4px;
    color: #666;
  }

  .kbju.cal {
    background: #fff3cd;
    color: #856404;
  }

  .item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .item-price {
    font-size: 15px;
    font-weight: 700;
    color: #3390ec;
  }

  .item-actions {
    display: flex;
    gap: 4px;
  }

  .item-actions button {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .btn-toggle {
    background: #e9ecef;
  }

  .btn-toggle.on {
    background: #d4edda;
    color: #155724;
  }

  .btn-toggle.off {
    background: #f8d7da;
    color: #721c24;
  }

  .btn-edit {
    background: #e9ecef;
  }

  .btn-delete {
    background: #f8d7da;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
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

  .modal.small {
    max-width: 400px;
  }

  .modal h3 {
    font-size: 20px;
    margin: 0 0 20px 0;
    color: #1a1a2e;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group.full {
    grid-column: 1 / -1;
  }

  .form-section-title {
    grid-column: 1 / -1;
    font-size: 12px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid #eee;
  }

  .form-group label {
    font-size: 13px;
    color: #666;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
  }

  .form-group textarea {
    resize: vertical;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3390ec;
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
    background: #3390ec;
    color: #fff;
  }

  .btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
