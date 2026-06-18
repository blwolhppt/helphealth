import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Patients.css';
import Notification from '../components/Notification';

function Patients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorName, setDoctorName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignMessage, setAssignMessage] = useState(null);
  
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('doctor');
    navigate('/login');
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://158.160.158.152:8000/api/assignments/', {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      const formattedPatients = data.map((assignment) => ({
        id: assignment.id,
        patient_id: assignment.assignment_patient.id,
        name: `${assignment.assignment_patient.patient_second_name} ${assignment.assignment_patient.patient_first_name} ${assignment.assignment_patient.patient_third_name || ''}`.trim(),
        diagnosis: assignment.assignment_patient.patient_diagnosis
          .map(d => d.chronic_diseas_name)
          .join(', ') || 'Нет диагноза',
        status: assignment.assignment_status
      }));

      setPatients(formattedPatients);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError(err.message);
    }
  };

  const handleAssignByCode = async (e) => {
    e.preventDefault();
    
    if (inviteCode.length !== 6) {
      setAssignMessage({ type: 'error', text: 'Код должен содержать ровно 6 цифр' });
      return;
    }

    setAssignLoading(true);
    setAssignMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://158.160.158.152:8000/api/doctors/assign_patient/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: inviteCode })
      });

      const data = await response.json();

      if (response.ok) {
        setAssignMessage({ 
          type: 'success', 
          text: `Пациент ${data.patient_name} успешно привязан!` 
        });
        setInviteCode('');
        await fetchPatients();
      } else {
        setAssignMessage({ 
          type: 'error', 
          text: `❌ ${data.error || data.message || 'Ошибка привязки'}` 
        });
      }
    } catch (err) {
      setAssignMessage({ 
        type: 'error', 
        text: `❌ Ошибка сети: ${err.message}` 
      });
    } finally {
      setAssignLoading(false);
      setTimeout(() => setAssignMessage(null), 5000);
    }
  };

  useEffect(() => {
    const doctor = JSON.parse(localStorage.getItem('doctor'));
    if (doctor) {
      const firstNameInitial = doctor.first_name ? doctor.first_name[0] + '.' : '';
      const thirdNameInitial = doctor.third_name ? doctor.third_name[0] + '.' : '';
      const fullName = `${doctor.second_name} ${firstNameInitial}${thirdNameInitial}`.trim();
      setDoctorName(fullName);
    }

    fetchPatients().finally(() => setLoading(false));
  }, []);

  const handleArchiveToggle = async (assignmentId, currentStatus) => {
    try {
      const token = localStorage.getItem('accessToken');
      const newStatus = currentStatus === 'Active' ? 'Archived' : 'Active';
      
      const response = await fetch(`http://158.160.158.152:8000/api/assignments/${assignmentId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignment_status: newStatus
        })
      });

      if (!response.ok) throw new Error('Ошибка изменения статуса');
      setPatients(prev => prev.map(p => 
        p.id === assignmentId ? { ...p, status: newStatus } : p
      ));
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Не удалось изменить статус');
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePatients = filteredPatients.filter(p => p.status === 'Active');
  const archivedPatients = filteredPatients.filter(p => p.status === 'Archived');

  const handlePatientClick = (patientId) => {
    navigate(`/patient/${patientId}`);
  };

  const PatientCard = ({ patient }) => {
    const isArchived = patient.status === 'Archived';
    
    return (
      <div 
        className={`patient-card ${isArchived ? 'patient-card--archived' : ''}`}
        onClick={() => handlePatientClick(patient.patient_id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handlePatientClick(patient.patient_id)}
      >
        <div className="patient-card-content">
          <div className="patient-name">{patient.name}</div>
          <div className="patient-diagnosis">{patient.diagnosis}</div>
        </div>

        <button 
          className="archive-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleArchiveToggle(patient.id, patient.status);
          }}
          title={isArchived ? 'Разархивировать' : 'Архивировать'}
        >
          {isArchived ? 'Разархивировать' : 'Архивировать'}
        </button>
      </div>
    );
  };

  if (loading) return <div className="container"><div className="loading"></div></div>;
  if (error) return <div className="container"><div className="error">Ошибка: {error}</div></div>;

  return (
  <div className="container">
    <div className="notifications-fixed">
      <Notification />
    </div>
    <div className="main-content">
      <div className="header">
        <h1>Мои пациенты</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="user-badge-btn"
            onClick={() => navigate('/profile')}
          >
            {doctorName || ''}
          </button>
          <button 
            onClick={handleLogout}
            className="logout-btn"
          >
            Выход
          </button>
        </div>
      </div>

      <div className="assign-by-code-block">
        <label className="assign-label">Привязать пациента по коду:</label>
        <form onSubmit={handleAssignByCode} className="assign-form-compact">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setInviteCode(value);
            }}
            placeholder="000000"
            className="assign-input-compact"
            maxLength={6}
            disabled={assignLoading}
          />
          <button 
            type="submit" 
            className="assign-btn-compact"
            disabled={assignLoading || inviteCode.length !== 6}
          >
            {assignLoading ? '' : 'Привязать'}
          </button>
        </form>
      </div>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="Поиск..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button className="search-btn">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#2A9D8F"/>
          </svg>
        </button>
      </div>

      <div className="patients-list">
        {activePatients.length > 0 && (
          <div className="patients-section">
            <h2 className="section-header">Активные пациенты ({activePatients.length})</h2>
            {activePatients.map(patient => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        )}

        {archivedPatients.length > 0 && (
          <div className="patients-section">
            <h2 className="section-header">Архив ({archivedPatients.length})</h2>
            {archivedPatients.map(patient => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        )}

        {filteredPatients.length === 0 && (
          <div className="no-patients">Пациенты не найдены</div>
        )}
      </div>
    </div>
  </div>
);
}

export default Patients;