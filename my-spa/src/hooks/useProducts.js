import { useState, useCallback } from 'react';
import axios from 'axios';

export const useProducts = (filters) => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Загрузка товаров
  const fetchProducts = useCallback(
    async (pageNum, reset = false) => {
      if (isLoading || (!reset && !hasMore)) return;

      setIsLoading(true);
      try {
        const endpoint = filters.catalog === 'mpr' ? '/api/products/' : '/api/market-products/';
        const response = await axios.get(endpoint, {
          params: { ...filters, page: pageNum },
        });

        const { results, next } = response.data;
        const newProducts = Array.isArray(results) ? results : [];

        if (reset) {
          setProducts(newProducts);
        } else {
          setProducts((prev) => [...prev, ...newProducts]);
        }

        setHasMore(!!next);
        setPage(pageNum);
      } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, isLoading, hasMore]
  );

  // Сброс при изменении фильтров
  const resetProducts = useCallback(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
  }, [fetchProducts]);

  return {
    products,
    page,
    hasMore,
    isLoading,
    fetchProducts,
    resetProducts,
  };
};