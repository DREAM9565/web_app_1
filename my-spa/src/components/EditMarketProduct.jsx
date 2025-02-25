import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import '../styles/FormsStyles.css';

const EditMarketProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Добавляем получение фильтров:
  const defaultFilters = { catalog: 'mpr', search: '', category_id: '', group_id: '', vid_id: '' };
  let filters = location.state && location.state.filters ? location.state.filters : defaultFilters;
  try {
    const stored = localStorage.getItem('productFilters');
    if (!filters || Object.keys(filters).length === 0) {
      filters = stored ? JSON.parse(stored) : defaultFilters;
    }
  } catch (e) {
    filters = defaultFilters;
  }
  const queryString = new URLSearchParams(filters).toString();

  // Остальные состояния формы и валют
  const [currencies, setCurrencies] = useState([]);
  const [formData, setFormData] = useState({
    photo_file: null,
    date_create: null,
    cz: '',
    currency: '',
    provider: '',
    min_shipment: '',
    country: '',
    city: '',
    description: '',
    qty_per_package: '',
    price_list_delivery_15: '',
    delivery_time: '',
    price_list_delivery_30: '',
    price_list_delivery_45: '',
    fulfillment_time: '',
    qty_provider: '',
    photo_path: ''
  });
  const [errors, setErrors] = useState({});

  // Загружаем данные товара для редактирования
  useEffect(() => {
    const fetchMarketProduct = async () => {
      try {
        const response = await axios.get(`/api/market-products/${id}/`);
        const data = response.data;
        setFormData({
          cz: data.cz || '',
          date_create: data.date_create || '',
          currency: data.currency || '',
          provider: data.provider || '',
          min_shipment: data.min_shipment || '',
          country: data.country || '',
          city: data.city || '',
          description: data.description || '',
          qty_per_package: data.qty_per_package || '',
          price_list_delivery_15: data.price_list_delivery_15 || '',
          delivery_time: data.delivery_time || '',
          price_list_delivery_30: data.price_list_delivery_30 || '',
          price_list_delivery_45: data.price_list_delivery_45 || '',
          qty_provider: data.qty_provider || '',
          photo_path: data.photo_path || '',
          photo_file: null,
        });
      } catch (error) {
        console.error("Ошибка загрузки рыночного товара для редактирования:", error);
      }
    };
    fetchMarketProduct();
  }, [id]);

  // Загружаем список валют
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axios.get('/api/currencies/');
        setCurrencies(response.data);
      } catch (error) {
        console.error("Ошибка загрузки валют:", error);
      }
    };
    fetchCurrencies();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    if (formData.photo_file) {
      data.append('photo_file', formData.photo_file);
    }
    data.append('cz', formData.cz);
    data.append('date_create', formData.date_create);
    data.append('currency', formData.currency);
    data.append('provider', formData.provider);
    data.append('min_shipment', formData.min_shipment);
    data.append('country', formData.country);
    data.append('city', formData.city);
    data.append('description', formData.description);
    data.append('qty_per_package', formData.qty_per_package);
    data.append('price_list_delivery_15', formData.price_list_delivery_15);
    data.append('delivery_time', formData.delivery_time);
    data.append('price_list_delivery_30', formData.price_list_delivery_30);
    data.append('price_list_delivery_45', formData.price_list_delivery_45);
    data.append('qty_provider', formData.qty_provider);

    try {
      await axios.patch(`/api/market-products/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': Cookies.get('csrftoken')
        }
      });
      navigate(`/market-product/${id}`);
    } catch (error) {
      console.error("Ошибка при обновлении рыночного товара:", error);
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      }
    }
  };

  // Новая функция для кнопки "Вернуться назад"
  const handleBack = () => {
      navigate(`/products?${queryString}`, { replace: true });
  };

  return (
    <div className="edit-market-product-page">
      <div className="market-product-form-container">
        <h1>Редактировать рыночный товар</h1>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="fields-grid">
            <div className="form-group">
              <>Фото (необязательно):</>
              <input type="file" name="photo_file" onChange={handleChange} />
              {errors.photo_file && <span className="error">{errors.photo_file}</span>}
            </div>
            <div className="form-group">
              <>Наименование:</>
              <input type="text" name="description" value={formData.description} onChange={handleChange} />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>
            <div className="form-group">
              <>Цена закупки:</>
              <input type="number" name="cz" value={formData.cz} onChange={handleChange} />
              {errors.cz && <span className="error">{errors.cz}</span>}
            </div>
            <div className="form-group">
              <>Валюта:</>
              <select name="currency" value={formData.currency} onChange={handleChange}>
                <option value="">Выберите валюту</option>
                {currencies.map(currency => (
                  <option key={currency.id} value={currency.id}>
                    {currency.description}
                  </option>
                ))}
              </select>
              {errors.currency && <span className="error">{errors.currency}</span>}
            </div>
            <div className="form-group">
              <>Поставщик:</>
              <input type="text" name="provider" value={formData.provider} onChange={handleChange} />
              {errors.provider && <span className="error">{errors.provider}</span>}
            </div>
            <div className="form-group">
              <>Минимальная партия:</>
              <input type="number" name="min_shipment" value={formData.min_shipment} onChange={handleChange} />
              {errors.min_shipment && <span className="error">{errors.min_shipment}</span>}
            </div>
            <div className="form-group">
              <>Страна:</>
              <select name="country" value={formData.country} onChange={handleChange}>
                <option value="">Выберите страну</option>
                <option value="Россия">Россия</option>
                <option value="Китай">Китай</option>
              </select>
              {errors.country && <span className="error">{errors.country}</span>}
            </div>
            <div className="form-group">
              <>Город:</>
              <input type="text" name="city" value={formData.city} onChange={handleChange} />
              {errors.city && <span className="error">{errors.city}</span>}
            </div>
            <div className="form-group">
              <>Количество в упаковке:</>
              <input type="number" name="qty_per_package" value={formData.qty_per_package} onChange={handleChange} />
              {errors.qty_per_package && <span className="error">{errors.qty_per_package}</span>}
            </div>
            <div className="form-group">
              <>Количество у поставщика:</>
              <input type="number" name="qty_provider" value={formData.qty_provider} onChange={handleChange} />
              {errors.qty_provider && <span className="error">{errors.qty_provider}</span>}
            </div>
            <div className="form-group">
              <>Срок доставки на склад(дней):</>
              <input type="number" name="delivery_time" value={formData.delivery_time} onChange={handleChange} />
              {errors.delivery_time && <span className="error">{errors.delivery_time}</span>}
            </div>
            <div className="form-group">
              <>Цена доставки в РФ(15 дней):</>
              <input type="number" name="price_list_delivery_15" value={formData.price_list_delivery_15} onChange={handleChange} />
              {errors.price_list_delivery_15 && <span className="error">{errors.price_list_delivery_15}</span>}
            </div>
            <div className="form-group">
              <>Цена доставки в РФ(30 дней):</>
              <input type="number" name="price_list_delivery_30" value={formData.price_list_delivery_30} onChange={handleChange} />
              {errors.price_list_delivery_30 && <span className="error">{errors.price_list_delivery_30}</span>}
            </div>
            <div className="form-group">
              <>Цена доставки в РФ(45 дней):</>
              <input type="text" name="price_list_delivery_45" value={formData.price_list_delivery_45} onChange={handleChange} />
              {errors.price_list_delivery_45 && <span className="error">{errors.price_list_delivery_45}</span>}
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Сохранить изменения</button>
          <button onClick={handleBack} className="btn btn-secondary">
            Вернуться назад
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditMarketProduct;
