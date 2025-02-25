import React from 'react';
import '../styles/ProductStyles.css';
import DefaultImage from './DefaultImage';
import { Link, useNavigate } from 'react-router-dom';

const formatDate = (dateString) => {
  if (!dateString) {
    return ''; // Возвращаем пустую строку или значение по умолчанию
  }

  const date = new Date(dateString);

  // Проверяем, является ли дата валидной
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateString); // Логируем ошибку для отладки
    return ''; // Возвращаем пустую строку или значение по умолчанию
  }

  const formatter = new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
};

const ProductCard = ({ product, catalog }) => {
  const navigate = useNavigate(); // Добавляем хук для навигации
  const imagePath =
    catalog === 'mpr'
      ? `/media/mpr_product/${product.photo_path}`
      : `/media/market_product/${product.photo_path}`;

  if (catalog === 'mpr') {
    const handleAddClick = (e) => {
      e.preventDefault(); // Предотвращаем действие внешней ссылки
      e.stopPropagation(); // Останавливаем всплытие события
      navigate(`/market-product/create/${product.encode}`);
    };

    return (
      <div className="product-card">
        <div className="product-image-container">
          <DefaultImage src={imagePath} alt={product.description} />
        </div>
        <div className="product-details">
          <p
            className="product-name"><strong>Наименование:</strong>{product.description}
          </p>
          <p>
            <strong>Поставщик:</strong> {product.provider}
          </p>
          <p>
            <strong>Дата начала продаж:</strong> {formatDate(product.date_start_sell)}
          </p>
          <p className="price-highlight">
            <strong>Цена закупки:</strong> <strong>{product.cz}</strong>
          </p>
          <p>
            <strong>Цена продажи:</strong> {product.cp}
          </p>
          <p>
            <strong>Наценка:</strong> {(product.markup * 100).toFixed(0)}%   <strong>Маржа:</strong> {(product.margin * 100).toFixed(0)}%
          </p>
          <p>
            <strong>Продажи (за 6 мес.):</strong> {product.avg_qty_sales_6_months}
          </p>
        </div>
        {/* Кнопка добавления товара заменена на <button> */}
        <button className="add-button" onClick={handleAddClick}>
          +
        </button>
      </div>
    );
  }

  if (catalog === 'market') {
    if (product.country === 'Россия') {
      return (
        <div className="product-card">
          <div className="product-image-container">
            <DefaultImage src={imagePath} alt={product.description} />
          </div>
          <div className="product-details">
            <p>
              <strong>Наименование:</strong> {product.description}
            </p>
            <p>
              <strong>Дата создания:</strong> {formatDate(product.date_create)}
            </p>
            <p className="price-highlight">
              <strong>Цена закупки:</strong> <strong>{product.cz}</strong>
            </p>
            <p>
              <strong>Поставщик:</strong> {product.provider}
            </p>
            <p>
              <strong>Количество в упаковке:</strong> {product.qty_per_package}
            </p>
            <p>
              <strong>Минимальная партия:</strong> {product.min_shipment}
            </p>
            <p>
              <strong>Страна:</strong> {product.country}
            </p>
            <p>
              <strong>Город:</strong> {product.city}
            </p>
            <p>
              <strong>Срок доставки на склад:</strong> {product.delivery_time}
            </p>
            {product.parent_detail && (
              <div className="parent-product-section">
                <h3>Товар МПР</h3>
                <p>
                  <strong>Код:</strong> {product.parent_detail.code}
                </p>
                <p>
                  <strong>Категория:</strong>{' '}
                  {product.parent_detail.category_description ||
                    product.parent_detail.category}
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
        </div>
      );
    } else if (product.country === 'Китай') {
      return (
        <div className="product-card">
          <div className="product-image-container">
            <DefaultImage src={imagePath} alt={product.description} />
          </div>
          <div className="product-details">
            <p>
              <strong>Наименование:</strong> {product.description}
            </p>
            <p>
              <strong>Валюта:</strong> {product.currency_name || 'нет'}
            </p>
            <p className="price-highlight">
              <strong>Цена закупки:</strong> <strong>{product.cz}</strong>
            </p>
            <p>
              <strong>Количество в упаковке:</strong> {product.qty_per_package}
            </p>
            <p>
              <strong>Минимальная партия:</strong> {product.min_shipment}
            </p>
            <p>
              <strong>Страна:</strong> {product.country}
            </p>
            <p>
              <strong>Город:</strong> {product.city}
            </p>
            <p>
              <strong>Цена доставки в РФ (15 дней):</strong>{' '}
              {product.price_list_delivery_15}
            </p>
            <p>
              <strong>Цена доставки в РФ (30 дней):</strong>{' '}
              {product.price_list_delivery_30}
            </p>
            <p>
              <strong>Цена доставки в РФ (45 дней):</strong>{' '}
              {product.price_list_delivery_45}
            </p>
            {product.parent_detail && (
              <div className="parent-product-section">
                <h3>Товар МПР</h3>
                <p>
                  <strong>Код:</strong> {product.parent_detail.code}
                </p>
                <p>
                  <strong>Категория:</strong>{' '}
                  {product.parent_detail.category_description ||
                    product.parent_detail.category}
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
        </div>
      );
    } else {
      return (
        <div className="product-card">
          <div className="product-image-container">
            <DefaultImage src={imagePath} alt={product.description} />
          </div>
          <div className="product-details">
            <p>
              <strong>Поставщик:</strong> {product.provider}
            </p>
            <p>
              <strong>Страна:</strong> {product.country}
            </p>
            <p>
              <strong>Город:</strong> {product.city}
            </p>
            {product.parent_detail && (
              <div className="parent-product-section">
                <h3>Товар МПР</h3>
                <p>
                  <strong>Код:</strong> {product.parent_detail.code}
                </p>
                <p>
                  <strong>Категория:</strong>{' '}
                  {product.parent_detail.category_description ||
                    product.parent_detail.category}
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
        </div>
      );
    }
  }

  // На всякий случай fallback
  return (
    <div className="product-card">
      <div className="product-image-container">
        <DefaultImage src={imagePath} alt={product.description} />
      </div>
      <div className="product-details">
        <p>
          <strong>Поставщик:</strong> {product.provider}
        </p>
        <p>
          <strong>Страна:</strong> {product.country}
        </p>
        <p>
          <strong>Город:</strong> {product.city}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;