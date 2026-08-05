import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, HeartHandshake } from 'lucide-react';

/**
 * MainMenu — menu do site público.
 *
 * ALTERAÇÃO DE 06/08/2026: além de trocar a categoria de conteúdo da home,
 * o menu agora leva às páginas públicas que passaram a existir com as
 * Fases 3 e 6:
 *   /causas  → vitrine das causas (T2-R04)
 *   /mapa    → mapa de calor das leituras (T2-R07)
 *
 * Antes desta versão, todo o resto do sistema só era alcançável depois do
 * login — a home não tinha caminho para nada novo.
 *
 * As quatro trilhas continuam trocando a seção de conteúdo (comportamento
 * original, via `onCategorySelect`), porque a home explica cada uma antes
 * de o visitante decidir entrar.
 */
export default function MainMenu({ activeCategory, onCategorySelect, hasCauses = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e, id) => {
    e.preventDefault();
    if (onCategorySelect) onCategorySelect(id);
    setIsOpen(false);
  };

  /** Âncoras de conteúdo da home — trocam a seção exibida. */
  const trails = [
    { id: 'pessoas',  href: '#inicio',   label: 'Início' },
    { id: 'familia',  href: '#familia',  label: 'Para sua Família' },
    { id: 'grupo',    href: '#grupos',   label: 'Grupos e Causas' },
    { id: 'empresa',  href: '#empresas', label: 'Empresas' },
    { id: 'doacoes',  href: '#doacoes',  label: 'Doações' },
    { id: 'contato',  href: '#contato',  label: 'Contato' },
  ];

  return (
    <nav className="w-full bg-brand-blue shadow-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logotipo. `logo-mini.svg` (50 KB) em vez do ícone genérico —
            e clicável, porque logotipo de cabeçalho que não volta ao topo
            contraria o que todo visitante espera. */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img
            src="/logo-mini.svg"
            alt="QR do Bem"
            className="w-10 h-10 object-contain"
            width="40"
            height="40"
          />
          <span className="text-2xl font-black text-white tracking-tight">Qrdobem</span>
        </Link>

        {/* Menu desktop */}
        <div className="hidden md:flex gap-6 items-center font-bold text-white">
          {trails.map((trail) => (
            <a
              key={trail.id}
              href={trail.href}
              onClick={(e) => handleClick(e, trail.id)}
              className={`hover:text-brand-cream transition-colors cursor-pointer ${
                activeCategory === trail.id ? 'text-brand-cream' : ''
              }`}
            >
              {trail.label}
            </a>
          ))}

          {/* Páginas públicas reais, separadas das âncoras por uma borda:
              são navegação de verdade, não troca de seção. */}
          <span className="flex items-center gap-4 pl-4 border-l border-white/20">
            {/* Só aparece com ao menos uma causa publicada: levar o
                visitante a uma lista vazia é pior que não oferecer o
                caminho — ele conclui que o sistema não tem conteúdo. */}
            {hasCauses && (
              <Link to="/causas" className="hover:text-brand-cream transition-colors flex items-center gap-1">
                <HeartHandshake className="w-4 h-4" />
                Causas
              </Link>
            )}
            {/* Link do Mapa de calor removido em 06/08/2026 por decisão do
                proprietário. A rota está desativada em App.jsx. */}
            <Link
              to="/login"
              className="bg-brand-cream text-brand-blue px-4 py-1.5 rounded-lg hover:opacity-90 transition"
            >
              Entrar
            </Link>
          </span>
        </div>

        {/* Hambúrguer */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </div>

      {/* Menu mobile */}
      {isOpen && (
        <div className="md:hidden bg-brand-blue border-t border-brand-blue px-6 py-4 flex flex-col gap-4 font-bold text-white shadow-xl absolute w-full">
          {trails.map((trail) => (
            <a
              key={trail.id}
              href={trail.href}
              onClick={(e) => handleClick(e, trail.id)}
              className="hover:text-brand-cream transition-colors block py-2 cursor-pointer"
            >
              {trail.label}
            </a>
          ))}

          <span className="border-t border-brand-cream/20 pt-3 flex flex-col gap-3">
            {hasCauses && (
              <Link to="/causas" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors flex items-center gap-2">
                <HeartHandshake className="w-4 h-4" />
                Causas para apoiar
              </Link>
            )}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="bg-brand-cream text-brand-blue px-4 py-2 rounded-lg text-center"
            >
              Entrar
            </Link>
          </span>
        </div>
      )}
    </nav>
  );
}
