// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProductList from './components/ProductList';
import MPRProductDetail from './components/MPRProductDetail';
import MarketProductDetail from './components/MarketProductDetail';
import MarketProductForm from './components/MarketProductForm';
import EditMarketProduct from './components/EditMarketProduct';
import Login from './components/Login';
import Registration from './components/Registration';
import { FilterProvider } from './context/FilterContext';
import { AuthProvider } from './context/AuthContext';
import AdminUserList from './components/AdminUserList';
import AdminUserEdit from './components/AdminUserEdit';
import ProductRequestForm from './components/ProductRequestForm';
import RequestsPage from './components/RequestsPage';
import RequestDetailPage from './components/RequestDetailPage';
import AddProductForm from './components/AddProductForm';
import RequestMarketProductDetail from './components/RequestMarketProductDetail';


function App() {
  return (
    <Router>
      {/* Сначала AuthProvider, потом FilterProvider */}
      <AuthProvider>
        <FilterProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />

            {/* Закрытые маршруты */}
            <Route path="/" element={<Layout />}>
              <Route path="products" element={<ProductList />} />
              <Route path="product/:encode" element={<MPRProductDetail />} />
              <Route path="market-product/create/:parent_encode" element={<MarketProductForm />} />
              <Route path="market-product/:id" element={<MarketProductDetail />} />
              <Route path="market-product/edit/:id" element={<EditMarketProduct />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/requests/new" element={<ProductRequestForm />} />
              <Route path="/requests/:id" element={<RequestDetailPage />} />
              <Route path="/requests/:id/add-product" element={<AddProductForm />} />
              <Route path="/requests/:requestId/market-products/:productId" element={<RequestMarketProductDetail />} />
              {/* Добавляем маршруты для управления пользователями */}
              <Route path="admin/users" element={<AdminUserList />} />
              <Route path="admin/users/create" element={<AdminUserEdit />} />
              <Route path="admin/users/:id" element={<AdminUserEdit />} />
            </Route>
            
            <Route path="*" element={<div>Страница не найдена</div>} />
          </Routes>
        </FilterProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
