import React, { useState } from 'react';
import { Menu, X, ShieldCheck } from 'lucide-react';

export default function MainMenu({ activeCategory, onCategorySelect }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e, id) => {
    e.preventDefault();
    if (onCategorySelect) onCategorySelect(id);
    setIsOpen(false);
  };

  return (
    <nav className="w-full bg-brand-blue shadow-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-white" />
          <span className="text-2xl font-black text-white tracking-tight">Qrdobem</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center font-bold text-white">
          <a href="#inicio" onClick={(e) => handleClick(e, 'pessoas')} className="hover:text-brand-cream transition-colors cursor-pointer">Início</a>
          <a href="#familia" onClick={(e) => handleClick(e, 'familia')} className="hover:text-brand-cream transition-colors cursor-pointer">Para sua Família</a>
          <a href="#grupos" onClick={(e) => handleClick(e, 'grupo')} className="hover:text-brand-cream transition-colors cursor-pointer">Grupos e Causas</a>
          <a href="#empresas" onClick={(e) => handleClick(e, 'empresa')} className="hover:text-brand-cream transition-colors cursor-pointer">Empresas</a>
          <a href="#doacoes" onClick={(e) => handleClick(e, 'doacoes')} className="hover:text-brand-cream transition-colors cursor-pointer">Doações (Donate)</a>
          <a href="#contato" onClick={(e) => handleClick(e, 'contato')} className="hover:text-brand-cream transition-colors cursor-pointer">Contato</a>
        </div>

        {/* Mobile Hamburger */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-brand-blue border-t border-brand-blue px-6 py-4 flex flex-col gap-4 font-bold text-white shadow-xl absolute w-full">
          <a href="#inicio" onClick={(e) => handleClick(e, 'pessoas')} className="hover:text-brand-cream transition-colors block py-2 cursor-pointer">Início</a>
          <a href="#familia" onClick={(e) => handleClick(e, 'familia')} className="hover:text-brand-cream transition-colors block py-2 cursor-pointer">Para sua Família</a>
          <a href="#grupos" onClick={(e) => handleClick(e, 'grupo')} className="hover:text-brand-cream transition-colors block py-2 cursor-pointer">Grupos e Causas</a>
          <a href="#empresas" onClick={(e) => handleClick(e, 'empresa')} className="hover:text-brand-cream transition-colors block py-2 cursor-pointer">Empresas</a>
          <a href="#doacoes" onClick={(e) => handleClick(e, 'doacoes')} className="hover:text-brand-cream transition-colors block py-2 cursor-pointer">Doações (Donate)</a>
          <a href="#contato" onClick={(e) => handleClick(e, 'contato')} className="hover:text-brand-cream transition-colors block py-2 cursor-pointer">Contato</a>
        </div>
      )}
    </nav>
  );
}
