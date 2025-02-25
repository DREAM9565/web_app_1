import React from 'react';
import withDefaultImage from './withDefaultImage';

// Оборачиваем обычный <img> компонент с помощью HOC
const DefaultImage = withDefaultImage('img');

export default DefaultImage;
