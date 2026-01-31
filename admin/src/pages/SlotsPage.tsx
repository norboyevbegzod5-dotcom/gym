import { useState, useEffect } from 'react';
import { slotsApi, servicesApi } from '../api';

interface Slot {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  specialist: string | null;
  capacity: number;
  bookedCount: number;
  status: string;
  service: {
    id: string;
    nameRu: string;
  };
}

interface Service {
  id: string;
  nameRu: string;
  duration?: number;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Вс' },
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
];

export const SlotsPage = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Single slot modal
  const [showModal, setShowModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    serviceId: '',
    date: selectedDate,
    startTime: '09:00',
    endTime: '10:00',
    specialist: '',
    capacity: 1,
  });

  // Bulk slots modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSlot, setBulkSlot] = useState({
    serviceId: '',
    dateFrom: selectedDate,
    dateTo: '',
    selectedDays: [1, 2, 3, 4, 5] as number[], // Mon-Fri by default
    startTime: '09:00',
    endTime: '21:00',
    slotDuration: 60, // minutes
    specialist: '',
    capacity: 1,
  });
  const [bulkCreating, setBulkCreating] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [slotsRes, servicesRes] = await Promise.all([
        slotsApi.getSlots({ date: selectedDate }),
        servicesApi.getServices(),
      ]);
      setSlots(slotsRes.data);
      setServices(servicesRes.data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Update date when selectedDate changes
  useEffect(() => {
    setNewSlot(prev => ({ ...prev, date: selectedDate }));
    setBulkSlot(prev => ({ ...prev, dateFrom: selectedDate }));
  }, [selectedDate]);

  const handleCreateSlot = async () => {
    try {
      await slotsApi.createSlot(newSlot);
      setShowModal(false);
      setNewSlot({
        serviceId: '',
        date: selectedDate,
        startTime: '09:00',
        endTime: '10:00',
        specialist: '',
        capacity: 1,
      });
      fetchData();
    } catch (err) {
      console.error('Failed to create slot:', err);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Удалить этот слот?')) return;
    try {
      await slotsApi.deleteSlot(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete slot:', err);
    }
  };

  // Generate dates based on range and selected days
  const generateDates = (): string[] => {
    if (!bulkSlot.dateFrom || !bulkSlot.dateTo) return [];
    
    const dates: string[] = [];
    const start = new Date(bulkSlot.dateFrom);
    const end = new Date(bulkSlot.dateTo);
    
    if (start > end) return [];
    
    const current = new Date(start);
    while (current <= end) {
      if (bulkSlot.selectedDays.includes(current.getDay())) {
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // Generate time slots based on start/end time and duration
  const generateTimeSlots = (): { startTime: string; endTime: string }[] => {
    const slots: { startTime: string; endTime: string }[] = [];
    
    const [startHour, startMin] = bulkSlot.startTime.split(':').map(Number);
    const [endHour, endMin] = bulkSlot.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let current = startMinutes;
    while (current + bulkSlot.slotDuration <= endMinutes) {
      const slotStart = current;
      const slotEnd = current + bulkSlot.slotDuration;
      
      slots.push({
        startTime: `${Math.floor(slotStart / 60).toString().padStart(2, '0')}:${(slotStart % 60).toString().padStart(2, '0')}`,
        endTime: `${Math.floor(slotEnd / 60).toString().padStart(2, '0')}:${(slotEnd % 60).toString().padStart(2, '0')}`,
      });
      
      current += bulkSlot.slotDuration;
    }
    
    return slots;
  };

  const getTotalSlotsCount = () => {
    return generateDates().length * generateTimeSlots().length;
  };

  const toggleDay = (day: number) => {
    setBulkSlot(prev => {
      if (prev.selectedDays.includes(day)) {
        return { ...prev, selectedDays: prev.selectedDays.filter(d => d !== day) };
      } else {
        return { ...prev, selectedDays: [...prev.selectedDays, day].sort() };
      }
    });
  };

  const handleBulkCreate = async () => {
    if (!bulkSlot.serviceId || getTotalSlotsCount() === 0) return;
    
    setBulkCreating(true);
    setBulkResult(null);
    
    try {
      const response = await slotsApi.createBulkSlots({
        serviceId: bulkSlot.serviceId,
        dates: generateDates(),
        timeSlots: generateTimeSlots(),
        specialist: bulkSlot.specialist || undefined,
        capacity: bulkSlot.capacity,
      });
      
      setBulkResult(response.data);
      
      // Reset and close after 2 seconds
      setTimeout(() => {
        setShowBulkModal(false);
        setBulkResult(null);
        fetchData();
      }, 2000);
    } catch (err) {
      console.error('Failed to create bulk slots:', err);
    } finally {
      setBulkCreating(false);
    }
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="slots-page">
      <div className="page-header">
        <h1 className="page-title">Расписание</h1>
        <div className="header-actions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
          <button className="btn secondary" onClick={() => setShowModal(true)}>
            + Один слот
          </button>
          <button className="btn primary" onClick={() => setShowBulkModal(true)}>
            📅 Массовое добавление
          </button>
        </div>
      </div>

      <div className="section">
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : slots.length === 0 ? (
          <div className="empty">Нет слотов на эту дату</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Услуга</th>
                  <th>Время</th>
                  <th>Специалист</th>
                  <th>Записи</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id}>
                    <td>{slot.service?.nameRu}</td>
                    <td>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </td>
                    <td>{slot.specialist || '—'}</td>
                    <td>
                      <span className={slot.bookedCount >= slot.capacity ? 'full' : ''}>
                        {slot.bookedCount} / {slot.capacity}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${slot.status.toLowerCase()}`}>
                        {slot.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDeleteSlot(slot.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single slot modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Новый слот</h2>

            <div className="form-group">
              <label>Услуга</label>
              <select
                value={newSlot.serviceId}
                onChange={(e) => setNewSlot({ ...newSlot, serviceId: e.target.value })}
              >
                <option value="">Выберите услугу</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.nameRu}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Дата</label>
                <input
                  type="date"
                  value={newSlot.date}
                  onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Начало</label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Конец</label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Специалист</label>
                <input
                  type="text"
                  value={newSlot.specialist}
                  onChange={(e) => setNewSlot({ ...newSlot, specialist: e.target.value })}
                  placeholder="Имя"
                />
              </div>
              <div className="form-group">
                <label>Мест</label>
                <input
                  type="number"
                  min="1"
                  value={newSlot.capacity}
                  onChange={(e) => setNewSlot({ ...newSlot, capacity: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowModal(false)}>
                Отмена
              </button>
              <button className="btn primary" onClick={handleCreateSlot}>
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk slots modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => !bulkCreating && setShowBulkModal(false)}>
          <div className="modal bulk-modal" onClick={(e) => e.stopPropagation()}>
            <h2>📅 Массовое создание слотов</h2>

            {bulkResult ? (
              <div className="bulk-result">
                <div className="result-icon">✅</div>
                <p>Создано {bulkResult.created} слотов!</p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Услуга *</label>
                  <select
                    value={bulkSlot.serviceId}
                    onChange={(e) => setBulkSlot({ ...bulkSlot, serviceId: e.target.value })}
                  >
                    <option value="">Выберите услугу</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.nameRu}</option>
                    ))}
                  </select>
                </div>

                <div className="form-section">
                  <label className="section-label">Период</label>
                  <div className="form-row">
                    <div className="form-group">
                      <label>С</label>
                      <input
                        type="date"
                        value={bulkSlot.dateFrom}
                        onChange={(e) => setBulkSlot({ ...bulkSlot, dateFrom: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>По</label>
                      <input
                        type="date"
                        value={bulkSlot.dateTo}
                        onChange={(e) => setBulkSlot({ ...bulkSlot, dateTo: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <label className="section-label">Дни недели</label>
                  <div className="days-grid">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        className={`day-btn ${bulkSlot.selectedDays.includes(day.value) ? 'active' : ''}`}
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-section">
                  <label className="section-label">Время работы</label>
                  <div className="form-row">
                    <div className="form-group">
                      <label>С</label>
                      <input
                        type="time"
                        value={bulkSlot.startTime}
                        onChange={(e) => setBulkSlot({ ...bulkSlot, startTime: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>До</label>
                      <input
                        type="time"
                        value={bulkSlot.endTime}
                        onChange={(e) => setBulkSlot({ ...bulkSlot, endTime: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Длительность (мин)</label>
                      <select
                        value={bulkSlot.slotDuration}
                        onChange={(e) => setBulkSlot({ ...bulkSlot, slotDuration: parseInt(e.target.value) })}
                      >
                        <option value={30}>30 мин</option>
                        <option value={45}>45 мин</option>
                        <option value={60}>1 час</option>
                        <option value={90}>1.5 часа</option>
                        <option value={120}>2 часа</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Специалист</label>
                    <input
                      type="text"
                      value={bulkSlot.specialist}
                      onChange={(e) => setBulkSlot({ ...bulkSlot, specialist: e.target.value })}
                      placeholder="Имя (опционально)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Мест</label>
                    <input
                      type="number"
                      min="1"
                      value={bulkSlot.capacity}
                      onChange={(e) => setBulkSlot({ ...bulkSlot, capacity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="preview-box">
                  <div className="preview-title">Превью</div>
                  <div className="preview-stats">
                    <div className="stat">
                      <span className="stat-value">{generateDates().length}</span>
                      <span className="stat-label">дней</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{generateTimeSlots().length}</span>
                      <span className="stat-label">слотов/день</span>
                    </div>
                    <div className="stat total">
                      <span className="stat-value">{getTotalSlotsCount()}</span>
                      <span className="stat-label">всего слотов</span>
                    </div>
                  </div>
                  {generateTimeSlots().length > 0 && (
                    <div className="preview-times">
                      Слоты: {generateTimeSlots().slice(0, 5).map(s => s.startTime).join(', ')}
                      {generateTimeSlots().length > 5 && ` ... и ещё ${generateTimeSlots().length - 5}`}
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn secondary" 
                    onClick={() => setShowBulkModal(false)}
                    disabled={bulkCreating}
                  >
                    Отмена
                  </button>
                  <button 
                    className="btn primary" 
                    onClick={handleBulkCreate}
                    disabled={bulkCreating || !bulkSlot.serviceId || getTotalSlotsCount() === 0}
                  >
                    {bulkCreating ? '⏳ Создание...' : `Создать ${getTotalSlotsCount()} слотов`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .slots-page {
    max-width: 1200px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .date-input {
    padding: 10px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
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
    background: linear-gradient(135deg, #3390ec 0%, #0066cc 100%);
    color: #fff;
  }

  .btn.primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(51, 144, 236, 0.3);
  }

  .btn.secondary {
    background: #f5f5f5;
    color: #333;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .loading, .empty {
    text-align: center;
    padding: 40px;
    color: #666;
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
  }

  .full {
    color: #f44336;
    font-weight: 600;
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

  .status.cancelled {
    background: #ffebee;
    color: #c62828;
  }

  .btn-icon {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
  }

  .btn-icon.danger:hover {
    opacity: 0.7;
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
    padding: 20px;
  }

  .modal {
    background: #fff;
    border-radius: 16px;
    padding: 32px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal.bulk-modal {
    max-width: 600px;
  }

  .modal h2 {
    font-size: 20px;
    margin-bottom: 24px;
    color: #1a1a2e;
  }

  .form-section {
    margin-bottom: 20px;
  }

  .section-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #666;
    margin-bottom: 12px;
    text-transform: uppercase;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
    color: #333;
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

  .form-row {
    display: flex;
    gap: 16px;
  }

  .form-row .form-group {
    flex: 1;
  }

  .days-grid {
    display: flex;
    gap: 8px;
  }

  .day-btn {
    flex: 1;
    padding: 10px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .day-btn.active {
    background: #3390ec;
    border-color: #3390ec;
    color: #fff;
  }

  .day-btn:hover:not(.active) {
    border-color: #3390ec;
    color: #3390ec;
  }

  .preview-box {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .preview-title {
    font-size: 12px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .preview-stats {
    display: flex;
    gap: 20px;
  }

  .stat {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .stat-label {
    font-size: 12px;
    color: #666;
  }

  .stat.total .stat-value {
    color: #3390ec;
  }

  .preview-times {
    margin-top: 12px;
    font-size: 12px;
    color: #666;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .bulk-result {
    text-align: center;
    padding: 40px 20px;
  }

  .result-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .bulk-result p {
    font-size: 18px;
    font-weight: 600;
    color: #2e7d32;
  }
`;
