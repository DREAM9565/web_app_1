import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import '../styles/FormsStyles.css';

const ProductRequestForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    product_link: '',
    desired_purchase_price: '',
    images: [],
  });
  const [errors, setErrors] = useState({});

  // Обработка изменений в форме
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'images') {
      const selectedFiles = Array.from(files).slice(0, 3);
      setFormData(prev => ({ ...prev, images: selectedFiles }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'images') {
        formData.images.forEach((image, index) => {
          data.append('uploaded_images', image);
        });
      } else if (formData[key]) {
        data.append(key, formData[key]);
      }
    });

    try {
      await axios.post('/api/product-requests/requests/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': Cookies.get('csrftoken')
        }
      });

      onSuccess();
    } catch (error) {
      console.error('Ошибка создания запроса:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="product-request-form-page">
      <div className="product-request-form-container">
        <h1>Добавить запрос на товар</h1>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="fields-grid">
            <div className="form-group">
              <label>Наименование:</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Описание:</label>
              <textarea name="description" value={formData.description} onChange={handleChange} />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>

            <div className="form-group">
              <label>Ссылка на товар:</label>
              <input type="url" name="product_link" value={formData.product_link} onChange={handleChange} />
              {errors.product_link && <span className="error">{errors.product_link}</span>}
            </div>

            <div className="form-group">
              <label>Желаемая цена закупки:</label>
              <input
                type="number"
                name="desired_purchase_price"
                value={formData.desired_purchase_price}
                onChange={handleChange}
              />
              {errors.desired_purchase_price && <span className="error">{errors.desired_purchase_price}</span>}
            </div>

            <div className="form-group">
              <label>Фото (до 3 изображений):</label>
              <input type="file" name="images" multiple accept="image/*" onChange={handleChange} />
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
              onClick={() => onSuccess()}
              disabled={loading}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductRequestForm;