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
    currency: '',
    provider: '',
    min_shipment: '',
    country: '',
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

  // Загрузка валют с бэкенда
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axios.get('/api/product-requests/currencies/');
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        setCurrencies(data);
      } catch (error) {
        console.error('Ошибка загрузки валют:', error);
      }
    };
    fetchCurrencies();
  }, []);

  // Обработка изменений в форме
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'images') {
      const selectedFiles = Array.from(files).slice(0, 3); // Ограничиваем до 3 изображений
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
    setLoading(true);

    const data = new FormData();
    data.append('request', id);
    if (formData.description) data.append('description', formData.description);
    if (formData.cz) data.append('cz', formData.cz);
    if (formData.currency) data.append('currency', formData.currency);
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
    formData.images.forEach((image, index) => {
      data.append(`uploaded_images[${index}]`, image);
    });

    try {
      await axios.post('/api/product-requests/market-products/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': Cookies.get('csrftoken'),
        },
      });
      navigate(`/requests/${id}`);
    } catch (error) {
      console.error('Ошибка при создании товара:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
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
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                <option value="">Выберите валюту</option>
                {currencies.map(currency => (
                  <option key={currency.id} value={currency.id}>
                    {currency.description}
                  </option>
                ))}
              </select>
              {errors.currency && <span className="error">{errors.currency}</span>}
            </div>

            {/* Добавьте остальные поля формы аналогичным образом */}

            <div className="form-group">
              <label>Фото (до 3 изображений):</label>
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