import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import DiamondHero from './DiamondHero';
import MainMenu from './MainMenu';
import Footer from './Footer';
import { causesApi } from '../../services/api';

/**
 * PublicShell — wrapper para páginas públicas.
 * Garante que a navegação superior (TopBar + DiamondHero + MainMenu) e o rodapé
 * sejam idênticos aos da home.
 */
export default function PublicShell({ children }) {
  const [hasCauses, setHasCauses] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    causesApi.list()
      .then((res) => {
        if (!cancelled) setHasCauses((res.causes || []).length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasCauses(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Rola para alinhar o MainMenu no topo da tela quando a página carrega.
  useEffect(() => {
    const timer = setTimeout(() => {
      const menuEl = document.getElementById('main-menu-nav');
      if (menuEl) {
        const topPos = menuEl.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: topPos, behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleCategorySelect = (id) => {
    if (id === 'contato') {
      navigate('/?contato=1');
    } else if (id === 'doacoes') {
      navigate('/?trilha=doacoes');
    } else {
      navigate(`/?trilha=${id}`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-brand-bg font-sans m-0 p-0 flex flex-col">
      <TopBar onCategorySelect={handleCategorySelect} />
      <DiamondHero activeCategory={null} onCategorySelect={handleCategorySelect} />
      <MainMenu
        activeCategory={null}
        onCategorySelect={handleCategorySelect}
        hasCauses={hasCauses}
      />
      <div className="flex-1 flex flex-col w-full">
        {children}
      </div>
      <Footer />
    </div>
  );
}
