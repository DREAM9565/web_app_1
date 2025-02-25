// src/components/ProductList.jsx
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FilterContext } from '../context/FilterContext';
import ProductCard from './ProductCard';
import '../styles/ProductStyles.css';

const ProductList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { filters, updateFilters } = useContext(FilterContext);

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Эффект для обновления фильтров и начальной загрузки товаров
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newFilters = {
      catalog: params.get('catalog') || localStorage.getItem('selectedCatalog') || 'mpr',
      search: params.get('search') || '',
      category_id: params.get('category_id') || '',
      category_description: params.get('category_description') || '',
      group_id: params.get('group_id') || '',
      group_description: params.get('group_description') || '',
      vid_id: params.get('vid_id') || '',
      vid_description: params.get('vid_description') || ''
    };
    // Обновляем фильтры в контексте полностью (а не сливая со старыми)
    updateFilters(newFilters);
    setPage(1);
    fetchProducts(1, true, newFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Запрос товаров с возможностью передачи кастомных фильтров
  const fetchProducts = useCallback(async (pageNum = 1, reset = false, customFilters) => {
    setLoading(true);
    try {
      const appliedFilters = customFilters || filters;
      const apiEndpoint = appliedFilters.catalog === 'mpr'
        ? '/api/products/'
        : '/api/market-products/';
      const params = { ...appliedFilters, page: pageNum };
      const response = await axios.get(apiEndpoint, { params });
      const data = response.data;
      const results = Array.isArray(data.results) ? data.results : [];
      if (reset) {
        setProducts(results);
      } else {
        setProducts((prev) => [...prev, ...results]);
      }
      setHasMore(data.next !== null);
    } catch (error) {
      console.error("Ошибка при получении товаров:", error);
      if (reset) setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

// Эффект для поиска с дебаунсом (реальный поиск)
useEffect(() => {
  const delayDebounceFn = setTimeout(() => {
    setPage(1);
    fetchProducts(1, true);
  }, 200); // 200 мс задержка
  return () => clearTimeout(delayDebounceFn);
}, [filters.search, fetchProducts]);


  // Бесконечная подгрузка (с универсальным вычислением прокрутки)
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;
      if (filters.search.trim() !== '') return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const windowHeight = window.innerHeight;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );

      if (scrollTop + windowHeight >= docHeight - 50) {
        fetchProducts(page + 1);
        setPage(prev => prev + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, page, fetchProducts, filters.search]);

  // Если высоты не хватает, подгружаем (универсальное вычисление)
  useEffect(() => {
    const checkIfNeedMore = () => {
      const windowHeight = window.innerHeight;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
      if (
        docHeight <= windowHeight &&
        hasMore &&
        !loading &&
        filters.search.trim() === ''
      ) {
        fetchProducts(page + 1);
        setPage(prev => prev + 1);
      }
    };
    checkIfNeedMore();
  }, [products, hasMore, loading, fetchProducts, page, filters.search]);

  // Блок хлебных крошек убран, так как теперь он отображается в Header

  return (
    <div className="product-list-container">
      <div className={filters.catalog === 'mpr' ? "product-grid mpr-grid" : "product-grid"}>
        {products.map((product) => {
          const linkTo = filters.catalog === 'mpr'
            ? `/product/${product.encode}`
            : `/market-product/${product.id}`;
          return (
            <Link key={product.encode || product.id} to={linkTo} state={{ filters }}>
              <ProductCard product={product} catalog={filters.catalog} />
            </Link>
          );
        })}
      </div>
      {loading && <div className="loading">Загрузка...</div>}
    </div>
  );
};

export default ProductList;
