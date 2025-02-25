import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

const MPRProductDetail = () => {
  const { encode } = useParams();
  const navigate = useNavigate();

  // Глобальные фильтры
  const { filters } = useContext(FilterContext);

  // Формируем queryString для "назад"
  const queryString = new URLSearchParams(filters).toString();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // *** НОВЫЙ КОД ***
  const [categoryDescription, setCategoryDescription] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [vidDescription, setVidDescription] = useState('');
  // *** КОНЕЦ НОВОГО КОДА ***

  // Загрузка деталей MPR
  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const response = await axios.get(`/api/products/${encode}/`);
        setProduct(response.data);
      } catch (error) {
        console.error("Ошибка загрузки MPR продукта:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetail();
  }, [encode]);

  // *** НОВЫЙ КОД ***
  // Функция для получения описаний родительских сущностей
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

  useEffect(() => {
    // Вызываем fetchParentDescriptions для получения описаний
    const loadDescriptions = async () => {
      if (product && product.category && product.group && product.vid) {
        const descriptions = await fetchParentDescriptions({
          category: product.category,
          group: product.group,
          vid: product.vid,
        });
        setCategoryDescription(descriptions.category_description);
        setGroupDescription(descriptions.group_description);
        setVidDescription(descriptions.vid_description);
      }
    };
    if (product) {
      loadDescriptions();
    }
  }, [product]);
  // *** КОНЕЦ НОВОГО КОДА ***


  if (loading) return <div className="loading-message">Загрузка...</div>;
  if (!product) return <div className="error-message">Товар не найден</div>;

  const marketProducts = Array.isArray(product.market_products)
    ? product.market_products
    : [];

  // "Назад" к списку
  const handleBack = () => {
    navigate(`/products?${queryString}`, { replace: true });
  };

  const renderProductDetails = (product) => {
    if (product.country === 'Россия') {
      return (
        <div className="related-product-details">
          <p><strong>Наименование:</strong> {product.description}</p>
          <p><strong>Дата создания:</strong> {formatDate(product.date_create)}</p>
          <p className="price-highlight"><strong>Цена:</strong> <strong>{product.cz}</strong></p>
          <p><strong>Поставщик:</strong> {product.provider}</p>
          <p><strong>Количество в упаковке:</strong> {product.qty_per_package}</p>
          <p><strong>Минимальная партия:</strong> {product.min_shipment}</p>
          <p><strong>Страна:</strong> {product.country}</p>
          <p><strong>Город:</strong> {product.city}</p>
          <p><strong>Срок доставки на склад:</strong> {product.delivery_time}</p>
          {product.parent_detail && (
            <div className="related-parent-product-section">
              <h3>Товар МПР</h3>
              <p><strong>Код:</strong> {product.parent_detail.code}</p>
              <p>
                <strong>Категория:</strong>{' '}
                {product.parent_detail.category_description || product.parent_detail.category}
              </p>
              <p>
                <strong>Группа:</strong>{' '}
                {product.parent_detail.group_description || product.parent_detail.group}
              </p>
              <p>
                <strong>Вид:</strong>{' '}
                {product.parent_detail.vid_description || product.parent_detail.vid}
              </p>
            </div>
          )}
        </div>
      );
    } else if (product.country === 'Китай') {
      return (
        <div className="related-product-details">
          <p><strong>Наименование:</strong> {product.description}</p>
          <p><strong>Валюта:</strong> {product.currency_name || 'нет'}</p>
          <p className="price-highlight"><strong>Цена закупки:</strong> <strong>{product.cz}</strong></p>
          <p><strong>Количество в упаковке:</strong> {product.qty_per_package}</p>
          <p><strong>Минимальная партия:</strong> {product.min_shipment}</p>
          <p><strong>Страна:</strong> {product.country}</p>
          <p><strong>Город:</strong> {product.city}</p>
          <p><strong>Цена доставки в РФ (15 дней):</strong> {product.price_list_delivery_15}</p>
          <p><strong>Цена доставки в РФ (30 дней):</strong> {product.price_list_delivery_30}</p>
          <p><strong>Цена доставки в РФ (45 дней):</strong> {product.price_list_delivery_45}</p>
          {product.parent_detail && (
            <div className="related-parent-product-section">
              <h3>Товар МПР</h3>
              <p><strong>Код:</strong> {product.parent_detail.code}</p>
              <p>
                <strong>Категория:</strong> {product.parent_detail.category_description || product.parent_detail.category}
              </p>
              <p>
                <strong>Группа:</strong> {product.parent_detail.group_description || product.parent_detail.group}
              </p>
              <p>
                <strong>Вид:</strong> {product.parent_detail.vid_description || product.parent_detail.vid}
              </p>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="related-product-details">
          <p><strong>Поставщик:</strong> {product.provider}</p>
          <p><strong>Страна:</strong> {product.country}</p>
          <p><strong>Город:</strong> {product.city}</p>
          {product.parent_detail && (
            <div className="related-parent-product-section">
              <h3>Товар МПР</h3>
              <p><strong>Код:</strong> {product.parent_detail.code}</p>
              <p>
                <strong>Категория:</strong> {product.parent_detail.category_description || product.parent_detail.category}
              </p>
              <p>
                <strong>Группа:</strong> {product.parent_detail.group_description || product.parent_detail.group}
              </p>
              <p>
                <strong>Вид:</strong> {product.parent_detail.vid_description || product.parent_detail.vid}
              </p>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="mpr-product-detail-container">
      <h1>{product.description}</h1>
      <div className="mpr-product-info">
        <div className="mpr-product-image">
          {product.photo_path ? (
            <DefaultImage
              src={`/media/mpr_product/${product.photo_path}`}
              alt={product.description}
              style={{ maxWidth: '300px' }}
            />
          ) : (
            <img src="/static/default.jpg" alt={product.description} />
          )}
        </div>
        <div className="mpr-product-fields">
          <p><strong>Артикул:</strong> {product.code}</p>
          <p><strong>Поставщик:</strong> {product.provider}</p>
          <p><strong>Дата начала продаж:</strong> {formatDate(product.date_start_sell)}</p>
          <p className="price-highlight"><strong>Цена закупки:</strong> <strong>{product.cz}</strong></p>
          <p><strong>Цена продажи:</strong> {product.cp}</p>
          <p><strong>Наценка:</strong> {(product.markup * 100).toFixed(0)}%</p>
          <p><strong>Маржа:</strong> {(product.margin * 100).toFixed(0)}%</p>
          <p><strong>Продажи (за 6 мес.):</strong> {product.avg_qty_sales_6_months}</p>
          {/* *** НОВЫЙ КОД *** */}
          <p><strong>Категория:</strong> {categoryDescription}</p>
          <p><strong>Группа:</strong> {groupDescription}</p>
          <p><strong>Вид:</strong> {vidDescription}</p>
          {/* *** КОНЕЦ НОВОГО КОДА *** */}
        </div>
      </div>
      <div className="action-buttons">
        <Link to={`/market-product/create/${product.encode}`} className="btn btn-success">
          Добавить рыночный товар
        </Link>
        <button onClick={handleBack} className="btn btn-secondary">
          Вернуться к списку
        </button>
      </div>

      {marketProducts.length > 0 && (
        <div className="market-products-section">
          <h2>Связанные рыночные товары</h2>
          <div className="related-products-grid">
            {marketProducts.map((product) => {
              const detailLink = `/market-product/${product.id}`;
              const imagePath = product.photo_path ? `/media/market_product/${product.photo_path}` : '/static/default.jpg';

              return (
                <div key={product.id} className="related-product-card">
                  <Link to={detailLink}>
                    <div className="related-product-image-container"> {/* Исправлено: Используем правильный класс */}
                      <DefaultImage src={imagePath} alt={product.description} />
                    </div>
                  </Link>
                  {renderProductDetails(product)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MPRProductDetail;
