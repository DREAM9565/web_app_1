import React from 'react';

// HOC для обработки ошибок изображений и подстановки дефолтного изображения
const withDefaultImage = (WrappedComponent) => {
  return (props) => {
    const { src, alt, fallbackSrc, ...rest } = props;
    const [imageSrc, setImageSrc] = React.useState(src);

    // Функция для обработки ошибки загрузки изображения
    const handleError = () => {
      setImageSrc(fallbackSrc || '/static/images/default.jpg'); // Указываем путь к дефолтному изображению
    };

    return <WrappedComponent src={imageSrc} alt={alt} onError={handleError} {...rest} />;
  };
};

export default withDefaultImage;
