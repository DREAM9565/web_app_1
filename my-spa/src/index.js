import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // где уже импортирован global.css и другие файлы стилей
import axios from 'axios';

// Включаем передачу cookies во всех запросах
axios.defaults.withCredentials = true;

// Настройка Axios для CSRF (если потребуется)
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker зарегистрирован:', registration);
      })
      .catch((error) => {
        console.error('Ошибка регистрации Service Worker:', error);
      });
  });
}