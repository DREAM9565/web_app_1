import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import '../styles/FormsStyles.css';

const MarketProductForm = () => {
  const { parent_encode } = useParams();
  const navigate = useNavigate();

  const [parentProduct, setParentProduct] = useState(null);
  const [formData, setFormData] = useState({
    photo_file: null,
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
    fulfillment_time: '',
    qty_provider: '',
    price_list_delivery_30: '',
    price_list_delivery_45: ''
  });
  const [errors, setErrors] = useState({});
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    const fetchParentProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${parent_encode}/`);
        setParentProduct(response.data);
      } catch (error) {
        console.error("Ошибка загрузки родительского товара:", error);
      }
    };
    fetchParentProduct();
  }, [parent_encode]);

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

  useEffect(() => {
    if (currencies.length > 0 && !formData.currency) {
      const rubCurrency = currencies.find(cur => cur.description === 'RUB');
      if (rubCurrency) {
        setFormData(prev => ({ ...prev, currency: rubCurrency.id.toString() }));
      }
    }
  }, [currencies, formData.currency]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Очищаем ошибку для поля при его изменении
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Клиентская валидация
    const newErrors = {};
    if (!formData.description.trim()) {
      newErrors.description = 'Наименование обязательно для заполнения';
    }
    if (!formData.cz.trim()) {
      newErrors.cz = 'Цена закупки обязательна для заполнения';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Прерываем отправку, если есть ошибки
    }

    // Если ошибок нет, отправляем форму
    const data = new FormData();
    if (formData.photo_file) data.append('photo_file', formData.photo_file);
    data.append('cz', formData.cz);
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
    data.append('fulfillment_time', formData.fulfillment_time);
    data.append('qty_provider', formData.qty_provider);
    data.append('parent', parent_encode);

    try {
      await axios.post('/api/market-products/create/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': Cookies.get('csrftoken')
        }
      });
      navigate(`/product/${parent_encode}`);
    } catch (error) {
      console.error("Ошибка при создании рыночного товара:", error);
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      }
    }
  };

  const handleBack = () => {
    navigate(`/product/${parent_encode}`, { replace: true });
  };

  if (!parentProduct) return <div className="loading-message">Загрузка...</div>;

  return (
    <div className="edit-market-product-page">
      <div className="market-product-form-container">
        <h1>Добавить рыночный товар для: {parentProduct.description}</h1>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="fields-grid">
            <div className="form-group">
              <>Фото (необязательно):</>
              <input type="file" name="photo_file" onChange={handleChange} />
              {errors.photo_file && <span className="error">{errors.photo_file}</span>}
            </div>

            <div className="form-group">
              <label>Наименование:</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required // Добавляем атрибут required
              />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>

            <div className="form-group">
              <label>Цена закупки*:</label>
              <input
                type="number"
                name="cz"
                value={formData.cz}
                onChange={handleChange}
                required // Добавляем атрибут required
              />
              {errors.cz && <span className="error">{errors.cz}</span>}
            </div>

            <div className="form-group">
              <label>Валюта:</label>
              <select name="currency" value={formData.currency} onChange={handleChange}>
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
              <input
                type="text"
                name="provider"
                value={formData.provider}
                onChange={handleChange}
              />
              {errors.provider && <span className="error">{errors.provider}</span>}
            </div>

            <div className="form-group">
              <>Минимальная партия:</>
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
              <>Город:</>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              {errors.city && <span className="error">{errors.city}</span>}
            </div>

            <div className="form-group">
              <>Количество в упаковке:</>
              <input
                type="number"
                name="qty_per_package"
                value={formData.qty_per_package}
                onChange={handleChange}
              />
              {errors.qty_per_package && <span className="error">{errors.qty_per_package}</span>}
            </div>

            <div className="form-group">
              <>Количество у поставщика:</>
              <input
                type="number"
                name="qty_provider"
                value={formData.qty_provider}
                onChange={handleChange}
              />
              {errors.qty_provider && <span className="error">{errors.qty_provider}</span>}
            </div>

            <div className="form-group">
              <>Срок доставки на склад (дней):</>
              <input
                type="text"
                name="delivery_time"
                value={formData.delivery_time}
                onChange={handleChange}
              />
              {errors.delivery_time && <span className="error">{errors.delivery_time}</span>}
            </div>

            <div className="form-group">
              <>Цена доставки в РФ (15 дней):</>
              <input
                type="number"
                name="price_list_delivery_15"
                value={formData.price_list_delivery_15}
                onChange={handleChange}
              />
              {errors.price_list_delivery_15 && (
                <span className="error">{errors.price_list_delivery_15}</span>
              )}
            </div>

            <div className="form-group">
              <>Цена доставки в РФ (30 дней):</>
              <input
                type="number"
                name="price_list_delivery_30"
                value={formData.price_list_delivery_30}
                onChange={handleChange}
              />
              {errors.price_list_delivery_30 && (
                <span className="error">{errors.price_list_delivery_30}</span>
              )}
            </div>

            <div className="form-group">
              <>Цена доставки в РФ (45 дней):</>
              <input
                type="number"
                name="price_list_delivery_45"
                value={formData.price_list_delivery_45}
                onChange={handleChange}
              />
              {errors.price_list_delivery_45 && (
                <span className="error">{errors.price_list_delivery_45}</span>
              )}
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

export default MarketProductForm;