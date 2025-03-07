import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import '../styles/FormsStyles.css';

const ProductRequestForm = () => {
  const navigate = useNavigate();

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
        setCategories(response.data);
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
        setGroups(response.data);
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
        setVids(response.data);
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

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Наименование обязательно';
    if (!formData.description.trim()) newErrors.description = 'Описание обязательно';
    if (!formData.desired_purchase_price) newErrors.desired_purchase_price = 'Цена закупки обязательна';
    if (!formData.category) newErrors.category = 'Категория обязательна';
    if (!formData.group) newErrors.group = 'Группа обязательна';
    if (!formData.vid) newErrors.vid = 'Вид обязателен';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('product_link', formData.product_link);
    data.append('desired_purchase_price', formData.desired_purchase_price);
    data.append('category', formData.category);
    data.append('group', formData.group);
    data.append('vid', formData.vid);
    formData.images.forEach((image, index) => {
      data.append(`uploaded_images[${index}]`, image);
    });

    try {
      await axios.post('/api/product-requests/requests/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': Cookies.get('csrftoken'),
        },
      });
      navigate('/requests');
    } catch (error) {
      console.error('Ошибка при создании запроса:', error);
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      }
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
              <label>Наименование*:</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Описание*:</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>

            <div className="form-group">
              <label>Ссылка на товар:</label>
              <input type="url" name="product_link" value={formData.product_link} onChange={handleChange} />
              {errors.product_link && <span className="error">{errors.product_link}</span>}
            </div>

            <div className="form-group">
              <label>Желаемая цена закупки*:</label>
              <input
                type="number"
                name="desired_purchase_price"
                value={formData.desired_purchase_price}
                onChange={handleChange}
                required
              />
              {errors.desired_purchase_price && <span className="error">{errors.desired_purchase_price}</span>}
            </div>

            <div className="form-group">
              <label>Категория*:</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
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
              <label>Группа*:</label>
              <select name="group" value={formData.group} onChange={handleChange} required>
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
              <label>Вид*:</label>
              <select name="vid" value={formData.vid} onChange={handleChange} required>
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

          <button type="submit" className="btn btn-primary">Сохранить</button>
          <button onClick={handleBack} className="btn btn-secondary" type="button">
            Вернуться назад
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductRequestForm;