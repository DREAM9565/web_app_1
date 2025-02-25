// src/components/SortControl.jsx
import React, { useContext } from 'react';
import { FilterContext } from '../context/FilterContext';
import '../styles/SortControl.css';

const SortControl = () => {
  const { filters, updateFilters } = useContext(FilterContext);

  const handlePrimaryChange = (e) => {
    const primary = e.target.value;
    // Формируем ordering: если выбран вторичный порядок, объединяем через запятую
    const ordering = primary + (filters.secondaryOrdering ? `,${filters.secondaryOrdering}` : '');
    updateFilters({ primaryOrdering: primary, ordering });
  };

  const handleSecondaryChange = (e) => {
    const secondary = e.target.value;
    const ordering = (filters.primaryOrdering || '') + (secondary ? `,${secondary}` : '');
    updateFilters({ secondaryOrdering: secondary, ordering });
  };

  return (
    <div className="sort-control">
      <select value={filters.primaryOrdering || ''} onChange={handlePrimaryChange}>
        <option value="">Сортировать по умолчанию</option>
        <option value="date_start_sell">По дате начала продаж</option>
        <option value="cz">По цене закупки (возрастание)</option>
        <option value="-cz">По цене закупки (убывание)</option>
        <option value="cp">По цене продажи (возрастание)</option>
        <option value="-cp">По цене продажи (убывание)</option>
        {/* Добавьте другие варианты, если нужно */}
      </select>
      <select value={filters.secondaryOrdering || ''} onChange={handleSecondaryChange}>
        <option value="">Без дополнительной сортировки</option>
        <option value="markup">По наценке (возрастание)</option>
        <option value="-markup">По наценке (убывание)</option>
        <option value="margin">По марже (возрастание)</option>
        <option value="-margin">По марже (убывание)</option>
        <option value="avg_qty_sales_6_months">По продажам (за 6 мес.) (возрастание)</option>
        <option value="-avg_qty_sales_6_months">По продажам (за 6 мес.) (убывание)</option>
      </select>
    </div>
  );
};

export default SortControl;
