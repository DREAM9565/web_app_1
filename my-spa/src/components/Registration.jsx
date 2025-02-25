import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Registration.css';

const Registration = () => {
  // Объявляем состояния для всех полей формы
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState(null);

  // Хук для навигации после успешной регистрации
  const navigate = useNavigate();

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault(); // предотвращаем стандартное поведение формы
    if (password !== password2) {
      setError("Пароли не совпадают");
      return;
    }
    try {
      // Отправляем POST-запрос на эндпоинт регистрации
      await axios.post(
        '/api/accounts/register/',
        { username, email, password, password2 },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      // После успешной регистрации перенаправляем пользователя на страницу логина
      navigate('/login');
    } catch (err) {
      console.error("Ошибка регистрации:", err);
      setError(err.response?.data?.detail || "Ошибка регистрации");
    }
  };

  return (
    <div className="registration-container">
      <h1>Регистрация</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Имя пользователя:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Пароль:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Подтверждение пароля:</label>
          <input 
            type="password" 
            value={password2} 
            onChange={(e) => setPassword2(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" className="btn btn-primary">Зарегистрироваться</button>
      </form>
      <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
    </div>
  );
};

export default Registration;
