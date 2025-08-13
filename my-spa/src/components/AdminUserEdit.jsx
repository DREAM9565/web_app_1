import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/AdminUsers.css';

const AdminUserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = id === 'create' || !id; // Создание, если id — 'create' или undefined

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState(''); // Новое поле
  const [lastName, setLastName] = useState('');   // Новое поле
  const [isStaff, setIsStaff] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Добавляем состояние для роли
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // Добавляем состояние для отображения пароля

  // Определяем доступные роли
  const roles = [
    { value: 'admin', label: 'Администратор' },
    { value: 'km', label: 'Категорийный менеджер' },
    { value: 'buyer', label: 'Байер' },
    { value: 'user', label: 'Пользователь' }
  ];

  useEffect(() => {
    console.log('ID из useParams:', id);
    console.log('isCreate:', isCreate);

    if (!isCreate && id && !isNaN(id)) { // Редактирование, если id — число
      const fetchUser = async () => {
        try {
          const resp = await axios.get(`/api/accounts/admin/users/${id}/`);
          const data = resp.data;
          setUsername(data.username);
          setEmail(data.email);
          setFirstName(data.first_name || ''); // Загружаем first_name
          setLastName(data.last_name || '');   // Загружаем last_name
          setIsStaff(data.is_staff);
          setIsSuperuser(data.is_superuser);
          // Устанавливаем роль из профиля пользователя
          if (data.profile && data.profile.role) {
            setRole(data.profile.role);
          }
        } catch (err) {
          console.error('Ошибка при загрузке пользователя:', err.response?.data || err.message);
          setError('Не удалось загрузить пользователя');
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    } else {
      setLoading(false); // Для создания сразу готовы
    }
  }, [id, isCreate]);

  const handleSave = async () => {
    try {
      const obj = {
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        is_staff: isStaff,
        is_superuser: isSuperuser,
        profile: {
          role: role
        },
        create_profile: true // Добавляем флаг для создания профиля
      };
      if (password.trim()) {
        obj.password = password.trim();
      }

      let response;
      if (isCreate) {
        response = await axios.post('/api/accounts/admin/users/', obj);
        console.log('Создан пользователь:', response.data);
      } else {
        response = await axios.put(`/api/accounts/admin/users/${id}/`, obj);
        console.log('Обновлен пользователь:', response.data);
      }
      navigate('/admin/users');
    } catch (err) {
      console.error('Ошибка при сохранении:', err.response?.data || err.message);
      setError(
        err.response?.data?.detail ||
          'Ошибка при сохранении пользователя. Проверьте данные и попробуйте снова.'
      );
    }
  };

  if (loading) {
    return <div className="loading-message">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={() => navigate('/admin/users')}>Назад</button>
      </div>
    );
  }

  return (
    <div className="admin-user-edit-container">
      <h1>{isCreate ? 'Создание пользователя' : `Редактирование пользователя #${id}`}</h1>

      <div className="admin-user-form-group">
        <label>Логин:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="admin-user-form-group">
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="admin-user-form-group">
        <label>Имя:</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>

      <div className="admin-user-form-group">
        <label>Фамилия:</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      <div className="admin-user-form-group">
        <label>Пароль:</label>
        <div className="password-input-container">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isCreate ? 'Введите пароль' : '(необязательно)'}
          />
          <button
            type="button"
            className="toggle-password-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Скрыть" : "Показать"}
          </button>
        </div>
      </div>

      <div className="admin-user-form-group">
        <label>Роль пользователя:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="role-select"
        >
          {roles.map(role => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-user-form-group">
        <label>Staff:</label>
        <input
          type="checkbox"
          checked={isStaff}
          onChange={(e) => setIsStaff(e.target.checked)}
        />
      </div>

      <div className="admin-user-form-group">
        <label>Superuser:</label>
        <input
          type="checkbox"
          checked={isSuperuser}
          onChange={(e) => setIsSuperuser(e.target.checked)}
        />
      </div>

      <div className="admin-user-form-actions">
        <button className="save-btn" onClick={handleSave}>
          {isCreate ? 'Создать' : 'Сохранить'}
        </button>
        <button className="cancel-btn" onClick={() => navigate('/admin/users')}>
          Отмена
        </button>
      </div>
    </div>
  );
};

export default AdminUserEdit;