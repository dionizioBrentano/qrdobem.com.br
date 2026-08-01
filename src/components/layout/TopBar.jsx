import React from 'react';
import { Link } from 'react-router-dom';

export default function TopBar({ onCategorySelect }) {
  const handleDoarClick = (e) => {
    e.preventDefault();
    if (onCategorySelect) onCategorySelect('doacoes');
  };

  return (
    <div className="w-full bg-brand-blue text-white py-2 px-2 md:px-6 shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-end gap-3 md:gap-6 text-xs md:text-sm font-semibold tracking-wide">
        <Link to="/login" className="hover:text-brand-cream transition-colors cursor-pointer text-center whitespace-nowrap">Entrar (Login)</Link>
        <Link to="/login?mode=register" className="hover:text-brand-cream transition-colors cursor-pointer text-center whitespace-nowrap">Cadastre-se</Link>
        <a href="#doar" onClick={handleDoarClick} className="hover:text-brand-cream transition-colors cursor-pointer text-yellow-300 text-center whitespace-nowrap">💛 Doe e Ajude (Donate)</a>
        <a href="#suporte" className="hover:text-brand-cream transition-colors cursor-pointer text-center whitespace-nowrap">Suporte / Ajuda</a>
      </div>
    </div>
  );
}
