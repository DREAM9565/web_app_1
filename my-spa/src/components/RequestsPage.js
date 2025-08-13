import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/RequestsPage.css';
import Cookies from 'js-cookie';
import ProductRequestForm from './ProductRequestForm';

const RequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sortConfig, setSortConfig] = useState(() => {
    // Восстанавливаем состояние сортировки из localStorage
    const savedSortConfig = localStorage.getItem('sortConfig');
    return savedSortConfig ? JSON.parse(savedSortConfig) : { key: null, direction: null };
  });
  const navigate = useNavigate();

  // Сохраняем состояние сортировки в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('sortConfig', JSON.stringify(sortConfig));
  }, [sortConfig]);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/product-requests/requests/');
      const data = response.data;
      let fetchedRequests = [];
      if (Array.isArray(data)) {
        fetchedRequests = data;
      } else if (data.results && Array.isArray(data.results)) {
        fetchedRequests = data.results;
      } else {
        console.error('Неожиданный формат данных:', data);
        fetchedRequests = [];
      }

      // Применяем сортировку к данным после их загрузки
      if (sortConfig.key && sortConfig.direction) {
        fetchedRequests.sort((a, b) => {
          if (sortConfig.key === 'created_at') {
            return sortConfig.direction === 'asc' 
              ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
              : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
          }
          if (a[sortConfig.key] === null) return 1;
          if (b[sortConfig.key] === null) return -1;
          return sortConfig.direction === 'asc'
            ? a[sortConfig.key].toString().localeCompare(b[sortConfig.key].toString())
            : b[sortConfig.key].toString().localeCompare(a[sortConfig.key].toString());
        });
      } else {
        // Если сортировка отменена, перемещаем отработанные запросы КМ вниз, а байером — вверх
        fetchedRequests.sort((a, b) => {
          // Сначала проверяем статус processed_by_km
          if (a.processed_by_km && !b.processed_by_km) return 1;
          if (!a.processed_by_km && b.processed_by_km) return -1;

          // Затем проверяем статус processed_by_buyer
          if (a.processed_by_buyer && !b.processed_by_buyer) return -1;
          if (!a.processed_by_buyer && b.processed_by_buyer) return 1;

          return 0;
        });
      }

      setRequests(fetchedRequests);
    } catch (error) {
      console.error('Ошибка загрузки запросов:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchRequests();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/accounts/users/current_user/');
      console.log('Текущий пользователь:', response.data);
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
    }
  };

  // Функция для проверки прав на изменение статуса
  const canChangeStatus = (field) => {
    if (!currentUser) return false;
    
    // Администратор может менять все статусы
    if (currentUser.is_superuser || 
        currentUser.username === 'admin' || 
        (currentUser.profile && currentUser.profile.role === 'admin')) {
      return true;
    }

    // КМ может менять только processed_by_km
    if (field === 'processed_by_km' && currentUser.profile?.role === 'km') {
      return true;
    }

    // Байер может менять только processed_by_buyer
    if (field === 'processed_by_buyer' && currentUser.profile?.role === 'buyer') {
      return true;
    }

    return false;
  };

  const handleStatusChange = async (requestId, field) => {
    console.log('Текущий пользователь при изменении статуса:', currentUser);
    console.log('Профиль пользователя:', currentUser?.profile);

    if (!canChangeStatus(field)) {
      if (field === 'processed_by_km') {
        alert('Только категорийный менеджер или администратор может изменять этот статус');
      } else {
        alert('Только байер или администратор может изменять этот статус');
      }
      return;
    }

    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    // Проверяем, что если запрос уже обработан КМ, байер не может изменить статус
    if (field === 'processed_by_buyer' && request.processed_by_km) {
      alert('Запрос уже обработан категорийным менеджером, байер не может изменить статус');
      return;
    }

    const updatedValue = !request[field];
    
    try {
      await axios.patch(`/api/product-requests/requests/${requestId}/`, {
        [field]: updatedValue
      }, {
        headers: {
          'X-CSRFToken': Cookies.get('csrftoken')
        }
      });

      // Обновляем состояние запросов
      const updatedRequests = requests.map(req => 
        req.id === requestId 
          ? { ...req, [field]: updatedValue }
          : req
      );

      // Сортируем запросы в зависимости от измененного статуса
      if (field === 'processed_by_km' && updatedValue) {
        // Перемещаем запрос вниз списка
        updatedRequests.sort((a, b) => {
          if (a.id === requestId) return 1;
          if (b.id === requestId) return -1;
          return 0;
        });
      } else if (field === 'processed_by_buyer' && updatedValue) {
        // Перемещаем запрос вверх списка
        updatedRequests.sort((a, b) => {
          if (a.id === requestId) return -1;
          if (b.id === requestId) return 1;
          return 0;
        });
      }

      setRequests(updatedRequests);
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };

  const handleRequestClick = (requestId) => {
    navigate(`/requests/${requestId}`);
  };

  // Функция сортировки
  const sortRequests = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else {
        // Отмена сортировки - возврат к исходному порядку
        setSortConfig({ key: null, direction: null });

        // Применяем логику перемещения запросов без перезагрузки данных
        const sortedRequests = [...requests].sort((a, b) => {
          // Сначала проверяем статус processed_by_km
          if (a.processed_by_km && !b.processed_by_km) return 1;
          if (!a.processed_by_km && b.processed_by_km) return -1;

          // Затем проверяем статус processed_by_buyer
          if (a.processed_by_buyer && !b.processed_by_buyer) return -1;
          if (!a.processed_by_buyer && b.processed_by_buyer) return 1;

          return 0;
        });

        setRequests(sortedRequests);
        return;
      }
    }
    setSortConfig({ key, direction });

    const sortedRequests = [...requests].sort((a, b) => {
      if (key === 'created_at') {
        return direction === 'asc' 
          ? new Date(a[key]) - new Date(b[key])
          : new Date(b[key]) - new Date(a[key]);
      }
      if (a[key] === null) return 1;
      if (b[key] === null) return -1;
      return direction === 'asc'
        ? a[key].toString().localeCompare(b[key].toString())
        : b[key].toString().localeCompare(a[key].toString());
    });

    setRequests(sortedRequests);
  };

  // Получение иконки сортировки
  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  // Добавляем функцию для обрезки текста
  const truncateDescription = (text, maxLength = 55) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const truncateName = (text, maxLength = 55) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const canAddRequest = () => {
    if (!currentUser) return false;
    return currentUser.is_superuser || 
           currentUser.username === 'admin' || 
           (currentUser.profile && currentUser.profile.role === 'km');
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="requests-page">
      <div className="requests-header">
        <h1>Запросы на добавление товаров</h1>
        {canAddRequest() && (
          <button
            className="add-request-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Отменить' : 'Добавить запрос'}
          </button>
        )}
      </div>

      {showForm && (
        <ProductRequestForm 
          onSuccess={() => {
            setShowForm(false);
            fetchRequests();
          }}
        />
      )}

      <div className="requests-table-container">
        {requests.length > 0 ? (
          <table className="requests-table">
            <thead>
              <tr>
                <th onClick={() => sortRequests('name')}>
                  Наименование {getSortIcon('name')}
                </th>
                <th onClick={() => sortRequests('description')}>
                  Описание {getSortIcon('description')}
                </th>
                <th onClick={() => sortRequests('creator_full_name')}>
                  Создатель {getSortIcon('creator_full_name')}
                </th>
                <th onClick={() => sortRequests('created_at')}>
                  Дата создания {getSortIcon('created_at')}
                </th>
                <th onClick={() => sortRequests('processed_by_km')}>
                  Статус КМ {getSortIcon('processed_by_km')}
                </th>
                <th onClick={() => sortRequests('processed_by_buyer')}>
                  Статус Байер {getSortIcon('processed_by_buyer')}
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr 
                  key={request.id} 
                  className={request.processed_by_km ? 'processed' : ''}
                  onClick={() => handleRequestClick(request.id)}
                >
                  <td>
                    <div className="name-cell" title={request.name}>
                      {request.name}
                    </div>
                  </td>
                  <td>
                    <div className="description-cell" title={request.description}>
                      {request.description}
                    </div>
                  </td>
                  <td>{request.creator_full_name}</td>
                  <td>{new Date(request.created_at).toLocaleDateString('ru-RU')}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={request.processed_by_km || false}
                      onChange={() => handleStatusChange(request.id, 'processed_by_km')}
                      disabled={!canChangeStatus('processed_by_km')}
                    />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={request.processed_by_buyer || false}
                      onChange={() => handleStatusChange(request.id, 'processed_by_buyer')}
                      disabled={!canChangeStatus('processed_by_buyer')}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-requests">Нет доступных запросов</div>
        )}
      </div>
    </div>
  );
};

export default RequestsPage; 