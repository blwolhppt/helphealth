import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PatientPage.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { ru } from 'date-fns/locale';
import AppointmentCalendar from '../components/AppointmentCalendar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

const PatientPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('devices');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [diaryData, setDiaryData] = useState([]);
  const [documentsData, setDocumentsData] = useState([]);
  const [recordsData, setRecordsData] = useState([]);
  const [analyzesData, setAnalyzesData] = useState([]);
  const [devicesData, setDevicesData] = useState([]);
  const [analysisNotes, setAnalysisNotes] = useState([]);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [docDateFrom, setDocDateFrom] = useState('');
  const [docDateTo, setDocDateTo] = useState('');
  const [docType, setDocType] = useState('');
  const [recordDateFrom, setRecordDateFrom] = useState('');
  const [recordDateTo, setRecordDateTo] = useState('');
  const [deviceDateFrom, setDeviceDateFrom] = useState('');
  const [deviceDateTo, setDeviceDateTo] = useState('');
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [newRecordDescription, setNewRecordDescription] = useState('');
  const [newRecordReason, setNewRecordReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Динамика показателя',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} ${context.dataset.unit || ''}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Дата'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: false
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Значение'
        },
        beginAtZero: false
      }
    }
  };

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`http://81.26.183.116:8000/api/patients/${id}/`, {
            headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
        });
        if (!response.ok) {
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }

        const data = await response.json();

        setPatient({
          id: data.id,
          name: `${data.patient_second_name} ${data.patient_first_name} ${data.patient_third_name || ''}`.trim(),
          birthDate: data.patient_date_of_birth 
            ? new Date(data.patient_date_of_birth).toLocaleDateString('ru-RU') 
            : '',
          diagnosis: Array.isArray(data.patient_diagnosis) 
            ? data.patient_diagnosis.map(d => d.chronic_diseas_name).join(', ') 
            : 'Нет диагноза',
          photo: data.patient_photo,
          phone: data.patient_phone_number,
          email: data.patient_email,
          lastUpdate: data.patient_last_update 
            ? new Date(data.patient_last_update).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })
            : '-',
          rawData: data
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки пациента:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  useEffect(() => {
    if (!id || !patient) return;
    
    switch (activeTab) {
      case 'devices':
        fetchDevicesData(id, deviceDateFrom, deviceDateTo);
        break;
      case 'diary':
        fetchDiaryData(id, dateFrom, dateTo);
        break;
      case 'analysis': 
        fetchAnalysisNotes(id);
        break;
      case 'documents':
        fetchDocumentsData(id, docDateFrom, docDateTo, docType);
        break;
      case 'records':
        fetchRecordsData(id);
        break;
      default:
        break;
    }
  }, [activeTab, id, patient, dateFrom, dateTo, docType, docDateFrom, docDateTo, deviceDateFrom, deviceDateTo]);

  const fetchDiaryData = async (patientId, fromDate = '', toDate = '') => {
    try {
      let url = `http://81.26.183.116:8000/api/diaries/?diary_patient=${patientId}`;
      if (fromDate) url += `&diary_date_after=${fromDate}`;
      if (toDate) url += `&diary_date_before=${toDate}`;

      const response = await fetch(url, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }

      const data = await response.json();

      const formatted = data.map(item => ({
        date: new Date(item.diary_date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        wellbeing: item.diary_health,
        workability: item.diary_efficiency,
        sleep: item.diary_sleep,
        appetite: item.diary_appetite,
        mood: item.diary_mood,
        timestamp: new Date(item.diary_date).getTime()
      }));
      
      formatted.sort((a, b) => b.timestamp - a.timestamp);
      
      setDiaryData(formatted);
    } catch (err) {
      console.error('Ошибка загрузки дневника:', err);
      setDiaryData([]);
    }
  };

      const fetchDocumentsData = async (patientId, fromDate = '', toDate = '', type = '') => {
    try {
      let url = `http://81.26.183.116:8000/api/documents/?document_patient=${patientId}`;
      if (fromDate) url += `&document_date_after=${fromDate}`;
      if (toDate) url += `&document_date_before=${toDate}`;
      if (type) url += `&document_type=${type}`;

      const response = await fetch(url, {
        headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }

      const data = await response.json();

      const formatted = data.map(item => ({
        id: item.id,
        date: new Date(item.document_date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        type: item.document_type,
        name: item.document_name,
        file: item.document_file,
        timestamp: new Date(item.document_date).getTime()
      }));
      
      formatted.sort((a, b) => b.timestamp - a.timestamp);
      
      setDocumentsData(formatted);
    } catch (err) {
      console.error('Ошибка загрузки документов:', err);
      setDocumentsData([]);
    }
  };

  const fetchAnalysisNotes = async (patientId) => {
    try {
      const response = await fetch(
        `http://81.26.183.116:8000/api/analysisnotes/?notes_patient=${patientId}`,
        { headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }, }
      );
      
      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      
      const data = await response.json();
      setAnalysisNotes(data);

      setSelectedIndicator(null);
      setChartData(null);
      
    } catch (err) {
      console.error('Ошибка загрузки данных анализов:', err);
      setAnalysisNotes([]);
      setSelectedIndicator(null);
      setChartData(null);
    }
  };

  const fetchRecordsData = async (patientId, fromDate = '', toDate = '') => {
    try {
      let url = `http://81.26.183.116:8000/api/notes/?note_patient=${patientId}`;
      if (fromDate) url += `&note_date_after=${fromDate}`;
      if (toDate) url += `&note_date_before=${toDate}`;

      const response = await fetch(url, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }

      const data = await response.json();

      const formatted = data.map(item => ({
        id: item.id,
        date: new Date(item.note_date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        record: item.note_description || '',
        reason: item.note_reason || '',
        timestamp: new Date(item.note_date).getTime()
      }));
      
      formatted.sort((a, b) => b.timestamp - a.timestamp);
      
      setRecordsData(formatted);
    } catch (err) {
      console.error('Ошибка загрузки записей:', err);
      setRecordsData([]);
    }
  };

  const handleCreateRecord = async () => {
    if (!newRecordDescription.trim()) {
      alert('Пожалуйста, заполните описание записи');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        note_patient: parseInt(id),
        note_doctor: 1,
        note_description: newRecordDescription.trim(),
        note_reason: newRecordReason.trim()
      };
      const response = await fetch('http://81.26.183.116:8000/api/notes/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          note_patient: parseInt(id),
          note_description: newRecordDescription,
          note_reason: newRecordReason
  })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.note_description 
          ? `Ошибка в описании: ${errorData.note_description.join(', ')}`
          : errorData.note_patient
          ? `Ошибка в пациенте: ${errorData.note_patient.join(', ')}`
          : errorData.note_doctor
          ? `Ошибка во враче: ${errorData.note_doctor.join(', ')}`
          : errorData.detail || errorData.error || `Ошибка: ${response.status}`;
        throw new Error(errorMessage);
      }
      setShowAddRecordModal(false);
      setNewRecordDescription('');
      setNewRecordReason('');
      fetchRecordsData(id, recordDateFrom, recordDateTo);
    } catch (err) {
      alert(`Не удалось создать запись: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const fetchDevicesData = async (patientId, fromDate = '', toDate = '') => {
    try {
      let url = `http://81.26.183.116:8000/api/devicedata/?devicedata_patient=${patientId}`;
      if (fromDate) url += `&devicedata_date_after=${fromDate}`;
      if (toDate) url += `&devicedata_date_before=${toDate}`;

      const response = await fetch(url, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }

      const data = await response.json();

      const formatted = data.map(item => ({
        id: item.id,
        date: new Date(item.devicedata_date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        steps: item.devicedata_steps,
        pulse: item.devicedata_pulse,
        temperature: item.devicedata_temperature,
        spo2: item.devicedata_spo2,
        sleepTime: item.devicedata_sleep_time,
        sleepScore: item.devicedata_sleep_score,
        stress: item.devicedata_stress,
        timestamp: new Date(item.devicedata_date).getTime()
      }));
      
      formatted.sort((a, b) => b.timestamp - a.timestamp);
      
      setDevicesData(formatted);
    } catch (err) {
      console.error('Ошибка загрузки данных с устройств:', err);
      setDevicesData([]);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const tabs = [
    { id: 'devices', label: 'Данные с устройств' },
    { id: 'diary', label: 'Дневник' },
    { id: 'analysis', label: 'Анализы' },
    { id: 'documents', label: 'Документы' },
    { id: 'records', label: 'Записи' },
  ];

  const prepareChartData = (data, indicatorName) => {
    if (!data || !indicatorName) {
      setChartData(null);
      return;
    }

    const indicatorData = data
      .filter(item => item.notes_indicators.analysis_indicators_name === indicatorName)
      .map(item => ({
        date: new Date(item.notes_date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        value: item.notes_value,
        unit: item.notes_measure
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split('.').reverse().join('-'));
        const dateB = new Date(b.date.split('.').reverse().join('-'));
        return dateA - dateB;
      });

    if (indicatorData.length === 0) {
      setChartData(null);
      return;
    }

    const unit = indicatorData[0].unit || '';
    const color = 'rgb(53, 162, 235)';

    setChartData({
      labels: indicatorData.map(item => item.date),
      datasets: [{
        label: indicatorName,
        data: indicatorData.map(item => item.value),
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        fill: true,
        tension: 0.3,
        unit: unit,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    });
  };

  const handleIndicatorClick = (indicatorName) => {
    if (selectedIndicator === indicatorName) {
      setSelectedIndicator(null);
      setChartData(null);
    } else {
      setSelectedIndicator(indicatorName);
      prepareChartData(analysisNotes, indicatorName);
    }
  };

  const handleClearChart = () => {
    setSelectedIndicator(null);
    setChartData(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'devices':
        return (
          <div>
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              marginBottom: '20px', 
              padding: '15px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#264653' }}>С:</label>
                <input
                  type="date"
                  value={deviceDateFrom}
                  onChange={(e) => setDeviceDateFrom(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #2A9D8F',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
                
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#264653' }}>По:</label>
                <input
                  type="date"
                  value={deviceDateTo}
                  onChange={(e) => setDeviceDateTo(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #2A9D8F',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
                
              <button
                onClick={() => {
                  setDeviceDateFrom('');
                  setDeviceDateTo('');
                  fetchDevicesData(id, '', '');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e65c5c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginLeft: 'auto'
                }}
              >
                Сбросить фильтры
              </button>
            </div>
              
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Шаги</th>
                    <th>Пульс</th>
                    <th>Температура</th>
                    <th>SpO₂</th>
                    <th>Сон</th>
                    <th>Качество сна</th>
                    <th>Стресс</th>
                  </tr>
                </thead>
                <tbody>
                  {devicesData.length === 0 ? (
                    <tr><td colSpan="8" className="empty-row">Нет данных</td></tr>
                  ) : (
                    devicesData.map((row, i) => (
                      <tr key={row.id || i} className={i % 2 === 0 ? 'row-alt' : ''}>
                        <td className="date-cell">{row.date}</td>
                        <td className="center">{row.steps}</td>
                        <td className="center">{row.pulse}</td>
                        <td className="center">{row.temperature}°C</td>
                        <td className="center">{row.spo2}%</td>
                        <td className="center">{row.sleepTime}</td>
                        <td className="center">{row.sleepScore}</td>
                        <td className="center">{row.stress}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'diary':
        return (
          <div>
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              marginBottom: '20px', 
              padding: '15px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#264653' }}>С:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #2A9D8F',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
                
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#264653' }}>По:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #2A9D8F',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
                
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  fetchDiaryData(id, '', '');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e65c5c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginLeft: 'auto'
                }}
              >
                Сбросить фильтры
              </button>
            </div>
              
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Самоочувствие</th>
                    <th>Работоспособность</th>
                    <th>Сон</th>
                    <th>Аппетит</th>
                    <th>Настроение</th>
                  </tr>
                </thead>
                <tbody>
                  {diaryData.length === 0 ? (
                    <tr><td colSpan="6" className="empty-row"></td></tr>
                  ) : (
                    diaryData.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'row-alt' : ''}>
                        <td className="date-cell">{row.date}</td>
                        <td className="center">{row.wellbeing}</td>
                        <td className="center">{row.workability}</td>
                        <td className="center">{row.sleep}</td>
                        <td className="center">{row.appetite}</td>
                        <td className="center">{row.mood}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div>
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              marginBottom: '20px', 
              padding: '15px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#264653' }}>С:</label>
                <input
                  type="date"
                  value={docDateFrom}
                  onChange={(e) => setDocDateFrom(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #2A9D8F',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
                
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#264653' }}>По:</label>
                <input
                  type="date"
                  value={docDateTo}
                  onChange={(e) => setDocDateTo(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #2A9D8F',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
                
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#264653' }}>Тип:</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #2A9D8F',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    minWidth: '150px'
                  }}
                >
                  <option value="Analyzes">Анализы</option>
                  <option value="ResuReportlts">Заключение врача</option>
                  <option value="Results">Результаты обследований</option>
                  <option value="Other">Прочее</option>
                  <option value="">Все</option>
                </select>
              </div>
                
              <button
                onClick={() => {
                  setDocDateFrom('');
                  setDocDateTo('');
                  setDocType('');
                  fetchDocumentsData(id, '', '', '');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e65c5c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginLeft: 'auto'
                }}
              >
                Сбросить фильтры
              </button>
            </div>
              
            <div className="table-wrapper documents-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Тип документа</th>
                    <th>Название</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {documentsData.length === 0 ? (
                    <tr><td colSpan="4" className="empty-row"></td></tr>
                  ) : (
                    documentsData.map((row) => (
                      <tr key={row.id} className="row-alt">
                        <td className="date-cell">{row.date}</td>
                        <td>{row.type}</td>
                        <td title={row.name}>{row.name}</td>
                        <td className="actions-cell">
                          <span 
                            className="action-icon" 
                            title="Просмотр"
                            onClick={() => window.open(row.file, '_blank')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && window.open(row.file, '_blank')}
                          >
                            👁
                          </span>
                          <span 
                            className="action-icon" 
                            title="Скачать"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = row.file;
                              link.download = row.name || 'document';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const link = document.createElement('a');
                                link.href = row.file;
                                link.download = row.name || 'document';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            }}
                          >
                            ⬇
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'records':
        return (
          <div>
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              marginBottom: '20px', 
              padding: '15px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#264653' }}>С:</label>
                <input
                  type="date"
                  value={recordDateFrom}
                  onChange={(e) => setRecordDateFrom(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #2A9D8F',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
                
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#264653' }}>По:</label>
                <input
                  type="date"
                  value={recordDateTo}
                  onChange={(e) => setRecordDateTo(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #2A9D8F',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
                
              <button
                onClick={() => {
                  setRecordDateFrom('');
                  setRecordDateTo('');
                  fetchRecordsData(id, '', '');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e65c5c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginLeft: 'auto'
                }}
              >
                Сбросить фильтры
              </button>

              <button
                onClick={() => setShowAddRecordModal(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2A9D8F',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                + Добавить запись
              </button>
            </div>

            <div className="table-wrapper records-table-wrapper"> 
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Запись</th>
                    <th>Причина</th>
                  </tr>
                </thead>
                <tbody>
                  {recordsData.length === 0 ? (
                    <tr><td colSpan="3" className="empty-row"></td></tr>
                  ) : (
                    recordsData.map((row, i) => (
                      <tr key={row.id || i} className={i % 2 === 0 ? 'row-alt' : ''}>
                        <td className="date-cell">{row.date}</td>
                        <td className="record-cell">{row.record}</td>
                        <td className="basis-cell">{row.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {showAddRecordModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '30px',
                  maxWidth: '500px',
                  width: '90%',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#264653' }}>Добавить новую запись</h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#264653', fontWeight: '600' }}>
                      Запись
                    </label>
                    <textarea
                      value={newRecordDescription}
                      onChange={(e) => setNewRecordDescription(e.target.value)}
                      placeholder="Введите текст записи"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #2A9D8F',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#264653', fontWeight: '600' }}>
                      Причина
                    </label>
                    <input
                      type="text"
                      value={newRecordReason}
                      onChange={(e) => setNewRecordReason(e.target.value)}
                      placeholder="Укажите причину обращения пациента"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #2A9D8F',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setShowAddRecordModal(false);
                        setNewRecordDescription('');
                        setNewRecordReason('');
                      }}
                      disabled={isSubmitting}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#e65c5c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleCreateRecord}
                      disabled={isSubmitting || !newRecordDescription.trim()}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: isSubmitting || !newRecordDescription.trim() ? '#ccc' : '#2A9D8F',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isSubmitting || !newRecordDescription.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      {isSubmitting ? 'Создание' : 'Создать запись'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

        
      case 'analysis':
        const uniqueIndicators = [...new Set(analysisNotes.map(item => 
          item.notes_indicators.analysis_indicators_name
        ))].sort();

        return (
          <div style={{ display: 'flex', gap: '20px', height: '550px' }}>
            <div style={{ 
              width: '280px', 
              border: '2px solid #2e8b7a', 
              borderRadius: '8px', 
              padding: '10px',
              backgroundColor: '#f9f9f9',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 5px' }}>
                <h3 style={{ margin: 0, color: '#2e8b7a', fontSize: '16px' }}>Показатели</h3>
                {selectedIndicator && (
                  <button 
                    onClick={handleClearChart}
                    style={{ fontSize: '12px', cursor: 'pointer', color: '#e53e3e', border: 'none', background: 'none' }}
                  >
                    Очистить
                  </button>
                )}
              </div>
              
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {uniqueIndicators.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '14px', padding: '10px' }}>Нет данных</p>
                ) : (
                  uniqueIndicators.map((indicator, index) => {
                    const isActive = selectedIndicator === indicator;
                    return (
                      <div 
                        key={index} 
                        onClick={() => handleIndicatorClick(indicator)}
                        style={{ 
                          padding: '10px',
                          marginBottom: '4px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: isActive ? '#e6fffa' : 'white',
                          border: isActive ? '1px solid #2e8b7a' : '1px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: `2px solid ${isActive ? '#2e8b7a' : '#cbd5e0'}`,
                          marginRight: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2e8b7a' }} />}
                        </div>
                        
                        <span style={{ 
                          fontSize: '13px', 
                          color: isActive ? '#2d3748' : '#4a5568',
                          fontWeight: isActive ? '600' : '400'
                        }}>
                          {indicator}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            <div style={{ 
              flex: 1, 
              border: '2px solid #2e8b7a', 
              borderRadius: '8px', 
              padding: '20px',
              backgroundColor: 'white',
              position: 'relative',
              height: '100%'
            }}>
              {chartData ? (
                <Line 
                  data={chartData} 
                  options={{
                    ...chartOptions,
                    maintainAspectRatio: false,
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales.y,
                        title: {
                          ...chartOptions.scales.y.title,
                          text: `Значение (${chartData.datasets[0].unit || ''})`
                        }
                      }
                    }
                  }} 
                />
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#a0aec0',
                }}>
                  <span style={{ fontSize: '40px', marginBottom: '10px' }}></span>
                  <span style={{ fontSize: '16px' }}>
                    {uniqueIndicators.length > 0 
                      ? 'Выберите показатель слева для построения графика' 
                      : 'Нет данных анализов'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={handleBack}>←</button>
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={handleBack}>←</button>
          <h1>Ошибка</h1>
        </div>
        <div className="error-container">
          <p>Не удалось загрузить данные пациента</p>
          <p className="error-message">{error || 'Пациент не найден'}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={handleBack}>← Назад</button>
        <h1>Карта пациента</h1>
        <div className="user-badge_1"></div>
      </div>
      <div className="patient-header">
        <div className="patient-info-left">
          <div className="patient-avatar">
            {patient.photo ? (
              <img src={patient.photo} alt="avatar" />
            ) : (
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.id}`} 
                alt="avatar" 
              />
            )}
          </div>
          <div className="patient-info">
            <h2 className="patient-name">{patient.name}</h2>
            <p className="patient-detail">
              <strong>Дата рождения:</strong> {patient.birthDate}
            </p>
            <p className="patient-detail">
              <strong>Диагноз:</strong> {patient.diagnosis}
            </p>
            <p className="patient-update">
              Последнее обновление: {patient.lastUpdate}
            </p>
          </div>
        </div>
        <div className="patient-calendar-right">
          <AppointmentCalendar />
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-row">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content-wrapper">
          <div className="tab-content-inner">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPage;