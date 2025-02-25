// src/components/MarketProductDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../styles/ProductStyles.css';
import '../styles/ProductDetailStyles.css';
import DefaultImage from './DefaultImage';
import { FilterContext } from '../context/FilterContext';

const formatDate = (dateString) => {
  if (!dateString) {
    return ''; // Возвращаем пустую строку или значение по умолчанию
  }
  
  const date = new Date(dateString);
  
  // Проверяем, является ли дата валидной
  if (isNaN(date.getTime())) {
    console.error("Invalid date:", dateString); // Логируем ошибку для отладки
    return ''; // Возвращаем пустую строку или значение по умолчанию
  }
  
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return formatter.format(date);
};

const MarketProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Берём фильтры из контекста
  const { filters } = useContext(FilterContext);
  // Собираем queryString для кнопки "Назад"
  const queryString = new URLSearchParams(filters).toString();

  const [marketProduct, setMarketProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Подгрузка дополнительных описаний
  const fetchParentDescriptions = async (parentDetail) => {
    try {
      const res = await axios.get('/api/categories');
      const categories = res.data;
      const categoryData = categories.find(
        (item) => Number(item.category_id) === Number(parentDetail.category)
      );
      const category_description = categoryData ? categoryData.description : parentDetail.category;
      let group_description = parentDetail.group;
      let vid_description = parentDetail.vid;
      if (categoryData && categoryData.groups) {
        const groupData = categoryData.groups.find(
          (grp) => Number(grp.group_id) === Number(parentDetail.group)
        );
        if (groupData) {
          group_description = groupData.description;
          if (groupData.vids) {
            const vidData = groupData.vids.find(
              (vd) => Number(vd.vid_id) === Number(parentDetail.vid)
            );
            if (vidData) {
              vid_description = vidData.description;
            }
          }
        }
      }
      return { category_description, group_description, vid_description };
    } catch (err) {
      console.error("Ошибка получения описаний родительских сущностей:", err);
      return {
        category_description: parentDetail.category,
        group_description: parentDetail.group,
        vid_description: parentDetail.vid
      };
    }
  };

  // Загрузка MarketProduct по id
  useEffect(() => {
    const fetchMarketProduct = async () => {
      try {
        const response = await axios.get(`/api/market-products/${id}/`);
        const productData = response.data;
        // Если у товара есть parent_detail, дополним его описаниями
        if (productData.parent_detail) {
          const descriptions = await fetchParentDescriptions(productData.parent_detail);
          productData.parent_detail = { ...productData.parent_detail, ...descriptions };
        }
        setMarketProduct(productData);
      } catch (error) {
        console.error("Ошибка загрузки рыночного товара:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketProduct();
  }, [id]);

  if (loading) return <div className="loading-message">Загрузка...</div>;
  if (!marketProduct) return <div className="error-message">Товар не найден</div>;

  // Связанные товары
  const relatedProducts = Array.isArray(marketProduct.related_products)
    ? marketProduct.related_products
    : [];

  // Кнопка "Вернуться к списку"
  const handleBackClick = () => {
    navigate(`/products?${queryString}`, { replace: true });
  };

  // Кнопка "Редактировать" (например, ведёт на EditMarketProduct)
  const handleEditClick = () => {
    // Можно передать тот же контекст через state, 
    // но раз уж MPR detail делает navigate(`/products?...`), 
    // мы можем просто без queryString, 
    // ИЛИ добавим queryString для единообразия:
    navigate(`/market-product/edit/${id}`, { state: { filters }, replace: true });
  };

  return (
    <div className="market-product-detail-container">
      <h1 className="product-title">{marketProduct.description}</h1>
      
      <div className="market-product-info">
        <div className="market-product-image">
          <DefaultImage
            src={`/media/market_product/${marketProduct.photo_path}`}
            alt={marketProduct.description}
            className="product-image"
          />
        </div>

        <div className="unified-fields-grid">
          <p className="field">
            <strong>Дата создания:</strong> {formatDate(marketProduct.date_create)}
          </p>
          <p className="field">
            <strong>Срок доставки на склад:</strong> {marketProduct.delivery_time}
          </p>
          <p className="price-highlight">
            <strong>Цена закупки:</strong> <strong>{marketProduct.cz}</strong>
          </p>
          <p className="field">
            <strong>Валюта:</strong> {marketProduct.currency_name || 'нет'}
          </p>
          <p className="field">
            <strong>Количество в упаковке:</strong> {marketProduct.qty_per_package}
          </p>
          <p className="field">
            <strong>Поставщик:</strong> {marketProduct.provider}
          </p>
          <p className="field">
            <strong>Минимальная партия:</strong> {marketProduct.min_shipment}
          </p>
          <p className="field">
            <strong>Страна:</strong> {marketProduct.country}
          </p>
          <p className="field">
            <strong>Город:</strong> {marketProduct.city}
          </p>
          <p className="field">
            <strong>Цена доставки в РФ(15 дней):</strong> {marketProduct.price_list_delivery_15}
          </p>
          <p className="field">
            <strong>Цена доставки в РФ(30 дней):</strong> {marketProduct.price_list_delivery_30}
          </p>
          <p className="field">
            <strong>Цена доставки в РФ(45 дней):</strong> {marketProduct.price_list_delivery_45}
          </p>
          {marketProduct.parent_detail && (
            <>
              <p className="field">
                <strong>Категория:</strong>{' '}
                {marketProduct.parent_detail.category_description || marketProduct.parent_detail.category}
              </p>
              <p className="field">
                <strong>Группа:</strong>{' '}
                {marketProduct.parent_detail.group_description || marketProduct.parent_detail.group}
              </p>
              <p className="field">
                <strong>Вид:</strong>{' '}
                {marketProduct.parent_detail.vid_description || marketProduct.parent_detail.vid}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="action-buttons">
        <button onClick={handleEditClick} className="btn btn-primary button-fix">
          Редактировать
        </button>
        <button onClick={handleBackClick} className="btn btn-secondary">
          Вернуться к списку
        </button>
      </div>

      {marketProduct.parent_detail && (
        <div className="parent-product-section">
          <h2>Товар МПР</h2>
          <div className="market-products-grid">
            <div className="market-product-card">
              <div className="card">
                <Link
                  to={`/product/${marketProduct.parent_detail.encode || marketProduct.parent_detail.code}`}
                  state={{ filters }}
                  className="parent-product-link"
                >
                  {marketProduct.parent_detail.photo_path ? (
                    <DefaultImage
                      src={`/media/mpr_product/${marketProduct.parent_detail.photo_path}`}
                      className="card-img-top"
                      alt={marketProduct.parent_detail.description || 'Родительский товар'}
                    />
                  ) : (
                    <img src="/static/default.jpg" className="card-img-top" alt="Нет изображения" />
                  )}
                  <div className="card-body">
                    <p>
                      <strong>Наименование:</strong> {marketProduct.parent_detail.description}
                    </p>
                    <p>
                      <strong>Код:</strong> {marketProduct.parent_detail.code}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {relatedProducts.length > 0 && (
        <div className="market-products-section">
          <h2>Связанные рыночные товары</h2>
          <div className="market-products-grid">
            {relatedProducts.map((market) => (
              <div key={market.id} className="market-product-card">
                <div className="card">
                  <DefaultImage
                    src={`/media/market_product/${market.photo_path}`}
                    className="card-img-top"
                    alt={market.description}
                  />
                  <div className="card-body">
                    <p>
                      <strong>Наименование:</strong> {market.description}
                    </p>
                    <p>
                      <strong>Страна:</strong> {market.country}
                    </p>
                    <Link
                      to={`/market-product/${market.id}`}
                      className="btn btn-warning btn-sm"
                      state={{ filters }}
                    >
                      Редактировать
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketProductDetail;
