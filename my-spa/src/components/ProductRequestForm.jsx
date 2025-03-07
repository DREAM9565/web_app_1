import React, { useState, useEffect } from 'react';
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
    category: '',
    group: '',
    vid: '',
    images: [],
  });
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [vids, setVids] = useState([]);

  // Загрузка категорий, групп и видов с бэкенда
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/product-requests/categories/');
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        setCategories(data);
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get('/api/product-requests/groups/');
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        setGroups(data);
      } catch (error) {
        console.error('Ошибка загрузки групп:', error);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchVids = async () => {
      try {
        const response = await axios.get('/api/product-requests/vids/');
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        setVids(data);
      } catch (error) {
        console.error('Ошибка загрузки видов:', error);
      }
    };
    fetchVids();
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
    if (formData.name) data.append('name', formData.name);
    if (formData.description) data.append('description', formData.description);
    if (formData.product_link) data.append('product_link', formData.product_link);
    if (formData.desired_purchase_price) data.append('desired_purchase_price', formData.desired_purchase_price);
    if (formData.category) data.append('category', formData.category);
    if (formData.group) data.append('group', formData.group);
    if (formData.vid) data.append('vid', formData.vid);
    formData.images.forEach((image, index) => {
      data.append(`uploaded_images[${index}]`, image);
    });

    try {
      const response = await axios.post('/api/product-requests/requests/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': Cookies.get('csrftoken'),
        },
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      navigate('/requests');
    } catch (error) {
      console.error('Ошибка при создании запроса:', error);
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
              <label>Категория:</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <span className="error">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label>Группа:</label>
              <select name="group" value={formData.group} onChange={handleChange}>
                <option value="">Выберите группу</option>
                {groups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {grp.name}
                  </option>
                ))}
              </select>
              {errors.group && <span className="error">{errors.group}</span>}
            </div>

            <div className="form-group">
              <label>Вид:</label>
              <select name="vid" value={formData.vid} onChange={handleChange}>
                <option value="">Выберите вид</option>
                {vids.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {errors.vid && <span className="error">{errors.vid}</span>}
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
              onClick={handleBack} 
              className="btn btn-secondary" 
              type="button"
              disabled={loading}
            >
              Вернуться назад
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductRequestForm;