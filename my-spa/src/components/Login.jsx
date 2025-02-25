import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Login.css'; // или import styles from './Login.module.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // POST на /api/accounts/login/
      await axios.post('/api/accounts/login/', { username, password });
      // Опционально: запрос whoami заново
      const resp = await axios.get('/api/accounts/whoami/');
      setUser(resp.data); // теперь user = {username, email}
      // Переходим на список товаров
      navigate('/products');
    } catch (err) {
      console.error("Ошибка логина:", err);
      setError(err.response?.data?.detail || "Ошибка логина");
    }
  };

  return (
  <div className="login-page">
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Вход</h1>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>Имя пользователя:</label>
          <input 
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Пароль:</label>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="login-button" type="submit">Войти</button>
      </form>
    </div>
  </div>
  );
};

export default Login;
