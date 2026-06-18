import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const storedDoctor = JSON.parse(localStorage.getItem('doctor'));
        
        if (!storedDoctor || !storedDoctor.id) {
          throw new Error('Данные врача не найдены. Войдите в систему снова.');
        }

        const response = await fetch(`http://158.160.158.152:8000/api/doctors/${storedDoctor.id}/`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 404) {
          throw new Error('Профиль не найден в базе данных');
        }
        if (response.status === 403) {
          throw new Error('Нет доступа к профилю');
        }
        if (!response.ok) {
          throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const doctorData = await response.json();
        console.log('Полученные данные врача:', doctorData);
        
        setDoctor(doctorData);
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, []);

  if (loading) return <div className="profile-page"><div className="loading"></div></div>;
  if (error) return <div className="profile-page"><div className="error">Ошибка: {error}</div></div>;
  if (!doctor) return <div className="profile-page"><div className="error">Данные не найдены</div></div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>← Назад</button>
          <h1 className="profile-title">Профиль врача</h1>
        </div>
        <div className="profile-section">
          <h2 className="section-title">Фото профиля</h2>
          <div className="photo-container">
            {doctor.doctor_photo ? (
              <img 
                src={doctor.doctor_photo} 
                alt="Фото врача" 
                className="photo-preview" 
              />
            ) : (
              <div className="photo-placeholder">Нет фото</div>
            )}
          </div>
        </div>
        <div className="profile-section">
          <h2 className="section-title">Личные данные</h2>
          
          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Фамилия</span>
              <span className="info-value">{doctor.doctor_second_name || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Имя</span>
              <span className="info-value">{doctor.doctor_first_name || '—'}</span>
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Отчество</span>
              <span className="info-value">{doctor.doctor_third_name || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Логин</span>
              <span className="info-value">{doctor.username || '—'}</span>
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{doctor.doctor_email || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Телефон</span>
              <span className="info-value">{doctor.doctor_phone_number || '—'}</span>
            </div>
          </div>
        </div>
        <div className="profile-section">
          <h2 className="section-title">Профессиональная информация</h2>
          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Место работы</span>
              <span className="info-value">{doctor.doctor_workplace || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Опыт работы</span>
              <span className="info-value">
                {doctor.doctor_experience !== null && doctor.doctor_experience !== undefined 
                  ? `${doctor.doctor_experience} лет` 
                  : '—'}
              </span>
            </div>
          </div>
          {doctor.doctor_description && (
            <div className="info-item full-width">
              <span className="info-label">О себе</span>
              <span className="info-value">{doctor.doctor_description}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;