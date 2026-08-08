import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from './TopBar';
import MainMenu from './MainMenu';
import Footer from './Footer';
import { causesApi } from '../../services/api';

/**
 * PublicShell — wrapper para páginas públicas.
 * Garante que a navegação superior (TopBar + MainMenu) e o rodapé
 * sejam idênticos aos da home, sem duplicar o hero de conversão.
 */
export default function PublicShell({ children }) {
  const [hasCauses, setHasCauses] = useState(false);
  const navigate = useNavigate();

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
      <MainMenu
        activeCategory={null}
        onCategorySelect={handleCategorySelect}
        hasCauses={hasCauses}
      />
      <div className="flex-1 flex flex-col relative z-10 w-full">
        {children}
      </div>
      <Footer />
    </div>
  );
}
