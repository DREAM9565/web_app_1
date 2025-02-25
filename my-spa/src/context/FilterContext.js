// src/context/FilterContext.js
import React, { createContext, useState } from 'react';

export const FilterContext = createContext();

// Пытаемся считать последний выбранный каталог из localStorage.
// Если нет - оставим 'mpr'
const savedCatalog = localStorage.getItem('selectedCatalog') || 'mpr';

const defaultFilters = {
  catalog: savedCatalog,        // <-- Вместо фиксированного 'mpr'
  search: '',
  category_id: '',
  category_description: '',
  group_id: '',
  group_description: '',
  vid_id: '',
  vid_description: ''
};

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState(defaultFilters);

  const updateFilters = (newFilters) => {
    setFilters((prev) => {
      const merged = { ...prev, ...newFilters };
      // Если пользователь сменил catalog, записываем в localStorage
      if (merged.catalog) {
        localStorage.setItem('selectedCatalog', merged.catalog);
      }
      return merged;
    });
  };

  const resetFilters = () => {
    // Сброс к дефолту, но и localStorage подчищаем
    localStorage.setItem('selectedCatalog', 'mpr');
    setFilters({
      ...defaultFilters,
      catalog: 'mpr', // при сбросе будет именно mpr
    });
  };

  return (
    <FilterContext.Provider value={{ filters, updateFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};
