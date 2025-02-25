import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminUsers.css';

const AdminUserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const resp = await axios.get('/api/accounts/admin/users/');
        setUsers(resp.data.results || resp.data);
      } catch (err) {
        setError('Ошибка при получении списка пользователей');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Уверены, что хотите удалить пользователя?')) return;
    try {
      await axios.delete(`/api/accounts/admin/users/${id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert('Ошибка при удалении пользователя');
    }
  };

  if (loading) return <div className="loading-message">Загрузка...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-users-container">
      <h1>Управление пользователями</h1>
      <div className="admin-actions">
        <button className="btn-create" onClick={() => navigate('/admin/users/create')}>
          Создать пользователя
        </button>
      </div>
      <table className="admin-users-table">
        <thead>
          <tr><th>ID</th><th>Логин</th><th>Имя</th><th>Фамилия</th><th>Email</th><th>Staff</th><th>SuperUser</th><th>Действия</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}><td>{u.id}</td><td>{u.username}</td><td>{u.first_name || '-'}</td><td>{u.last_name || '-'}</td><td>{u.email}</td><td>{u.is_staff ? 'да' : 'нет'}</td><td>{u.is_superuser ? 'да' : 'нет'}</td><td><div className="user-actions"><button className="edit-btn" onClick={() => navigate(`/admin/users/${u.id}`)}>Редактировать</button><button className="delete-btn" onClick={() => handleDelete(u.id)}>Удалить</button></div></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUserList;