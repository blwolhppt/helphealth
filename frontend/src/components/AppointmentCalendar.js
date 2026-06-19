import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './AppointmentCalendar.css';

const AppointmentCalendar = () => {
  const { id } = useParams();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const [formData, setFormData] = useState({
    appointment_datetime: ''
  });

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://81.26.183.116:8000/api/appointments/?appointment_patient=${id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) return;
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      console.error('Ошибка загрузки записей:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [id]);

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('accessToken');
      const doctor = JSON.parse(localStorage.getItem('doctor'));
      
      const response = await fetch('http://81.26.183.116:8000/api/appointments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointment_patient: parseInt(id),
          appointment_doctor: doctor.id,
          appointment_datetime: formData.appointment_datetime
        })
      });

      if (response.ok) {
        await fetchAppointments();
        setShowAddModal(false);
        setFormData({ appointment_datetime: '' });
      }
    } catch (err) {
      console.error('Ошибка создания записи:', err);
    }
  };

  const handleDeleteClick = (appointmentId) => {
    setAppointmentToDelete(appointmentId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://81.26.183.116:8000/api/appointments/${appointmentToDelete}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchAppointments();
        setShowDeleteModal(false);
        setAppointmentToDelete(null);
      }
    } catch (err) {
      console.error('Ошибка удаления:', err);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAppointmentToDelete(null);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() || 7;

    const days = [];
    for (let i = 1; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const hasAppointments = (date) => {
    if (!date) return false;
    return appointments.some(app => {
      const appDate = new Date(app.appointment_datetime);
      return appDate.toDateString() === date.toDateString();
    });
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(app => {
      const appDate = new Date(app.appointment_datetime);
      return appDate.toDateString() === date.toDateString();
    }).sort((a, b) => new Date(a.appointment_datetime) - new Date(b.appointment_datetime));
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="appointment-calendar">
      <div className="calendar-header">
        <button 
          className="calendar-nav"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
        >
          ←
        </button>
        <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
        <button 
          className="calendar-nav"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
        >
          →
        </button>
        <button 
          className="add-appointment-btn"
          onClick={() => setShowAddModal(true)}
        >
          Записать
        </button>
      </div>

      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
        
        {getDaysInMonth(currentMonth).map((date, index) => (
          <div 
            key={index}
            className={`calendar-day ${date ? '' : 'empty'} ${hasAppointments(date) ? 'has-appointments' : ''}`}
            onClick={() => date && setSelectedDate(date)}
          >
            {date && (
              <>
                <span className="day-number">{date.getDate()}</span>
                {hasAppointments(date) && <span className="appointments-indicator">●</span>}
              </>
            )}
          </div>
        ))}
      </div>

      {selectedDate && (
        <div className="selected-date-appointments">
          <h4>Записи на {selectedDate.toLocaleDateString('ru-RU')}</h4>
          {getAppointmentsForDate(selectedDate).map(app => (
            <div key={app.id} className="appointment-item">
              <div className="appointment-time">
                {new Date(app.appointment_datetime).toLocaleTimeString('ru-RU', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="appointment-doctor">
                {app.doctor_name}
              </div>
              <button 
                className="delete-appointment-btn"
                onClick={() => handleDeleteClick(app.id)}
              >
                ×
              </button>
            </div>
          ))}
          {getAppointmentsForDate(selectedDate).length === 0 && (
            <div className="no-appointments">Нет записей на этот день</div>
          )}
        </div>
      )}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Запись на приём</h3>
            <form onSubmit={handleAddAppointment}>
              <div className="form-group">
                <label>Дата и время *</label>
                <input
                  type="datetime-local"
                  value={formData.appointment_datetime}
                  onChange={(e) => setFormData({appointment_datetime: e.target.value})}
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="submit-btn">
                  Записать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">Внимание!</div>
            <p>Вы уверены, что хотите удалить эту запись?</p>
            <div className="modal-actions">
              <button 
                type="button"
                className="cancel-btn"
                onClick={handleDeleteCancel}
              >
                Отмена
              </button>
              <button 
                type="button"
                className="delete-btn"
                onClick={handleDeleteConfirm}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;