import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { barApi } from '@/shared/lib/api';

interface BarItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string;
  volume: string | null;
  calories: number | null;
  proteins: number | null;
  fats: number | null;
  carbs: number | null;
}

interface BarCategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
  items: BarItem[];
}

interface CartItem {
  item: BarItem;
  quantity: number;
}

export const BarPage = () => {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<BarCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BarItem | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const response = await barApi.getMenu(i18n.language);
        setCategories(response.data);
        if (response.data.length > 0) {
          setActiveCategory(response.data[0].slug);
        }
      } catch (err) {
        console.error('Failed to fetch menu:', err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [i18n.language, t]);

  const scrollToCategory = (slug: string) => {
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    setActiveCategory(slug);
    categoryRefs.current[slug]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const addToCart = (item: BarItem) => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.item.id !== itemId);
    });
  };

  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.find((c) => c.item.id === itemId);
    return cartItem?.quantity || 0;
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, c) => sum + c.quantity, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(price) + ' UZS';
  };

  const handleOrder = async () => {
    if (cart.length === 0) return;

    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    setOrdering(true);

    try {
      const orderItems = cart.map((c) => ({
        itemId: c.item.id,
        quantity: c.quantity,
      }));
      await barApi.createOrder(orderItems);
      
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      setOrderSuccess(true);
      setCart([]);
      setShowCart(false);

      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (err) {
      console.error('Order failed:', err);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="bar-page">
        <h1 className="page-title">{t('bar.title')}</h1>
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
      <div className="bar-page">
        <h1 className="page-title">{t('bar.title')}</h1>
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
    <div className="bar-page">
      <div className="page-header">
        <Link to="/bar/orders" className="my-orders-link">
          {t('bar.myOrders')}
        </Link>
        <h1 className="page-title">{t('bar.menu')}</h1>
      </div>

      {orderSuccess && (
        <div className="success-toast">
          {t('bar.orderSuccess')}
        </div>
      )}

      {/* Category tabs */}
      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            className={`category-tab ${activeCategory === cat.slug ? 'active' : ''}`}
            onClick={() => scrollToCategory(cat.slug)}
          >
            <span className="tab-icon">{cat.icon}</span>
            <span className="tab-name">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Menu items by category */}
      <div className="menu-container">
        {categories.map((category) => (
          <div 
            key={category.slug} 
            className="category-section"
            ref={(el) => { categoryRefs.current[category.slug] = el; }}
          >
            <h2 className="category-title">
              <span className="category-icon">{category.icon}</span>
              {category.name}
            </h2>
            
            <div className="items-grid">
              {category.items.map((item) => {
                const quantity = getCartQuantity(item.id);
                return (
                  <div key={item.id} className="item-card">
                    <div 
                      className="item-image-container"
                      onClick={() => setSelectedItem(item)}
                    >
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="item-image"
                        loading="lazy"
                      />
                      {item.volume && (
                        <span className="item-volume">{item.volume}</span>
                      )}
                    </div>
                    
                    <div className="item-content">
                      <h3 className="item-name">{item.name}</h3>
                      
                      {item.calories && (
                        <div className="item-kbju">
                          <span className="kbju-item cal">{item.calories} ккал</span>
                          {item.proteins && <span className="kbju-item">Б: {item.proteins}г</span>}
                          {item.fats && <span className="kbju-item">Ж: {item.fats}г</span>}
                          {item.carbs && <span className="kbju-item">У: {item.carbs}г</span>}
                        </div>
                      )}
                      
                      <div className="item-footer">
                        <span className="item-price">{formatPrice(item.price)}</span>
                        
                        {quantity > 0 ? (
                          <div className="quantity-controls">
                            <button className="qty-btn" onClick={() => removeFromCart(item.id)}>−</button>
                            <span className="qty-value">{quantity}</span>
                            <button className="qty-btn" onClick={() => addToCart(item)}>+</button>
                          </div>
                        ) : (
                          <button className="add-btn" onClick={() => addToCart(item)}>+</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cart button */}
      {cart.length > 0 && (
        <div className="cart-bar">
          <button className="cart-btn" onClick={() => setShowCart(true)}>
            <span className="cart-info">
              🛒 {t('bar.cart')} ({getTotalItems()})
            </span>
            <span className="cart-total">{formatPrice(getTotalPrice())}</span>
          </button>
        </div>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="modal cart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('bar.cart')}</h2>
              <button className="close-btn" onClick={() => setShowCart(false)}>×</button>
            </div>

            <div className="cart-items">
              {cart.map((cartItem) => (
                <div key={cartItem.item.id} className="cart-item">
                  <img src={cartItem.item.imageUrl} alt="" className="cart-item-image" />
                  <div className="cart-item-info">
                    <span className="cart-item-name">{cartItem.item.name}</span>
                    <span className="cart-item-price">
                      {formatPrice(cartItem.item.price * cartItem.quantity)}
                    </span>
                  </div>
                  <div className="quantity-controls small">
                    <button className="qty-btn" onClick={() => removeFromCart(cartItem.item.id)}>−</button>
                    <span className="qty-value">{cartItem.quantity}</span>
                    <button className="qty-btn" onClick={() => addToCart(cartItem.item)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total-row">
                <span>{t('bar.total')}:</span>
                <span className="total-price">{formatPrice(getTotalPrice())}</span>
              </div>
              <button className="order-btn" onClick={handleOrder} disabled={ordering}>
                {ordering ? t('common.loading') : t('bar.order')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item detail modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal item-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn floating" onClick={() => setSelectedItem(null)}>×</button>
            
            <img src={selectedItem.imageUrl} alt={selectedItem.name} className="detail-image" />
            
            <div className="detail-content">
              <h2 className="detail-name">{selectedItem.name}</h2>
              
              {selectedItem.description && (
                <p className="detail-description">{selectedItem.description}</p>
              )}
              
              {selectedItem.volume && (
                <div className="detail-volume">📦 {selectedItem.volume}</div>
              )}
              
              {selectedItem.calories && (
                <div className="detail-nutrition">
                  <div className="nutrition-item">
                    <span className="nutrition-value">{selectedItem.calories}</span>
                    <span className="nutrition-label">ккал</span>
                  </div>
                  {selectedItem.proteins && (
                    <div className="nutrition-item">
                      <span className="nutrition-value">{selectedItem.proteins}г</span>
                      <span className="nutrition-label">белки</span>
                    </div>
                  )}
                  {selectedItem.fats && (
                    <div className="nutrition-item">
                      <span className="nutrition-value">{selectedItem.fats}г</span>
                      <span className="nutrition-label">жиры</span>
                    </div>
                  )}
                  {selectedItem.carbs && (
                    <div className="nutrition-item">
                      <span className="nutrition-value">{selectedItem.carbs}г</span>
                      <span className="nutrition-label">углеводы</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="detail-footer">
                <span className="detail-price">{formatPrice(selectedItem.price)}</span>
                <button className="add-btn large" onClick={() => { addToCart(selectedItem); setSelectedItem(null); }}>
                  {t('bar.addToCart')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .bar-page {
    padding-bottom: 100px;
    animation: fade-in 0.3s ease-out;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 28px;
    font-weight: 800;
    margin: 0;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .my-orders-link {
    font-size: 13px;
    color: var(--primary);
    font-weight: 700;
    padding: 10px 16px;
    background: rgba(255, 77, 0, 0.15);
    border: 1px solid rgba(255, 77, 0, 0.3);
    border-radius: 12px;
    text-transform: uppercase;
  }

  /* Category tabs - fixed at top when scrolling */
  .category-tabs {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 16px;
    margin-bottom: 8px;
    -webkit-overflow-scrolling: touch;
    background: var(--tg-theme-bg-color, var(--bg-page, #1a1a1a));
  }

  .category-tabs::-webkit-scrollbar {
    display: none;
  }

  .category-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: var(--bg-card);
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.3s;
  }

  .category-tab.active {
    background: rgba(255, 77, 0, 0.15);
    border-color: var(--primary);
  }

  .tab-icon {
    font-size: 18px;
  }

  .tab-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  /* Menu container */
  .menu-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .category-section {
    scroll-margin-top: 20px;
  }

  .category-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0 0 16px 0;
  }

  .category-icon {
    font-size: 24px;
  }

  /* Items grid */
  .items-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .item-card {
    background: var(--bg-card);
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s;
  }

  .item-card:hover {
    border-color: rgba(255, 77, 0, 0.3);
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  }

  .item-image-container {
    position: relative;
    height: 120px;
    cursor: pointer;
  }

  .item-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-volume {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
  }

  .item-content {
    padding: 12px;
  }

  .item-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 6px 0;
    line-height: 1.3;
  }

  .item-kbju {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }

  .kbju-item {
    font-size: 10px;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.05);
    padding: 3px 6px;
    border-radius: 4px;
  }

  .kbju-item.cal {
    background: rgba(255, 77, 0, 0.15);
    color: var(--primary);
    font-weight: 600;
  }

  .item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .item-price {
    font-size: 14px;
    font-weight: 800;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .add-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gradient-fire);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(255, 77, 0, 0.3);
    transition: all 0.3s;
  }

  .add-btn.large {
    width: auto;
    padding: 14px 28px;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .quantity-controls.small {
    gap: 8px;
  }

  .qty-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gradient-fire);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
  }

  .qty-value {
    font-size: 16px;
    font-weight: 700;
    min-width: 20px;
    text-align: center;
    color: var(--text-primary);
  }

  /* Loading & Error */
  .loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
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

  @keyframes spin { to { transform: rotate(360deg); } }

  .retry-btn {
    margin-top: 20px;
    padding: 14px 32px;
    background: var(--gradient-fire);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .success-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--gradient-success);
    color: #000;
    padding: 16px 32px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 700;
    z-index: 1001;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* Cart bar */
  .cart-bar {
    position: fixed;
    bottom: 100px;
    left: 16px;
    right: 16px;
    animation: slide-up 0.3s ease-out;
  }

  .cart-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    background: var(--gradient-fire);
    color: #fff;
    border: none;
    border-radius: 20px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 0 30px rgba(255, 77, 0, 0.4);
  }

  .cart-total {
    font-size: 18px;
    font-weight: 800;
  }

  /* Modals */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: flex-end;
    z-index: 1000;
    animation: fade-in 0.2s ease-out;
  }

  .cart-modal {
    width: 100%;
    max-height: 85vh;
    background: var(--bg-card);
    border: 1px solid rgba(255, 77, 0, 0.2);
    border-bottom: none;
    border-radius: 28px 28px 0 0;
    display: flex;
    flex-direction: column;
    animation: slide-up 0.3s ease-out;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modal-header h2 {
    font-size: 22px;
    font-weight: 800;
    margin: 0;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .close-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 12px;
    font-size: 24px;
    cursor: pointer;
    color: var(--text-secondary);
  }

  .close-btn.floating {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.6);
  }

  .cart-items {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
  }

  .cart-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .cart-item-image {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    object-fit: cover;
  }

  .cart-item-info {
    flex: 1;
  }

  .cart-item-name {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .cart-item-price {
    font-size: 14px;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
  }

  .cart-footer {
    padding: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .cart-total-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    font-size: 18px;
    color: var(--text-primary);
  }

  .total-price {
    font-weight: 800;
    font-size: 24px;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .order-btn {
    width: 100%;
    padding: 18px;
    background: var(--gradient-fire);
    color: #fff;
    border: none;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    box-shadow: 0 0 25px rgba(255, 77, 0, 0.4);
  }

  .order-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Item detail modal */
  .item-modal {
    width: 100%;
    max-height: 90vh;
    background: var(--bg-card);
    border-radius: 28px 28px 0 0;
    overflow: hidden;
    animation: slide-up 0.3s ease-out;
  }

  .detail-image {
    width: 100%;
    height: 220px;
    object-fit: cover;
  }

  .detail-content {
    padding: 24px;
  }

  .detail-name {
    font-size: 24px;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0 0 12px 0;
  }

  .detail-description {
    font-size: 15px;
    color: var(--text-secondary);
    margin: 0 0 16px 0;
    line-height: 1.5;
  }

  .detail-volume {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 20px;
  }

  .detail-nutrition {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
  }

  .nutrition-item {
    flex: 1;
    text-align: center;
  }

  .nutrition-value {
    display: block;
    font-size: 20px;
    font-weight: 800;
    color: var(--primary);
    margin-bottom: 4px;
  }

  .nutrition-label {
    font-size: 11px;
    color: var(--text-secondary);
    text-transform: uppercase;
  }

  .detail-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-price {
    font-size: 28px;
    font-weight: 800;
    background: var(--gradient-fire);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;
