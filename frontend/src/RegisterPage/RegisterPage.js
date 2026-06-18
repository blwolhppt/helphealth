import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    doctor_email: '',
    doctor_first_name: '',
    doctor_second_name: '',
    doctor_third_name: '',
    doctor_date_of_birth: '',
    doctor_phone_number: '',
    doctor_workplace: '',
    doctor_experience: '',
    doctor_description: '',
    doctor_specialization: []
  });

  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const response = await fetch('http://158.160.158.152:8000/api/specializations/', {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Не удалось загрузить специализации');
        
        const data = await response.json();
        setSpecializations(data);
      } catch (err) {
        console.error('Ошибка загрузки специализаций:', err);
        setError('Не удалось загрузить список специализаций');
      } finally {
        setLoadingSpecs(false);
      }
    };

    fetchSpecializations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Валидация размера (макс 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер файла не должен превышать 5MB');
        return;
      }
      
      // Валидация типа
      if (!file.type.startsWith('image/')) {
        setError('Можно загружать только изображения');
        return;
      }
      
      setError('');
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const handleSpecializationChange = (specId) => {
    setFormData(prev => {
      const currentSpecs = prev.doctor_specialization;
      if (currentSpecs.includes(specId)) {
        return {
          ...prev,
          doctor_specialization: currentSpecs.filter(id => id !== specId)
        };
      } else {
        return {
          ...prev,
          doctor_specialization: [...currentSpecs, specId]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.doctor_specialization.length === 0) {
      setError('Выберите хотя бы одну специализацию');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'doctor_specialization') {
          formData[key].forEach(id => {
            data.append('doctor_specialization', id);
          });
        } else {
          data.append(key, formData[key]);
        }
      });
      
      if (selectedPhoto) {
        data.append('doctor_photo', selectedPhoto);
      }

      const response = await fetch('http://158.160.158.152:8000/api/doctors/', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = Object.values(errorData)
          .flat()
          .join(', ') || 'Ошибка регистрации';
        throw new Error(errorMessage);
      }

      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h2 className="register-title">Регистрация в HealthHelp</h2>
        <p className="register-subtitle"></p>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-section">
            <h3 className="register-section-title">Данные для входа</h3>
            <div className="register-row">
              <div className="register-group">
                <label htmlFor="username">Логин *</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Придумайте логин"
                />
              </div>
            </div>

            <div className="register-row">
              <div className="register-group">
                <label htmlFor="password">Пароль *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Минимум 8 символов"
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <div className="register-section">
            <h3 className="register-section-title">Личная информация</h3>
            
            <div className="register-row">
              <div className="register-group register-full-width">
                <label>Фото профиля</label>
                <div className="register-photo-container">
                  {photoPreview ? (
                    <div className="register-photo-wrapper">
                      <img src={photoPreview} alt="Превью" className="register-photo-preview" />
                      <button 
                        type="button" 
                        className="register-remove-photo"
                        onClick={handleRemovePhoto}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="register-photo-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                      />
                      <div className="register-photo-placeholder">
                        <span className="register-upload-icon">📷</span>
                        <span className="register-upload-text">Загрузить фото</span>
                        <span className="register-upload-hint">JPG, PNG до 5MB</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="register-row">
              <div className="register-group">
                <label htmlFor="doctor_second_name">Фамилия *</label>
                <input
                  id="doctor_second_name"
                  name="doctor_second_name"
                  type="text"
                  value={formData.doctor_second_name}
                  onChange={handleChange}
                  required
                  placeholder="Фамилия"
                />
              </div>

              <div className="register-group">
                <label htmlFor="doctor_first_name">Имя *</label>
                <input
                  id="doctor_first_name"
                  name="doctor_first_name"
                  type="text"
                  value={formData.doctor_first_name}
                  onChange={handleChange}
                  required
                  placeholder="Имя"
                />
              </div>
            </div>

            <div className="register-row">
              <div className="register-group">
                <label htmlFor="doctor_third_name">Отчество</label>
                <input
                  id="doctor_third_name"
                  name="doctor_third_name"
                  type="text"
                  value={formData.doctor_third_name}
                  onChange={handleChange}
                  placeholder="Отчество"
                />
              </div>

              <div className="register-group">
                <label htmlFor="doctor_date_of_birth">Дата рождения *</label>
                <input
                  id="doctor_date_of_birth"
                  name="doctor_date_of_birth"
                  type="date"
                  value={formData.doctor_date_of_birth}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="register-row">
              <div className="register-group">
                <label htmlFor="doctor_email">Email *</label>
                <input
                  id="doctor_email"
                  name="doctor_email"
                  type="email"
                  value={formData.doctor_email}
                  onChange={handleChange}
                  required
                  placeholder="example@yandex.ru"
                />
              </div>

              <div className="register-group">
                <label htmlFor="doctor_phone_number">Телефон *</label>
                <input
                  id="doctor_phone_number"
                  name="doctor_phone_number"
                  type="tel"
                  value={formData.doctor_phone_number}
                  onChange={handleChange}
                  required
                  placeholder="(999) 999-99-99"
                />
              </div>
            </div>
          </div>

          <div className="register-section">
            <h3 className="register-section-title">Профессиональная информация</h3>

            <div className="register-row">
              <div className="register-group register-full-width">
                <label>Специализация *</label>
                {loadingSpecs ? (
                  <div className="register-loading">Загрузка специализаций</div>
                ) : (
                  <div className="register-specs-grid">
                    {specializations.map(spec => (
                      <label key={spec.id} className="register-spec-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.doctor_specialization.includes(spec.id)}
                          onChange={() => handleSpecializationChange(spec.id)}
                        />
                        <span>{spec.specialization_name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {formData.doctor_specialization.length > 0 && (
                  <div className="register-selected-count">
                    Выбрано: {formData.doctor_specialization.length}
                  </div>
                )}
              </div>
            </div>

            <div className="register-row">
              <div className="register-group">
                <label htmlFor="doctor_workplace">Место работы *</label>
                <input
                  id="doctor_workplace"
                  name="doctor_workplace"
                  type="text"
                  value={formData.doctor_workplace}
                  onChange={handleChange}
                  required
                  placeholder="Например: Городская больница №1"
                />
              </div>

              <div className="register-group">
                <label htmlFor="doctor_experience">Опыт работы (лет) *</label>
                <input
                  id="doctor_experience"
                  name="doctor_experience"
                  type="number"
                  value={formData.doctor_experience}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="register-row">
              <div className="register-group register-full-width">
                <label htmlFor="doctor_description">О себе</label>
                <textarea
                  id="doctor_description"
                  name="doctor_description"
                  value={formData.doctor_description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Расскажите о вашей специализации и опыте"
                />
              </div>
            </div>
          </div>

          <div className="register-actions">
            <button 
              type="submit" 
              className="register-submit-btn"
              disabled={loading}
            >
              {loading ? 'Регистрация' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>

        <div className="register-footer">
          <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;