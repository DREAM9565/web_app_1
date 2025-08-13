import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/UnifiedSidebar.css';
import { AuthContext } from '../context/AuthContext';

// Функция для "достраивания" недостающих полей фильтров
function fillMissingFilters(merged, categories) {
  if (merged.vid_id && !merged.group_id) {
    const vidIdNum = Number(merged.vid_id);
    for (let cat of categories) {
      if (!cat.groups) continue;
      for (let grp of cat.groups) {
        if (!grp.vids) continue;
        const foundVid = grp.vids.find((v) => Number(v.vid_id) === vidIdNum);
        if (foundVid) {
          merged.group_id = grp.group_id;
          merged.group_description = grp.description;
          merged.category_id = cat.category_id;
          merged.category_description = cat.description;
          break;
        }
      }
    }
  } else if (merged.group_id && !merged.category_id) {
    const groupIdNum = Number(merged.group_id);
    for (let cat of categories) {
      if (!cat.groups) continue;
      const foundGroup = cat.groups.find((g) => Number(g.group_id) === groupIdNum);
      if (foundGroup) {
        merged.category_id = cat.category_id;
        merged.category_description = cat.description;
        break;
      }
    }
  }
  return merged;
}

// Функция для определения начального состояния меню
const getInitialState = (filters, categories) => {
  if (filters.vid_id) {
    const vidIdNum = Number(filters.vid_id);
    for (let cat of categories) {
      if (!cat.groups) continue;
      for (let grp of cat.groups) {
        if (!grp.vids) continue;
        const foundVid = grp.vids.find((v) => Number(v.vid_id) === vidIdNum);
        if (foundVid) {
          return {
            mobileLevel: 2,
            selectedCategory: cat,
            selectedGroup: grp,
          };
        }
      }
    }
  } else if (filters.group_id) {
    const groupIdNum = Number(filters.group_id);
    for (let cat of categories) {
      if (!cat.groups) continue;
      const foundGroup = cat.groups.find((g) => Number(g.group_id) === groupIdNum);
      if (foundGroup) {
        return {
          mobileLevel: 1,
          selectedCategory: cat,
          selectedGroup: foundGroup,
        };
      }
    }
  } else if (filters.category_id) {
    const categoryIdNum = Number(filters.category_id);
    const foundCategory = categories.find((c) => Number(c.category_id) === categoryIdNum);
    if (foundCategory) {
      return {
        mobileLevel: 1,
        selectedCategory: foundCategory,
        selectedGroup: null,
      };
    }
  }
  return {
    mobileLevel: 0,
    selectedCategory: null,
    selectedGroup: null,
  };
};

