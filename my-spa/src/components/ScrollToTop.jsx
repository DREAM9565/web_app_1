import React, { useState, useEffect } from 'react';
import '../styles/ScrollToTop.css';

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  const toggleVisible = () => {
    if (window.pageYOffset > 300) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisible);
    return () => window.removeEventListener('scroll', toggleVisible);
  }, []);

  return (
    <button 
      className="scroll-to-top" 
      onClick={scrollToTop} 
      style={{ display: visible ? 'block' : 'none' }}
    >
      ↑ Наверх
    </button>
  );
};

export default ScrollToTop;
