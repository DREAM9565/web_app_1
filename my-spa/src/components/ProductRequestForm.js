import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import '../styles/ProductRequestForm.css';

const ProductRequestForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    product_link: '',
    desired_purchase_price: ''
  });
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    setSelectedFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Добавляем основные поля
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      if (formData.product_link) {
        formDataToSend.append('product_link', formData.product_link);
      }
      if (formData.desired_purchase_price) {
        formDataToSend.append('desired_purchase_price', formData.desired_purchase_price);
      }

      // Добавляем изображения
      if (selectedFiles) {
        selectedFiles.forEach(file => {
          formDataToSend.append('uploaded_images', file);
        });
      }

      console.log('Отправляемые данные:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }

      const response = await axios.post('/api/product-requests/requests/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': Cookies.get('csrftoken')
        }
      });

      console.log('Ответ сервера:', response.data);
      onSuccess();
    } catch (error) {
      console.error('Ошибка при создании запроса:', error);
      if (error.response) {
        console.error('Данные ошибки:', error.response.data);
      }
      setError('Не удалось создать запрос');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-request-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="name">Наименование*:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Описание*:</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="product_link">Ссылка на товар:</label>
        <input
          type="url"
          id="product_link"
          name="product_link"
          value={formData.product_link}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="desired_purchase_price">Желаемая цена закупки:</label>
        <input
          type="number"
          id="desired_purchase_price"
          name="desired_purchase_price"
          value={formData.desired_purchase_price}
          onChange={handleChange}
          step="0.01"
        />
      </div>

      <div className="form-group">
        <label htmlFor="images">Изображения (до 10 штук):</label>
        <input
          type="file"
          id="images"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      <button type="submit" className="submit-button">
        Создать запрос
      </button>
    </form>
  );
};

export default ProductRequestForm; 