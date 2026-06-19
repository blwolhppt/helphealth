import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ConfirmEmailPage.css';

const ConfirmEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const hasConfirmed = useRef(false);

  useEffect(() => {
    if (hasConfirmed.current) return;
    hasConfirmed.current = true;

    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Токен не найден в URL');
      return;
    }

    const confirmEmail = async () => {
      try {
        const response = await fetch('http://158.160.158.152:8000/api/doctors/confirm_email/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Ошибка подтверждения');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Ошибка сети');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="confirm-email-container">
      <div className="confirm-email-card">
        {status === 'loading' && (
          <>
            <div className="loading-spinner"></div>
            <h2>Подтверждение email...</h2>
            <p>Пожалуйста, подождите</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="success-icon">✓</div>
            <h2>Email подтвержден!</h2>
            <p>{message}</p>
            <p className="redirect-text">Перенаправление на страницу входа через 3 секунды...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="error-icon">✗</div>
            <h2>Ошибка подтверждения</h2>
            <p>{message}</p>
            <button onClick={() => navigate('/login')} className="back-btn">
              Вернуться на страницу входа
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmailPage;