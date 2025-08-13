import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/RequestMarketProductDetail.css';
import Cookies from 'js-cookie';

const API_BASE_URL = 'http://localhost:8000'; // Добавляем базовый URL

const RequestMarketProductDetail = () => {
  const { requestId, productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const fetchProduct = async () => {
    try {
      console.log('Fetching product details:', { requestId, productId });
      const response = await axios.get(
        `${API_BASE_URL}/api/product-requests/requests/${requestId}/market-products/${productId}/`,
        { withCredentials: true }
      );
      console.log('Received product data:', response.data);
      setProduct(response.data);

      // Логируем все поля, чтобы убедиться, что qty_provider и fulfillment_time присутствуют
      console.log('All fields:', Object.keys(response.data));

      // Обновляем formData, если форма находится в режиме редактирования
      if (isEditing) {
        setFormData({
          description: response.data.description || '',
          cz: response.data.cz || '',
          currency_id: response.data.currency?.id || '',
          provider: response.data.provider || '',
          min_shipment: response.data.min_shipment || '',
          country: response.data.country || '',
          city: response.data.city || '',
          qty_per_package: response.data.qty_per_package || '',
          price_list_delivery_15: response.data.price_list_delivery_15 || '',
          delivery_time: response.data.delivery_time || '',
          fulfillment_time: response.data.fulfillment_time || '',
          price_list_delivery_30: response.data.price_list_delivery_30 || '',
          price_list_delivery_45: response.data.price_list_delivery_45 || '',
          qty_provider: response.data.qty_provider || 0,
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки товара:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      setError('Не удалось загрузить данные товара');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchCurrentUser();
    fetchCurrencies();
  }, [requestId, productId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/accounts/users/current_user/');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get('/api/product-requests/currencies/');
      setCurrencies(response.data.results || []);
    } catch (error) {
      console.error('Ошибка загрузки валют:', error);
    }
  };

  const canEdit = () => {
    if (!currentUser) return false;
    return currentUser.is_superuser || 
           currentUser.username === 'admin' || 
           (currentUser.profile && currentUser.profile.role === 'buyer');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      description: product.description || '',
      cz: product.cz || '',
      currency_id: product.currency?.id || '',
      provider: product.provider || '',
      min_shipment: product.min_shipment || '',
      country: product.country || '',
      city: product.city || '',
      qty_per_package: product.qty_per_package || '',
      price_list_delivery_15: product.price_list_delivery_15 || '',
      delivery_time: product.delivery_time || '',
      fulfillment_time: product.fulfillment_time || '',
      price_list_delivery_30: product.price_list_delivery_30 || '',
      price_list_delivery_45: product.price_list_delivery_45 || '',
      qty_provider: product.qty_provider || 0,
    });
  };

  const handleSave = async () => {
    try {
      const data = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      newImages.forEach(image => {
        data.append('uploaded_images', image);
      });

      // Логируем данные перед отправкой
      for (let [key, value] of data.entries()) {
        console.log(key, value);
      }

      const response = await axios.patch(
        `${API_BASE_URL}/api/product-requests/market-products/${productId}/`, 
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-CSRFToken': Cookies.get('csrftoken')
          }
        }
      );

      setIsEditing(false);
      setNewImages([]);
      await fetchProduct();
    } catch (error) {
      console.error('Ошибка обновления товара:', error);
      alert('Не удалось обновить товар');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setNewImages(files);
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Вы уверены, что хотите удалить это изображение?')) {
      try {
        await axios.delete(
          `${API_BASE_URL}/api/product-requests/market-products/${productId}/images/${imageId}/`,
          {
            headers: {
              'X-CSRFToken': Cookies.get('csrftoken')
            }
          }
        );
        await fetchProduct();
      } catch (error) {
        console.error('Ошибка удаления изображения:', error);
        alert('Не удалось удалить изображение');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await axios.delete(
          `${API_BASE_URL}/api/product-requests/market-products/${productId}/`,
          {
            headers: {
              'X-CSRFToken': Cookies.get('csrftoken')
            }
          }
        );
        navigate(`/requests/${requestId}`);
      } catch (error) {
        console.error('Ошибка удаления товара:', error);
        alert('Не удалось удалить товар');
      }
    }
  };

  // Открывает модальное окно при клике на основное изображение
  const handleMainImageClick = () => {
    if (product?.images?.length > 0) {
      setSelectedImage(product.images[currentImageIndex]);
    }
  };

  // Меняет текущее изображение при клике на миниатюру
  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (product?.images?.length > 0) {
      const newIndex = (currentImageIndex - 1 + product.images.length) % product.images.length;
      setSelectedImage(product.images[newIndex]);
      setCurrentImageIndex(newIndex);
    }
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (product?.images?.length > 0) {
      const newIndex = (currentImageIndex + 1) % product.images.length;
      setSelectedImage(product.images[newIndex]);
      setCurrentImageIndex(newIndex);
    }
  };

  const handleRelatedRequestClick = (requestId) => {
    navigate(`/requests/${requestId}`);
  };

  const truncateDescription = (text, maxLength = 55) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="not-found">Товар не найден</div>;

  return (
    <div className="market-product-detail">
      <div className="product-header">
        <h1>
          {isEditing ? (
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="edit-input"
            />
          ) : (
            product.description
          )}
        </h1>
      </div>

      <div className="product-content">
        <div className="product-images">
          {product.images?.length > 0 && (
            <>
              <div className="main-image-container">
                <img
                  src={product.images[currentImageIndex].image}
                  alt={`Основное изображение для ${product.description}`}
                  onClick={handleMainImageClick}
                />
                {isEditing && (
                  <button
                    className="delete-image-btn"
                    onClick={() => handleDeleteImage(product.images[currentImageIndex].id)}
                  >
                    Удалить
                  </button>
                )}
              </div>
              <div className="thumbnails-container">
                {product.images.map((image, index) => (
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
        </div>

        <div className="product-info">
          <div className="info-section">
            <h2>Основная информация</h2>
            <div className="info-grid">
              <div className="info-item full-width">
                <strong>Наименование:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.description}</span>
                )}
              </div>
              <div className="info-item">
                <strong>Валюта:</strong>
                {isEditing ? (
                  <select
                    name="currency_id"
                    value={formData.currency_id}
                    onChange={handleChange}
                    className="edit-select"
                  >
                    <option value="">Выберите валюту</option>
                    {currencies.map(currency => (
                      <option key={currency.id} value={currency.id}>
                        {currency.description}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>{product.currency?.description || 'Не указана'}</span>
                )}
              </div>
              <div className="info-item price-highlight">
                <strong>Цена закупки:</strong>
                {isEditing ? (
                  <input
                    type="number"
                    name="cz"
                    value={formData.cz}
                    onChange={handleChange}
                    className="edit-input"
                    step="0.01"
                  />
                ) : (
                  <span>{product.cz}</span>
                )}
              </div>
              <div className="info-item">
                <strong>Поставщик:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.provider || 'Не указан'}</span>
                )}
              </div>
            </div>
          </div>

          <div className="info-section">
            <h2>Параметры поставки</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>Количество в упаковке:</strong>
                {isEditing ? (
                  <input
                    type="number"
                    name="qty_per_package"
                    value={formData.qty_per_package}
                    onChange={handleChange}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.qty_per_package || 'Не указано'}</span>
                )}
              </div>
              <div className="info-item">
                <strong>Минимальная партия:</strong>
                {isEditing ? (
                  <input
                    type="number"
                    name="min_shipment"
                    value={formData.min_shipment}
                    onChange={handleChange}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.min_shipment || 'Не указано'}</span>
                )}
              </div>
              <div className="info-item">
                <strong>Страна:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.country || 'Не указана'}</span>
                )}
              </div>
              <div className="info-item">
                <strong>Город:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.city || 'Не указан'}</span>
                )}
              </div>
              <div className="info-item">
                <strong>Срок доставки:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    name="delivery_time"
                    value={formData.delivery_time}
                    onChange={handleChange}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.delivery_time || 'Не указан'}</span>
                )}
              </div>
              <div className="info-item">
                <strong>Количество у поставщика:</strong>
                {isEditing ? (
                  <input
                    type="number"
                    name="qty_provider"
                    value={formData.qty_provider}
                    onChange={handleChange}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.qty_provider || 'Не указано'}</span>
                )}
              </div>
              <div className="info-item">
                <strong>Срок исполнения:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    name="fulfillment_time"
                    value={formData.fulfillment_time}
                    onChange={handleChange}
                    className="edit-input"
                  />
                ) : (
                  <span>{product.fulfillment_time || 'Не указан'}</span>
                )}
              </div>
            </div>
          </div>

          <div className="info-section">
            <h2>Цены доставки</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>15 дней:</strong>
                {isEditing ? (
                  <input
                    type="number"
                    name="price_list_delivery_15"
                    value={formData.price_list_delivery_15}
                    onChange={handleChange}
                    className="edit-input"
                    step="0.01"
                  />
                ) : (
                  <span>{product.price_list_delivery_15 || 'Не указано'}</span>
                )}
              </div>
              <div className="info-item">
                <strong>30 дней:</strong>
                {isEditing ? (
                  <input
                    type="number"
                    name="price_list_delivery_30"
                    value={formData.price_list_delivery_30}
                    onChange={handleChange}
                    className="edit-input"
                    step="0.01"
                  />
                ) : (
                  <span>{product.price_list_delivery_30 || 'Не указано'}</span>
                )}
              </div>
              <div className="info-item">
                <strong>45 дней:</strong>
                {isEditing ? (
                  <input
                    type="number"
                    name="price_list_delivery_45"
                    value={formData.price_list_delivery_45}
                    onChange={handleChange}
                    className="edit-input"
                    step="0.01"
                  />
                ) : (
                  <span>{product.price_list_delivery_45 || 'Не указано'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Перемещаем кнопки сюда */}
      <div className="product-actions">
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
          className="btn btn-secondary" 
          onClick={() => navigate(-1)}
        >
          Назад
        </button>
      </div>

      {/* Добавляем загрузку изображений */}
      {isEditing && (
        <div className="add-images-section2">
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

      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-nav-area modal-left" onClick={handlePrevImage}></div>
            <div className="modal-nav-area modal-right" onClick={handleNextImage}></div>
            <img
              src={selectedImage.image}
              alt={`Увеличенное изображение для ${product.description}`}
              className="enlarged-image"
            />
            <button className="close-modal-btn" onClick={closeModal}>
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Добавляем секцию для связанных запросов */}
      {product.related_requests && (
        <div className="related-requests-section">
          <h2>В запросе</h2>
          <div className="related-requests-grid">
            <div 
              key={product.related_requests.id} 
              className="related-request-item"
              onClick={() => handleRelatedRequestClick(product.related_requests.id)}
            >
              <h3>{product.related_requests.name}</h3>
              <p>{truncateDescription(product.related_requests.description)}</p>
              <p>Желаемая цена закупки: {product.related_requests.desired_purchase_price}</p>
              <p>Дата создания: {new Date(product.related_requests.created_at).toLocaleDateString()}</p>
              {product.related_requests.images && product.related_requests.images.length > 0 && (
                <div className="related-request-images">
                  {product.related_requests.images.map(image => (
                    <img
                      key={image.id}
                      src={image.image}
                      alt={`Изображение запроса ${product.related_requests.name}`}
                      className="related-request-image"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestMarketProductDetail; 