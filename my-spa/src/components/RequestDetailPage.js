import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/RequestDetailPage.css';

const RequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Загрузка данных запроса
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await axios.get(`/api/product-requests/requests/${id}/`);
        setRequest(response.data);
      } catch (error) {
        console.error('Ошибка загрузки запроса:', error);
        setError('Не удалось загрузить запрос');
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!request) {
    return <div>Запрос не найден</div>;
  }

  return (
    <div className="request-detail-page">
      <h1>{request.name}</h1>

      <div className="request-content">
        <div className="request-images">
          {request.images?.length > 0 ? (
            request.images.map(image => (
              <img
                key={image.id}
                src={image.image}
                alt={`Изображение для ${request.name}`}
                onClick={() => handleImageClick(image)}
                className="clickable-image"
              />
            ))
          ) : (
            <div>Нет изображений</div>
          )}
        </div>

        <div className="request-info">
          <div><strong>Описание:</strong> {request.description}</div>
          <div><strong>Ссылка на товар:</strong> {request.product_link || 'Не указана'}</div>
          <div><strong>Желаемая цена закупки:</strong> {request.desired_purchase_price || 'Не указана'}</div>
          <div><strong>Категория:</strong> {request.category?.name || 'Не указана'}</div>
          <div><strong>Группа:</strong> {request.group?.name || 'Не указана'}</div>
          <div><strong>Вид:</strong> {request.vid?.name || 'Не указан'}</div>
        </div>
      </div>

      <div className="request-actions">
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/requests/${id}/add-product`)}
        >
          Добавить товар
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/requests')}
        >
          Вернуться назад
        </button>
      </div>

      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.image}
              alt={`Увеличенное изображение для ${request.name}`}
              className="enlarged-image"
            />
            <button className="close-modal-btn" onClick={closeModal}>
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetailPage; 