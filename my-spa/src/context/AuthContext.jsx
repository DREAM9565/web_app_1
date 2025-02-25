// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Глобально включаем отправку cookies
axios.defaults.withCredentials = true;

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); 
  // useNavigate можно использовать в React Router 6, 
  // если ваш AuthContext "обёрнут" внутри BrowserRouter/Router

  useEffect(() => {
    // --- 1) Настраиваем глобальный интерцептор axios ---
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 403) {
          // Сервер вернул 403 => значит сессии нет / пользователь не авторизован
          // 1) Сбрасываем user
          setUser(null);
          // 2) Переходим на /login
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    // При размонтировании убираем интерцептор
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  useEffect(() => {
    // При старте пытаемся узнать "whoami"
    const fetchWhoAmI = async () => {
      try {
        const resp = await axios.get('/api/accounts/whoami/', {
          withCredentials: true
        });
        setUser(resp.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchWhoAmI();
  }, []);

  const logout = async () => {
    try {
      await axios.post('/api/accounts/logout/', null, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.error('Ошибка логаута:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