const UnifiedSidebar = ({
  visible,
  onApplyFilter,
  onClose,
  clearFilters,
  currentFilters,
}) => {
  const [mobileLevel, setMobileLevel] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeCatalog, setActiveCatalog] = useState(currentFilters.catalog || 'mpr');

  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const applyFilterAndRedirect = (newFilterData) => {
    let merged = { ...currentFilters, ...newFilterData };
    merged = fillMissingFilters(merged, categories);
    onApplyFilter(merged);
    onClose();
  };

  const handleLogoutClick = async () => {
    await logout();
    onClose();
  };

  const blockScroll = useCallback(() => {
    document.body.style.overflow = 'hidden';
  }, []);

  const allowScroll = useCallback(() => {
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    if (visible) {
      blockScroll();
    } else {
      allowScroll();
    }
    return () => allowScroll();
  }, [visible, blockScroll, allowScroll]);

  // Загрузка категорий только если их еще нет
  useEffect(() => {
    if (visible && categories.length === 0) {
      axios
        .get('/api/categories/')
        .then((response) => {
          const data = response.data.results || response.data;
          setCategories(data);
        })
        .catch((error) => console.error('Ошибка загрузки категорий:', error));
    }
  }, [visible]);

  // Установка начального состояния меню на основе currentFilters
  useEffect(() => {
    if (visible && categories.length > 0) {
      const { mobileLevel, selectedCategory, selectedGroup } = getInitialState(currentFilters, categories);
      setMobileLevel(mobileLevel);
      setSelectedCategory(selectedCategory);
      setSelectedGroup(selectedGroup);
    }
  }, [visible, categories, currentFilters]);

  // Сброс состояния при закрытии
  useEffect(() => {
    if (!visible) {
      setMobileLevel(0);
      setSelectedCategory(null);
      setSelectedGroup(null);
    }
  }, [visible]);

  function handleCategoryClick(category) {
    if (category.groups && category.groups.length > 0) {
      setMobileLevel(1);
      setSelectedCategory(category);
    } else {
      applyFilterAndRedirect({
        category_id: category.category_id,
        category_description: category.description,
        group_id: '',
        group_description: '',
        vid_id: '',
        vid_description: '',
      });
    }
  }

  function handleGroupClick(group) {
    if (group.vids && group.vids.length > 0) {
      setMobileLevel(2);
      setSelectedGroup(group);
    } else {
      applyFilterAndRedirect({
        group_id: group.group_id,
        group_description: group.description,
        vid_id: '',
        vid_description: '',
      });
    }
  }

  function handleVidClick(vid) {
    applyFilterAndRedirect({
      vid_id: vid.vid_id,
      vid_description: vid.description,
    });
  }

  function handleBack() {
    if (mobileLevel === 2) {
      setMobileLevel(1);
      setSelectedGroup(null);
    } else if (mobileLevel === 1) {
      setMobileLevel(0);
      setSelectedCategory(null);
    }
  }

  function handleHeaderClick() {
    if (mobileLevel === 1 && selectedCategory) {
      applyFilterAndRedirect({
        category_id: selectedCategory.category_id,
        category_description: selectedCategory.description,
        group_id: '',
        group_description: '',
        vid_id: '',
        vid_description: '',
      });
    } else if (mobileLevel === 2 && selectedGroup && selectedCategory) {
      applyFilterAndRedirect({
        group_id: selectedGroup.group_id,
        group_description: selectedGroup.description,
        vid_id: '',
        vid_description: '',
      });
    }
  }

  const handleHomeClick = () => {
    applyFilterAndRedirect({
      catalog: activeCatalog,
      search: '',
      category_id: '',
      category_description: '',
      group_id: '',
      group_description: '',
      vid_id: '',
      vid_description: '',
    });
  };

  const switchCatalog = (newCatalog) => {
    setActiveCatalog(newCatalog);
    applyFilterAndRedirect({ catalog: newCatalog });
  };

  return (
    <>
      {visible && <div className="sidebar-overlay" onClick={onClose}></div>}
      <div className={`unified-sidebar ${visible ? 'show' : 'hide'}`} onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <div className="header-left">
            <button className="menu-button" onClick={onClose}>
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h30M3 6h30M3 18h30"></path>
              </svg>
            </button>
            <button className="back-button" onClick={handleBack} style={{ display: mobileLevel > 0 ? 'inline-block' : 'none' }}>
              ← Назад
            </button>
            <div className="header-title-block">
              <h4 className={`header-title ${mobileLevel > 0 ? 'active' : ''}`} onClick={handleHeaderClick}>
                {mobileLevel === 0 && 'Категории'}
                {mobileLevel === 1 && selectedCategory && `${selectedCategory.description} – ${selectedCategory.sku} SKU; ${selectedCategory.ost_cz} ост. цз`}
                {mobileLevel === 2 && selectedGroup && `${selectedGroup.description} – ${selectedGroup.sku} SKU; ${selectedGroup.ost_cz} ост. цз`}
              </h4>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info-block">
              {user && (
                <>
                  <span className="user-label">Пользователь: {user.username}</span>
                  <button className="logout-button" onClick={handleLogoutClick}>Выйти</button>
                </>
              )}
            </div>
            <div className="catalog-buttons-block">
              <div className="catalog-buttons-row">
                <button
                  className={`catalog-button ${activeCatalog === 'mpr' ? 'active' : ''}`}
                  onClick={() => switchCatalog('mpr')}
                >
                  Каталог МПР
                </button>
                <button
                  className={`catalog-button ${activeCatalog === 'market' ? 'active' : ''}`}
                  onClick={() => switchCatalog('market')}
                >
                  Каталог Рыночных товаров
                </button>
              </div>
              {user?.is_staff && (
                <button
                  className="catalog-button admin-button"
                  onClick={() => { navigate('/admin/users'); onClose(); }}
                >
                  Управление пользователями
                </button>
              )}
              <button className="catalog-home-button" onClick={handleHomeClick}>
                Главная
              </button>
              <button
                className="catalog-button new-page-button"
                onClick={() => { navigate('/requests'); onClose(); }}
              >
                Перейти на новую страницу
              </button>
            </div>
          </div>
        </div>
        <div className="sidebar-content">
          {mobileLevel === 0 && (
            <div className="item-list">
              {categories.map((category) => (
                <div key={category.category_id} className="item" onClick={() => handleCategoryClick(category)}>
                  {category.description}<br />
                  {category.sku} SKU<br />
                  {category.ost_cz} ост. цз
                </div>
              ))}
            </div>
          )}

          {mobileLevel === 1 && selectedCategory && (
            <div className="item-list">
              {selectedCategory.groups &&
                selectedCategory.groups.map((group) => (
                  <div key={group.group_id} className="item" onClick={() => handleGroupClick(group)}>
                    {group.description}<br />
                    {group.sku} SKU<br />
                    {group.ost_cz} ост. цз
                  </div>
                ))}
            </div>
          )}

          {mobileLevel === 2 && selectedGroup && (
            <div className="item-list">
              {selectedGroup.vids &&
                selectedGroup.vids.map((vid) => (
                  <div key={vid.vid_id} className="item" onClick={() => handleVidClick(vid)}>
                    {vid.description}<br />
                    {vid.sku} SKU<br />
                    {vid.ost_cz} ост. цз
                  </div>
                ))}
            </div>
          )}
        </div>

        <button className="clear-button" onClick={() => { clearFilters(); onClose(); }}>
          Сброс фильтра
        </button>
      </div>
    </>
  );
};

export default UnifiedSidebar;