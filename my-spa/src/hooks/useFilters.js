import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useFilters = () => {
  const location = useLocation();
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newFilters = {
      catalog: params.get('catalog') || localStorage.getItem('selectedCatalog') || 'mpr',
      search: params.get('search') || '',
      category_id: params.get('category_id') || '',
      group_id: params.get('group_id') || '',
      vid_id: params.get('vid_id') || '',
      primaryOrdering: params.get('primaryOrdering') || '',
      secondaryOrdering: params.get('secondaryOrdering') || '',
      ordering: params.get('ordering') || '',
    };
    setFilters(newFilters);
  }, [location.search]);

  return filters;
};