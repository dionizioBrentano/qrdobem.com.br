import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function TopBar({ onCategorySelect }) {
  const handleDoarClick = (e) => {
    e.preventDefault();
    if (onCategorySelect) onCategorySelect('doacoes');
  };

  return (
    <div className="w-full bg-brand-blue text-white py-2 px-2 md:px-6 shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center md:justify-end gap-3 md:gap-6 text-xs md:text-sm font-semibold tracking-wide">
        <Link to="/login" className="hover:text-brand-blue-dark transition-colors cursor-pointer text-center whitespace-nowrap">Entrar (Login)</Link>
        <Link to="/login?mode=register" className="hover:text-brand-blue-dark transition-colors cursor-pointer text-center whitespace-nowrap">Cadastre-se</Link>
        {/* Botão, não link: doar é a ação que a barra existe para destacar.
            Mesmos tokens do "Entrar" do MainMenu (fundo dourado brand-accent,
            texto branco, clareando no hover). O coração é ícone, não emoji,
            para herdar `currentColor`. */}
        <a
          href="#doar"
          onClick={handleDoarClick}
          className="bg-brand-accent text-white hover:bg-brand-accent-strong px-4 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
        >
          <Heart className="w-4 h-4 shrink-0" fill="currentColor" />
          Doe e Ajude (Donate)
        </a>
        <Link to="/ajuda" className="hover:text-brand-blue-dark transition-colors cursor-pointer text-center whitespace-nowrap">Suporte / Ajuda</Link>
      </div>
    </div>
  );
}
