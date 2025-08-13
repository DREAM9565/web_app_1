import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/RequestDetailPage.css';
import Cookies from 'js-cookie';

const RequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    product_link: '',
    desired_purchase_price: '',
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    fetchCurrentUser();
    fetchRequest();
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/accounts/users/current_user/');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
    }
  };

  const fetchRequest = async () => {
    try {
      const response = await axios.get(`/api/product-requests/requests/${id}/`);
      setRequest(response.data);
      setFormData({
        name: response.data.name || '',
        description: response.data.description || '',
        product_link: response.data.product_link || '',
        desired_purchase_price: response.data.desired_purchase_price || '',
      });
    } catch (error) {
      console.error('Ошибка загрузки запроса:', error);
      setError('Не удалось загрузить запрос');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = () => {
    if (!currentUser) return false;
    return currentUser.is_superuser || 
           currentUser.username === 'admin' || 
           (currentUser.profile && currentUser.profile.role === 'km');
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот запрос?')) {
      try {
        await axios.delete(`/api/product-requests/requests/${id}/`, {
          headers: {
            'X-CSRFToken': Cookies.get('csrftoken')
          }
        });
        navigate('/requests');
      } catch (error) {
        console.error('Ошибка удаления запроса:', error);
        alert('Не удалось удалить запрос');
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Вы уверены, что хотите удалить это изображение?')) {
      try {
        console.log('Попытка удаления изображения:', {
          imageId,
          requestId: id,
          image: request.images.find(img => img.id === imageId)
        });
        
        const response = await axios.delete(`/api/product-requests/images/${imageId}/`, {
          headers: {
            'X-CSRFToken': Cookies.get('csrftoken')
          }
        });
        
        console.log('Изображение успешно удалено:', response.status);
        
        // Сбрасываем индекс текущего изображения, если это было последнее изображение
        if (request.images.length <= 1) {
          setCurrentImageIndex(0);
        } else if (currentImageIndex >= request.images.length - 1) {
          setCurrentImageIndex(request.images.length - 2);
        }
        
        // Обновляем данные запроса после удаления изображения
        await fetchRequest();
      } catch (error) {
        console.error('Ошибка удаления изображения:', {
          imageId,
          requestId: id,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        alert('Не удалось удалить изображение. Пожалуйста, попробуйте еще раз или обратитесь к администратору.');
      }
    }
  };

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setNewImages(files);
  };

  const handleSave = async () => {
    try {
      const data = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      // Добавляем новые изображения
      newImages.forEach(image => {
        data.append('uploaded_images', image);
      });

      console.log('Отправляемые данные:');
      for (let [key, value] of data.entries()) {
        console.log(key, value);
      }

      const response = await axios.patch(`/api/product-requests/requests/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': Cookies.get('csrftoken')
        }
      });

      console.log('Response data:', response.data);
      
      setIsEditing(false);
      setNewImages([]);
      await fetchRequest();
    } catch (error) {
      console.error('Ошибка обновления запроса:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      alert('Не удалось обновить запрос');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMainImageClick = () => {
    if (request?.images?.length > 0) {
      setSelectedImage(request.images[currentImageIndex]);
    }
  };

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const getImageUrl = (imageUrl) => {
    return imageUrl.replace('http://', 'https://');
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (request?.images?.length > 0) {
      const newIndex = (currentImageIndex - 1 + request.images.length) % request.images.length;
      const imageUrl = getImageUrl(request.images[newIndex].image);
      setSelectedImage({ ...request.images[newIndex], image: imageUrl });
      setCurrentImageIndex(newIndex);
    }
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (request?.images?.length > 0) {
      const newIndex = (currentImageIndex + 1) % request.images.length;
      const imageUrl = getImageUrl(request.images[newIndex].image);
      setSelectedImage({ ...request.images[newIndex], image: imageUrl });
      setCurrentImageIndex(newIndex);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/requests/${id}/market-products/${productId}`);
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!request) return <div className="not-found">Запрос не найден</div>;

  const imageUrl = request.images[currentImageIndex].image.replace('http://', 'https://');

  return (
    <div className="request-detail-page">
      <div className="request-header">
        <h1>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="edit-input"
            />
          ) : (
            request.name
          )}
        </h1>
      </div>

      <div className="request-content">
        <div className="request-images">
          {request.images?.length > 0 && currentImageIndex < request.images.length && (
            <>
              <div className="main-image-container">
                <img
                  src={imageUrl}
                  alt={`Основное изображение для ${request.name}`}
                  onClick={handleMainImageClick}
                />
                {isEditing && (
                  <button
                    className="delete-image-btn"
                    onClick={() => handleDeleteImage(request.images[currentImageIndex].id)}
                  >
                    Удалить
                  </button>
                )}
              </div>
              <div className="thumbnails-container">
                {request.images.map((image, index) => (
                  <div 
                    key={image.id}
                    className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => handleThumbnailClick(index)}
                  >
                    <img
                      src={image.image}
                      alt={`Миниатюра ${index + 1}`}
                    />
                    {isEditing && (
                      <button
                        className="delete-thumbnail-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.id);
                        }}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          {isEditing && (
            <div className="add-images-section">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleAddImages}
              />
              {newImages.length > 0 && (
                <div className="new-images-preview">
                  {newImages.map((image, index) => (
                    <img
                      key={index}
                      src={URL.createObjectURL(image)}
                      alt={`Новое изображение ${index + 1}`}
                      className="new-image-preview"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="request-info">
          <div className="info-section">
            <h3>Подробная информация</h3>
            <div>
              <strong>Описание: </strong>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="edit-textarea"
                />
              ) : (
                request.description
              )}
            </div>
            <div>
              <strong>Ссылка на товар: </strong>
              {isEditing ? (
                <input
                  type="url"
                  name="product_link"
                  value={formData.product_link}
                  onChange={handleChange}
                  className="edit-input"
                />
              ) : (
                request.product_link ? (
                  <a 
                    href={request.product_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="product-link"
                  >
                    {request.product_link}
                  </a>
                ) : (
                  'Не указана'
                )
              )}
            </div>
            <div>
              <strong>Желаемая цена закупки: </strong>
              {isEditing ? (
                <input
                  type="number"
                  name="desired_purchase_price"
                  value={formData.desired_purchase_price}
                  onChange={handleChange}
                  className="edit-input"
                  step="0.01"
                />
              ) : (
                request.desired_purchase_price || 'Не указана'
              )}
            </div>
            <div><strong>Создатель:</strong> {request.creator_full_name}</div>
            <div><strong>Дата создания:</strong> {new Date(request.created_at).toLocaleDateString('ru-RU')}</div>
            <div><strong>Статус обработки КМ:</strong> {request.processed_by_km ? 'Обработано' : 'Не обработано'}</div>
            <div><strong>Статус обработки Байером:</strong> {request.processed_by_buyer ? 'Обработано' : 'Не обработано'}</div>
          </div>
        </div>
      </div>

      <div className="request-actions">
        {canEdit() && (
          <>
            {isEditing ? (
              <>
                <button className="btn btn-success" onClick={handleSave}>
                  Сохранить
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setIsEditing(false)}
                >
                  Отмена
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-success" onClick={handleEdit}>
                  Редактировать
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  Удалить
                </button>
              </>
            )}
          </>
        )}
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

      {request.market_products && request.market_products.length > 0 && (
        <div className="market-products-section">
          <h2>Предложение</h2>
          <div className="related-products-grid">
            {request.market_products.map((product) => (
              <div 
                key={product.id} 
                className="related-product-card"
                onClick={() => handleProductClick(product.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="related-product-image-container">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0].image} 
                      alt={product.description}
                      className="product-image"
                    />
                  ) : (
                    <img 
                      src="/static/default.jpg" 
                      alt="Изображение по умолчанию"
                      className="product-image"
                    />
                  )}
                </div>
                <div className="related-product-details">
                  <p><strong>Наименование: </strong> {product.description}</p>
                  <p><strong>Валюта: </strong> {product.currency?.description || 'Не указана'}</p>
                  <p className="price-highlight"><strong>Цена закупки: </strong> <strong>{product.cz}</strong></p>
                  <p><strong>Поставщик: </strong> {product.provider}</p>
                  <p><strong>Количество в упаковке: </strong> {product.qty_per_package}</p>
                  <p><strong>Минимальная партия: </strong> {product.min_shipment}</p>
                  <p><strong>Страна: </strong> {product.country}</p>
                  <p><strong>Город: </strong> {product.city}</p>
                  <p><strong>Срок доставки: </strong> {product.delivery_time}</p>
                  {product.price_list_delivery_15 && (
                    <p><strong>Цена доставки (15 дней): </strong> {product.price_list_delivery_15}</p>
                  )}
                  {product.price_list_delivery_30 && (
                    <p><strong>Цена доставки (30 дней): </strong> {product.price_list_delivery_30}</p>
                  )}
                  {product.price_list_delivery_45 && (
                    <p><strong>Цена доставки (45 дней): </strong> {product.price_list_delivery_45}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-nav-area modal-left" onClick={handlePrevImage}></div>
            <div className="modal-nav-area modal-right" onClick={handleNextImage}></div>
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