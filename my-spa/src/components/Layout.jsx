// src/components/Layout.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FilterContext } from '../context/FilterContext';
import { AuthContext } from '../context/AuthContext';
import Header from './Header';
import UnifiedSidebar from './UnifiedSidebar';
import ScrollToTop from './ScrollToTop';

const Layout = () => {
  const navigate = useNavigate();

  // AuthContext для проверки авторизации
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  // Логика фильтров
  const { filters, updateFilters } = useContext(FilterContext);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);
  const closeSidebar = () => setSidebarVisible(false);

  const makeQueryString = (obj) => {
    return new URLSearchParams(obj).toString();
  };

  // Применяем новый фильтр
  const onApplyFilter = (newFilters) => {
    const merged = { ...filters, ...newFilters };
    updateFilters(merged);

    const qs = makeQueryString(merged);
    navigate(`/products?${qs}`, { replace: true });
  };

  // Сброс, но сохраняем catalog
  const clearFiltersHandler = () => {
    const newFilters = {
      catalog: filters.catalog,
      search: '',
      category_id: '',
      category_description: '',
      group_id: '',
      group_description: '',
      vid_id: '',
      vid_description: ''
    };
    updateFilters(newFilters);
    const qs = makeQueryString(newFilters);
    navigate(`/products?${qs}`, { replace: true });
  };

  // Поиск
  const onSearchChange = (value) => {
    const merged = { ...filters, search: value };
    updateFilters(merged);
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Header без кнопки «Выйти» и имени пользователя */}
      <Header 
        searchQuery={filters.search}
        onSearchChange={onSearchChange}
        toggleSidebar={toggleSidebar}
      />

      {/* Сайдбар, где теперь расположена кнопка «Выйти» и имя пользователя */}
      <UnifiedSidebar
        visible={sidebarVisible}
        onApplyFilter={onApplyFilter}
        onClose={closeSidebar}
        clearFilters={clearFiltersHandler}
        currentFilters={filters}
      />

      <div className="layout-content">
        <ScrollToTop />
        <Outlet />
      </div>
    </>
  );
};

export default Layout;
