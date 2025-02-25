// src/components/Header.jsx
import React, { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { FilterContext } from '../context/FilterContext';
import '../styles/Header.css';

const Header = ({ toggleSidebar, searchQuery = '', onSearchChange }) => {
  const location = useLocation();
  const { filters, updateFilters } = useContext(FilterContext);

  // Отображаем поиск и breadcrumb только на "/products"
  const showSearch = location.pathname === '/products';

  // Генерируем breadcrumb (оставляем без изменений)
  const getBreadcrumb = () => {
    let parts = [];
    if (filters.catalog === 'mpr') {
      parts.push('Каталог МПР');
    } else if (filters.catalog === 'market') {
      parts.push('Каталог Рыночных товаров');
    }
    if (filters.category_description) {
      parts.push(filters.category_description);
    }
    if (filters.group_description) {
      parts.push(filters.group_description);
    }
    if (filters.vid_description) {
      parts.push(filters.vid_description);
    }
    if (filters.search) {
      parts.push(`Поиск: "${filters.search}"`);
    }
    return parts.join(' / ');
  };

  const breadcrumb = getBreadcrumb();
  const [expanded, setExpanded] = useState(false);

  const handleFocus = () => setExpanded(true);
  const handleBlur = () => setExpanded(false);
  const handleClear = () => onSearchChange('');
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setExpanded(false); // Сужаем строку поиска
      e.target.blur();    // Убираем фокус с input, чтобы закрыть клавиатуру
    }
  };

  // Опции сортировки для разных каталогов
  const mprSortOptions = [
    { value: "", label: "По умолчанию" },
    { value: "cz", label: "Цена закупки (возрастание)" },
    { value: "-cz", label: "Цена закупки (убывание)" },
    { value: "markup", label: "Наценка (возрастание)" },
    { value: "-markup", label: "Наценка (убывание)" },
    { value: "avg_qty_sales_6_months", label: "Продажи (за 6 мес.)(возрастание)" },
    { value: "-avg_qty_sales_6_months", label: "Продажи (за 6 мес.)(убывание)" }
  ];

  const marketSortOptions = [
    { value: "", label: "По умолчанию" },
    { value: "date_create", label: "Дата создания" },
    { value: "cz", label: "Цена закупки (возрастание)" },
    { value: "-cz", label: "Цена закупки (убывание)" },
    { value: "price_list_delivery_15", label: "Доставка 15 дней (возрастание)" },
    { value: "-price_list_delivery_15", label: "Доставка 15 дней (убывание)" }
  ];

  // Выбираем набор опций в зависимости от выбранного каталога
  const primaryOptions = filters.catalog === 'mpr' ? mprSortOptions : marketSortOptions;
  const secondaryOptions = primaryOptions;

  const handlePrimaryChange = (e) => {
    const primary = e.target.value;
    const ordering = primary + (filters.secondaryOrdering ? `,${filters.secondaryOrdering}` : '');
    updateFilters({ primaryOrdering: primary, ordering });
  };

  const handleSecondaryChange = (e) => {
    const secondary = e.target.value;
    const ordering = (filters.primaryOrdering || '') + (secondary ? `,${secondary}` : '');
    updateFilters({ secondaryOrdering: secondary, ordering });
  };

  return (
    <header className="header">
      <div className="header-left">
        {/* Кнопка, открывающая сайдбар (где теперь «Выйти») */}
        <button className="sidebar-toggle" onClick={toggleSidebar}>
        </button>
      </div>
      {showSearch && (
        <>
          <div className="header-center">
            <div className="breadcrumb">{breadcrumb}</div>
            {/* Новый блок сортировки, размещён ниже breadcrumb */}
            <div className="sort-control">
              <select
                value={filters.primaryOrdering || ''}
                onChange={handlePrimaryChange}
                className="sort-select"
              >
                {primaryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="header-right">
            <div className="search-container">
              <input
                type="text"
                className={`search-input ${expanded ? 'expanded' : ''}`}
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
              />
              {searchQuery && (
                <button className="clear-search" onClick={handleClear}>
                  Очистить
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
