import { useState, useEffect } from 'react';
import { clientsApi, broadcastApi } from '../api';

interface Client {
  id: string;
  telegramId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  phone: string | null;
  language: string;
  createdAt: string;
  bookingsCount: number;
  ordersCount: number;
}

export const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [showClientModal, setShowClientModal] = useState<Client | null>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [addClientForm, setAddClientForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [addClientSaving, setAddClientSaving] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeResult, setMergeResult] = useState<{ merged: number; mergedPhones: string[] } | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await clientsApi.getAll(search || undefined);
      setClients(response.data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSearch = () => {
    fetchClients();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleSelectClient = (id: string) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedClients.size === clients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(clients.map(c => c.id)));
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setSending(true);
    setSendResult(null);

    try {
      const userIds = selectedClients.size > 0 
        ? Array.from(selectedClients) 
        : undefined; // undefined means send to all

      const response = await broadcastApi.send(broadcastMessage, userIds);
      setSendResult(response.data);
      setBroadcastMessage('');
      setSelectedClients(new Set());
      
      // Close modal after 3 seconds
      setTimeout(() => {
        setShowBroadcastModal(false);
        setSendResult(null);
      }, 3000);
    } catch (err) {
      console.error('Broadcast failed:', err);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getClientName = (client: Client) => {
    const parts = [client.firstName, client.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Без имени';
  };

  const handleAddClient = async () => {
    if (!addClientForm.firstName.trim()) return;
    setAddClientSaving(true);
    try {
      await clientsApi.create({
        firstName: addClientForm.firstName.trim(),
        lastName: addClientForm.lastName.trim() || undefined,
        phone: addClientForm.phone.trim() || undefined,
      });
      setShowAddClientModal(false);
      setAddClientForm({ firstName: '', lastName: '', phone: '' });
      await fetchClients();
    } catch (err) {
      console.error('Failed to create client:', err);
    } finally {
      setAddClientSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1 className="page-title">Клиентская база</h1>
        <div className="header-stats">
          <span className="stat-item">👥 {clients.length} клиентов</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Поиск по имени, телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="search-btn" onClick={handleSearch}>🔍</button>
        </div>
        
        <div className="actions">
          <button 
            className="btn-add-client"
            onClick={() => setShowAddClientModal(true)}
          >
            ➕ Добавить клиента
          </button>
          <button 
            className="btn-broadcast"
            onClick={() => setShowBroadcastModal(true)}
          >
            📢 Рассылка {selectedClients.size > 0 && `(${selectedClients.size})`}
          </button>
          <button
            className="btn-merge"
            onClick={async () => {
              setMergeLoading(true);
              setMergeResult(null);
              try {
                const res = await clientsApi.mergeDuplicates();
                setMergeResult(res.data);
                await fetchClients();
              } catch (err) {
                console.error('Merge failed:', err);
              } finally {
                setMergeLoading(false);
              }
            }}
            disabled={mergeLoading}
            title="Один номер телефона — один клиент. Объединяет дубликаты."
          >
            {mergeLoading ? '...' : '🔗 Объединить дубликаты по телефону'}
          </button>
        </div>
        {mergeResult && mergeResult.merged > 0 && (
          <div className="merge-result">
            Объединено: {mergeResult.merged} дубликат(ов) по номерам {mergeResult.mergedPhones.join(', ')}.
          </div>
        )}
      </div>

      <div className="clients-table">
        <div className="table-header">
          <div className="col-check">
            <input 
              type="checkbox" 
              checked={selectedClients.size === clients.length && clients.length > 0}
              onChange={selectAll}
            />
          </div>
          <div className="col-name">Клиент</div>
          <div className="col-phone">Телефон</div>
          <div className="col-stats">Записи</div>
          <div className="col-stats">Заказы</div>
          <div className="col-date">Регистрация</div>
        </div>

        <div className="table-body">
          {clients.map((client) => (
            <div 
              key={client.id} 
              className={`table-row ${selectedClients.has(client.id) ? 'selected' : ''}`}
            >
              <div className="col-check">
                <input 
                  type="checkbox" 
                  checked={selectedClients.has(client.id)}
                  onChange={() => toggleSelectClient(client.id)}
                />
              </div>
              <div className="col-name" onClick={() => setShowClientModal(client)}>
                <span className="client-name">{getClientName(client)}</span>
                {client.username && (
                  <span className="client-username">@{client.username}</span>
                )}
              </div>
              <div className="col-phone">
                {client.phone ? (
                  <a href={`tel:${client.phone}`} className="phone-link">
                    📱 {client.phone}
                  </a>
                ) : (
                  <span className="no-phone">—</span>
                )}
              </div>
              <div className="col-stats">
                <span className="stat-badge bookings">{client.bookingsCount}</span>
              </div>
              <div className="col-stats">
                <span className="stat-badge orders">{client.ordersCount}</span>
              </div>
              <div className="col-date">{formatDate(client.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>

      {clients.length === 0 && (
        <div className="empty-state">
          <p>Клиенты не найдены</p>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="modal-overlay" onClick={() => !sending && setShowBroadcastModal(false)}>
          <div className="modal broadcast-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📢 Рассылка сообщений</h3>
            
            {sendResult ? (
              <div className="send-result">
                <div className="result-icon">✅</div>
                <p>Рассылка завершена!</p>
                <div className="result-stats">
                  <span className="success">Отправлено: {sendResult.sent}</span>
                  {sendResult.failed > 0 && (
                    <span className="failed">Ошибок: {sendResult.failed}</span>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="broadcast-info">
                  {selectedClients.size > 0 ? (
                    <p>📤 Сообщение будет отправлено <strong>{selectedClients.size}</strong> выбранным клиентам</p>
                  ) : (
                    <p>📤 Сообщение будет отправлено <strong>всем {clients.length}</strong> клиентам</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Текст сообщения</label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Введите текст сообщения...&#10;&#10;Поддерживается HTML разметка:&#10;<b>жирный</b>, <i>курсив</i>"
                    rows={6}
                  />
                </div>

                <div className="templates">
                  <span className="template-label">Шаблоны:</span>
                  <button 
                    className="template-btn"
                    onClick={() => setBroadcastMessage('🎉 <b>Специальное предложение!</b>\n\nТолько сегодня скидка 20% на все услуги!\n\nЗаписывайтесь прямо сейчас! 💪')}
                  >
                    🎁 Акция
                  </button>
                  <button 
                    className="template-btn"
                    onClick={() => setBroadcastMessage('📢 <b>Важное объявление!</b>\n\nУважаемые клиенты!\n\n[Текст объявления]\n\nС уважением, CentrisFit 🏋️')}
                  >
                    📋 Объявление
                  </button>
                  <button 
                    className="template-btn"
                    onClick={() => setBroadcastMessage('🆕 <b>Новая услуга!</b>\n\nМы рады представить вам [название услуги]!\n\nПодробности в приложении 👇')}
                  >
                    ✨ Новинка
                  </button>
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn-cancel" 
                    onClick={() => setShowBroadcastModal(false)}
                    disabled={sending}
                  >
                    Отмена
                  </button>
                  <button 
                    className="btn-send" 
                    onClick={handleSendBroadcast}
                    disabled={sending || !broadcastMessage.trim()}
                  >
                    {sending ? '⏳ Отправка...' : '📤 Отправить'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="modal-overlay" onClick={() => !addClientSaving && setShowAddClientModal(false)}>
          <div className="modal add-client-modal" onClick={(e) => e.stopPropagation()}>
            <h3>➕ Добавить клиента</h3>
            <p className="modal-hint">Клиент будет добавлен без Telegram. Его можно будет назначать абонементы.</p>
            <div className="form-group">
              <label>Имя *</label>
              <input
                type="text"
                placeholder="Иван"
                value={addClientForm.firstName}
                onChange={(e) => setAddClientForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Фамилия</label>
              <input
                type="text"
                placeholder="Иванов"
                value={addClientForm.lastName}
                onChange={(e) => setAddClientForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Телефон</label>
              <input
                type="tel"
                placeholder="+998 90 123 45 67"
                value={addClientForm.phone}
                onChange={(e) => setAddClientForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddClientModal(false)} disabled={addClientSaving}>
                Отмена
              </button>
              <button 
                className="btn-save" 
                onClick={handleAddClient} 
                disabled={addClientSaving || !addClientForm.firstName.trim()}
              >
                {addClientSaving ? 'Сохранение...' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {showClientModal && (
        <div className="modal-overlay" onClick={() => setShowClientModal(null)}>
          <div className="modal client-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 {getClientName(showClientModal)}</h3>
              <button className="close-btn" onClick={() => setShowClientModal(null)}>×</button>
            </div>
            
            <div className="client-details">
              <div className="detail-row">
                <span className="label">Telegram ID:</span>
                <span className="value">{showClientModal.telegramId}</span>
              </div>
              {showClientModal.username && (
                <div className="detail-row">
                  <span className="label">Username:</span>
                  <span className="value">@{showClientModal.username}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="label">Телефон:</span>
                <span className="value">
                  {showClientModal.phone || 'Не указан'}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Язык:</span>
                <span className="value">{showClientModal.language.toUpperCase()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Записей:</span>
                <span className="value">{showClientModal.bookingsCount}</span>
              </div>
              <div className="detail-row">
                <span className="label">Заказов бара:</span>
                <span className="value">{showClientModal.ordersCount}</span>
              </div>
              <div className="detail-row">
                <span className="label">Дата регистрации:</span>
                <span className="value">{formatDate(showClientModal.createdAt)}</span>
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
  .clients-page {
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

  .header-stats {
    display: flex;
    gap: 16px;
  }

  .stat-item {
    padding: 8px 16px;
    background: #f0f0f0;
    border-radius: 8px;
    font-size: 14px;
    color: #666;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;
    flex-wrap: wrap;
  }

  .search-box {
    display: flex;
    gap: 8px;
    flex: 1;
    max-width: 400px;
  }

  .search-box input {
    flex: 1;
    padding: 10px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
  }

  .search-box input:focus {
    outline: none;
    border-color: #3390ec;
  }

  .search-btn {
    padding: 10px 16px;
    background: #3390ec;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  .btn-broadcast {
    padding: 10px 20px;
    background: linear-gradient(135deg, #3390ec 0%, #0066cc 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-broadcast:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(51, 144, 236, 0.3);
  }

  .btn-add-client {
    padding: 10px 20px;
    background: #2e7d32;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-add-client:hover {
    background: #1b5e20;
  }

  .btn-merge {
    padding: 10px 20px;
    background: #5c6bc0;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-merge:hover:not(:disabled) {
    background: #3f51b5;
  }

  .btn-merge:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .merge-result {
    margin-top: 12px;
    padding: 12px 16px;
    background: #e8f5e9;
    color: #2e7d32;
    border-radius: 8px;
    font-size: 14px;
  }

  .actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  /* Table */
  .clients-table {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  .table-header {
    display: grid;
    grid-template-columns: 40px 1fr 150px 80px 80px 120px;
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
    grid-template-columns: 40px 1fr 150px 80px 80px 120px;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
    align-items: center;
    transition: background 0.2s;
  }

  .table-row:hover {
    background: #f8f9fa;
  }

  .table-row.selected {
    background: #e8f4ff;
  }

  .col-check input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .col-name {
    cursor: pointer;
  }

  .client-name {
    display: block;
    font-weight: 600;
    color: #1a1a2e;
  }

  .client-username {
    font-size: 12px;
    color: #999;
  }

  .phone-link {
    color: #3390ec;
    text-decoration: none;
  }

  .no-phone {
    color: #ccc;
  }

  .stat-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
  }

  .stat-badge.bookings {
    background: #d4edda;
    color: #155724;
  }

  .stat-badge.orders {
    background: #fff3cd;
    color: #856404;
  }

  .col-date {
    font-size: 13px;
    color: #666;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #999;
  }

  /* Modals */
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
    max-width: 500px;
  }

  .modal h3 {
    font-size: 20px;
    margin: 0 0 20px 0;
    color: #1a1a2e;
  }

  .broadcast-info {
    padding: 16px;
    background: #e8f4ff;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .broadcast-info p {
    margin: 0;
    font-size: 14px;
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

  .form-group textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    resize: vertical;
    font-family: inherit;
  }

  .form-group textarea:focus {
    outline: none;
    border-color: #3390ec;
  }

  .form-group input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
  }

  .form-group input:focus {
    outline: none;
    border-color: #3390ec;
  }

  .modal-hint {
    font-size: 13px;
    color: #666;
    margin: 0 0 20px 0;
  }

  .add-client-modal .btn-save {
    flex: 1;
    padding: 12px;
    background: #2e7d32;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .add-client-modal .btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .templates {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 20px;
  }

  .template-label {
    font-size: 12px;
    color: #999;
  }

  .template-btn {
    padding: 6px 12px;
    background: #f0f0f0;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .template-btn:hover {
    background: #e0e0e0;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
  }

  .btn-cancel, .btn-send {
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

  .btn-send {
    background: linear-gradient(135deg, #3390ec 0%, #0066cc 100%);
    color: #fff;
  }

  .btn-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .send-result {
    text-align: center;
    padding: 40px 20px;
  }

  .result-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .send-result p {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px 0;
  }

  .result-stats {
    display: flex;
    justify-content: center;
    gap: 20px;
  }

  .result-stats .success {
    color: #155724;
  }

  .result-stats .failed {
    color: #721c24;
  }

  /* Client Modal */
  .client-modal {
    max-width: 400px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .modal-header h3 {
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: #f0f0f0;
    border-radius: 8px;
    font-size: 20px;
    cursor: pointer;
    color: #666;
  }

  .client-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .detail-row .label {
    color: #666;
    font-size: 13px;
  }

  .detail-row .value {
    font-weight: 500;
    color: #1a1a2e;
  }
`;
