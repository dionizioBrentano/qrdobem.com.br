import React, { useState, useEffect } from 'react';
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
 * ALTERAÇÃO DE 06/08/2026 (decisão do proprietário):
 * o menu "Causas" e o link para a listagem só aparecem quando existe ao
 * menos uma causa publicada. Levar o visitante a uma página vazia é pior
 * que não oferecer o caminho — ele conclui que o sistema não tem conteúdo
 * e vai embora.
 *
 * A verificação é feita UMA vez aqui e propagada para o menu e para o
 * conteúdo. Cada componente buscando por conta própria faria duas
 * requisições para responder a mesma pergunta.
 *
 * Enquanto a resposta não chega, `hasCauses` é `false`: o link aparecer e
 * sumir seria pior que aparecer um instante depois.
 */
/** Seções válidas — o que vem pela URL é conferido contra esta lista. */
const VALID_TRAILS = ['pessoas', 'pets', 'familia', 'grupo', 'empresa', 'doacoes', 'logistica', 'aventura', 'contato'];

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('pessoas');
  const [hasCauses, setHasCauses] = useState(false);

  /**
   * Abre a seção pedida pela URL.
   *
   * O rodapé e a Central de Ajuda ficam em outras rotas e precisam
   * conseguir trazer o visitante para uma seção específica da home —
   * âncora com `#` não resolve, porque a seção é trocada por estado do
   * React, não por rolagem.
   *
   * `?contato=1` é atalho para a seção de contato, usado pela Ajuda.
   */
  useEffect(() => {
    if (searchParams.get('contato')) {
      setActiveCategory('contato');
      return;
    }

    const trail = searchParams.get('trilha');

    if (trail && VALID_TRAILS.includes(trail)) {
      setActiveCategory(trail);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    causesApi.list()
      .then((res) => {
        if (!cancelled) setHasCauses((res.causes || []).length > 0);
      })
      // Falha na consulta = trata como se não houvesse causa. O site
      // público não pode quebrar porque um endpoint secundário caiu.
      .catch(() => {
        if (!cancelled) setHasCauses(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Alinha o menu inferior (MainMenu) no topo da tela sempre que a seção muda.
  useEffect(() => {
    const timer = setTimeout(() => {
      const menuEl = document.getElementById('main-menu-nav');
      if (menuEl) {
        const topPos = menuEl.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: topPos, behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeCategory]);

  return (
    <div className="w-full min-h-screen bg-brand-bg font-sans m-0 p-0 flex flex-col">
      <TopBar onCategorySelect={setActiveCategory} />
      <DiamondHero activeCategory={activeCategory} onCategorySelect={setActiveCategory} />
      <MainMenu
        activeCategory={activeCategory}
        onCategorySelect={setActiveCategory}
        hasCauses={hasCauses}
      />
      <ContentArea activeCategory={activeCategory} hasCauses={hasCauses} />
      <Footer />
    </div>
  );
}
