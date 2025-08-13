import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import '../styles/AddProductForm.css';

const AddProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    cz: '',
    currency_id: '',
    provider: '',
    min_shipment: '',
    country: 'Россия',
    city: '',
    qty_per_package: '',
    price_list_delivery_15: '',
    price_list_delivery_30: '',
    price_list_delivery_45: '',
    delivery_time: '',
    fulfillment_time: '',
    qty_provider: '',
    images: [],
  });

  const [errors, setErrors] = useState({});
  const [currencies, setCurrencies] = useState([]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Загрузка валют с бэкенда
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axios.get('/api/product-requests/currencies/');
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        setCurrencies(data);

        // Установите RUB как валюту по умолчанию
        const rubCurrency = data.find(currency => currency.description === 'RUB');
        if (rubCurrency) {
          setFormData(prev => ({ ...prev, currency_id: rubCurrency.id }));
        }
      } catch (error) {
        console.error('Ошибка загрузки валют:', error);
      }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (!formData.country) {
      setFormData(prev => ({ ...prev, country: 'Россия' }));
    }
  }, []);

  // Обработка изменений в форме
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'images') {
      const selectedFiles = Array.from(files).slice(0, 10);
      
      // Проверка размера файлов
      const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
      
      if (oversizedFiles.length > 0) {
        alert(`Максимальный размер файла - ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        return;
      }

      setFormData((prev) => ({ ...prev, images: selectedFiles }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверка обязательных полей
    const requiredFields = ['description', 'cz', 'currency_id', 'provider'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`Пожалуйста, заполните обязательные поля: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('request', id);
    if (formData.description) data.append('description', formData.description);
    if (formData.cz) data.append('cz', formData.cz);
    if (formData.currency_id) data.append('currency_id', formData.currency_id);
    if (formData.provider) data.append('provider', formData.provider);
    if (formData.min_shipment) data.append('min_shipment', formData.min_shipment);
    if (formData.country) data.append('country', formData.country);
    if (formData.city) data.append('city', formData.city);
    if (formData.qty_per_package) data.append('qty_per_package', formData.qty_per_package);
    if (formData.price_list_delivery_15) data.append('price_list_delivery_15', formData.price_list_delivery_15);
    if (formData.price_list_delivery_30) data.append('price_list_delivery_30', formData.price_list_delivery_30);
    if (formData.price_list_delivery_45) data.append('price_list_delivery_45', formData.price_list_delivery_45);
    if (formData.delivery_time) data.append('delivery_time', formData.delivery_time);
    if (formData.fulfillment_time) data.append('fulfillment_time', formData.fulfillment_time);
    if (formData.qty_provider) data.append('qty_provider', formData.qty_provider);
    
    // Логируем изображения перед отправкой
    console.log('Изображения для отправки:', formData.images);
    formData.images.forEach((image, index) => {
      data.append(`uploaded_images[${index}]`, image);
    });

    // Логируем все данные перед отправкой
    for (let [key, value] of data.entries()) {
      console.log(key, value);
    }

    try {
      const response = await axios.post('/api/product-requests/market-products/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': Cookies.get('csrftoken'),
        },
      });
      console.log('Ответ сервера:', response.data);
      navigate(`/requests/${id}`);
    } catch (error) {
      console.error('Ошибка при создании товара:', error);
      if (error.response) {
        console.error('Данные ошибки:', error.response.data);
        console.error('Статус ошибки:', error.response.status);
        console.error('Заголовки ответа:', error.response.headers);
      }
      alert('Не удалось создать товар. Пожалуйста, проверьте введенные данные и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/requests/${id}`);
  };

  return (
    <div className="add-product-form-page">
      <div className="add-product-form-container">
        <h1>Добавить товар</h1>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="fields-grid">
            <div className="form-group">
              <label>Описание:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>

            <div className="form-group">
              <label>Цена закупки:</label>
              <input
                type="number"
                name="cz"
                value={formData.cz}
                onChange={handleChange}
              />
              {errors.cz && <span className="error">{errors.cz}</span>}
            </div>

            <div className="form-group">
              <label>Валюта:</label>
              <select
                name="currency_id"
                value={formData.currency_id}
                onChange={handleChange}
              >
                <option value="">Выберите валюту</option>
                {currencies.map(currency => (
                  <option key={currency.id} value={currency.id}>
                    {currency.description}
                  </option>
                ))}
              </select>
              {errors.currency_id && <span className="error">{errors.currency_id}</span>}
            </div>

            <div className="form-group">
              <label>Поставщик:</label>
              <input
                type="text"
                name="provider"
                value={formData.provider}
                onChange={handleChange}
              />
              {errors.provider && <span className="error">{errors.provider}</span>}
            </div>

            <div className="form-group">
              <label>Минимальная партия:</label>
              <input
                type="number"
                name="min_shipment"
                value={formData.min_shipment}
                onChange={handleChange}
              />
              {errors.min_shipment && <span className="error">{errors.min_shipment}</span>}
            </div>

            <div className="form-group">
              <label>Страна:</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
              >
                <option value="Россия">Россия</option>
                <option value="Китай">Китай</option>
              </select>
              {errors.country && <span className="error">{errors.country}</span>}
            </div>

            <div className="form-group">
              <label>Город:</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              {errors.city && <span className="error">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label>Количество в упаковке:</label>
              <input
                type="number"
                name="qty_per_package"
                value={formData.qty_per_package}
                onChange={handleChange}
              />
              {errors.qty_per_package && <span className="error">{errors.qty_per_package}</span>}
            </div>

            <div className="form-group">
              <label>Количество у поставщика:</label>
              <input
                type="number"
                name="qty_provider"
                value={formData.qty_provider}
                onChange={handleChange}
              />
              {errors.qty_provider && <span className="error">{errors.qty_provider}</span>}
            </div>

            <div className="form-group">
              <label>Срок доставки:</label>
              <input
                type="text"
                name="delivery_time"
                value={formData.delivery_time}
                onChange={handleChange}
              />
              {errors.delivery_time && <span className="error">{errors.delivery_time}</span>}
            </div>

            <div className="form-group">
              <label>Срок исполнения:</label>
              <input
                type="text"
                name="fulfillment_time"
                value={formData.fulfillment_time}
                onChange={handleChange}
              />
              {errors.fulfillment_time && <span className="error">{errors.fulfillment_time}</span>}
            </div>

            <div className="form-group">
              <label>Цена доставки (15 дней):</label>
              <input
                type="number"
                name="price_list_delivery_15"
                value={formData.price_list_delivery_15}
                onChange={handleChange}
              />
              {errors.price_list_delivery_15 && <span className="error">{errors.price_list_delivery_15}</span>}
            </div>

            <div className="form-group">
              <label>Цена доставки (30 дней):</label>
              <input
                type="number"
                name="price_list_delivery_30"
                value={formData.price_list_delivery_30}
                onChange={handleChange}
              />
              {errors.price_list_delivery_30 && <span className="error">{errors.price_list_delivery_30}</span>}
            </div>

            <div className="form-group">
              <label>Цена доставки (45 дней):</label>
              <input
                type="number"
                name="price_list_delivery_45"
                value={formData.price_list_delivery_45}
                onChange={handleChange}
              />
              {errors.price_list_delivery_45 && <span className="error">{errors.price_list_delivery_45}</span>}
            </div>

            <div className="form-group">
              <label>Фото (до 10 изображений):</label>
              <input
                type="file"
                name="images"
                multiple
                accept="image/*"
                onChange={handleChange}
              />
              {errors.images && <span className="error">{errors.images}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBack}
            >
              Вернуться назад
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm; 