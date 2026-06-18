import React, { useState, useEffect } from 'react';
import './Notification.css';


const NotificationSidebar = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://127.0.0.1:8000/api/notifications/', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error('Ошибка загрузки уведомлений:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://127.0.0.1:8000/api/notifications/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notification_is_read: true })
      });
      
      if (response.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://127.0.0.1:8000/api/notifications/mark_all_read/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.notification_is_read).length;

  return (
    <div className="notification-sidebar">
      <div className="notification-sidebar-header">
        <h3>Уведомления</h3>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={markAllRead}>
            Отметить все
          </button>
        )}
      </div>

      <div className="notification-sidebar-list">
        {loading ? (
          <div className="notification-empty">Загрузка...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">Нет уведомлений</div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`notification-item ${!n.notification_is_read ? 'notification-item--new' : ''}`}
              onClick={() => markAsRead(n.id)}
            >
              <div className="notification-content">
                <div className="notification-message">{n.notification_message}</div>
                <div className="notification-time">{formatDate(n.notification_created_at)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationSidebar;