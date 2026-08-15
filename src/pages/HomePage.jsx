import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import MainMenu from '../components/layout/MainMenu';
import DiamondHero from '../components/layout/DiamondHero';
import ContentArea from '../components/layout/ContentArea';
import Footer from '../components/layout/Footer';
import { causesApi } from '../services/api';

/**
 * HomePage — site público.
 *
 * Entrada em "/" (sem query): hero visível no topo, sem auto-scroll.
 * Troca de trilha (clique ou ?trilha= / ?contato=): ativa seção e rola ao conteúdo.
 */
const VALID_TRAILS = [
  'pessoas',
  'pets',
  'familia',
  'grupo',
  'empresa',
  'doacoes',
  'logistica',
  'aventura',
  'contato',
];

function scrollToContent() {
  const timer = setTimeout(() => {
    const el =
      document.getElementById('content-area') ||
      document.getElementById('main-menu-nav');
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }, 100);
  return () => clearTimeout(timer);
}

export default function HomePage() {
  const [searchParams] = useSearchParams();
  // Conteúdo default "pessoas", mas a entrada NÃO dispara scroll.
  const [activeCategory, setActiveCategory] = useState('pessoas');
  const [hasCauses, setHasCauses] = useState(false);
  // Só rola quando o usuário (ou a URL de deep-link) pede uma trilha.
  const shouldScrollRef = useRef(false);

  const selectCategory = useCallback((id) => {
    shouldScrollRef.current = true;
    setActiveCategory(id);
  }, []);

  /**
   * Deep-link: ?trilha= / ?contato=1
   * Nesses casos o visitante veio com intenção de seção → pode rolar.
   */
  useEffect(() => {
    if (searchParams.get('contato')) {
      shouldScrollRef.current = true;
      setActiveCategory('contato');
      return;
    }

    const trail = searchParams.get('trilha');
    if (trail && VALID_TRAILS.includes(trail)) {
      shouldScrollRef.current = true;
      setActiveCategory(trail);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    causesApi
      .list()
      .then((res) => {
        if (!cancelled) setHasCauses((res.causes || []).length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasCauses(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll só após escolha de trilha (não na montagem inicial de "/").
  useEffect(() => {
    if (!shouldScrollRef.current) return undefined;
    shouldScrollRef.current = false;
    return scrollToContent();
  }, [activeCategory]);

  // Garante topo na primeira pintura quando a URL está limpa.
  useEffect(() => {
    const hasDeepLink =
      searchParams.get('contato') ||
      (searchParams.get('trilha') &&
        VALID_TRAILS.includes(searchParams.get('trilha')));
    if (!hasDeepLink) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem
  }, []);

  return (
    <div className="w-full min-h-screen bg-brand-bg font-sans m-0 p-0 flex flex-col">
      <TopBar onCategorySelect={selectCategory} />
      <DiamondHero
        activeCategory={activeCategory}
        onCategorySelect={selectCategory}
      />
      <MainMenu
        activeCategory={activeCategory}
        onCategorySelect={selectCategory}
        hasCauses={hasCauses}
      />
      <ContentArea activeCategory={activeCategory} hasCauses={hasCauses} />
      <Footer />
    </div>
  );
}