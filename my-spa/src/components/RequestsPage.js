import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ProductRequestForm from './ProductRequestForm';
import '../styles/RequestsPage.css';

const RequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Загрузка запросов с бэкенда
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get('/api/product-requests/requests/');
        // Убедимся, что данные приходят в виде массива
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        setRequests(data);
      } catch (error) {
        console.error('Ошибка загрузки запросов:', error);
        setError('Не удалось загрузить запросы');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // Обработчик успешного создания запроса
  const handleRequestCreated = (newRequest) => {
    setRequests([newRequest, ...requests]);
    setShowForm(false);
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="requests-page">
      <h1>Запросы на добавление товаров</h1>
      
      <button 
        className="add-request-btn"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Скрыть форму' : 'Добавить запрос'}
      </button>

      {showForm && (
        <div className="request-form-container">
          <ProductRequestForm onSuccess={handleRequestCreated} />
        </div>
      )}

      <div className="requests-list">
        {requests.length > 0 ? (
          requests.map(request => (
            <div 
              key={request.id} 
              className="request-card"
              onClick={() => navigate(`/requests/${request.id}`)}
            >
              <h3>{request.name}</h3>
              <p>{request.description}</p>
              <div className="request-details">
                <span>Категория: {request.category?.name || 'Не указана'}</span>
                <span>Группа: {request.group?.name || 'Не указана'}</span>
                <span>Вид: {request.vid?.name || 'Не указан'}</span>
              </div>
              {request.images?.length > 0 && (
                <div className="request-images">
                  {request.images.map(image => (
                    <img 
                      key={image.id} 
                      src={image.image} 
                      alt={`Изображение для ${request.name}`} 
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div>Нет доступных запросов</div>
        )}
      </div>
    </div>
  );
};

export default RequestsPage; 