import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const panels = [
  {
    id: 'pets',
    title: 'Pets',
    description: 'Proteção para\nseus melhores amigos.',
    align: 'center',
    flexAlign: 'center',
    images: [
      '/assets/images/media__1782994034576.png',
      '/assets/images/media__1782994034648.png',
    ],
  },
  {
    id: 'pessoas',
    title: 'Pessoas',
    description: 'Crianças, Idosos\ntodos em segurança.',
    align: 'center',
    flexAlign: 'center',
    textPadding: 'md:pr-20',
    images: [
      '/assets/images/media__1782993838744.jpg',
      '/assets/images/media__1782993838763.jpg',
      '/assets/images/media__1782993838780.jpg',
    ],
  },
  {
    id: 'aventura',
    title: 'Aventura',
    description: 'Segurança quando\nvocê mais precisa',
    align: 'center',
    flexAlign: 'center',
    textPadding: 'md:pr-20',
    images: [
      '/assets/images/media__1782993868880.jpg',
      '/assets/images/media__1782993868895.jpg',
      '/assets/images/media__1782993868909.jpg',
      '/assets/images/media__1782993869385.jpg',
    ],
  },
  {
    id: 'logistica',
    title: 'LOG',
    description: 'Rastreamento de\nencomendas e mercadorias.',
    align: 'center',
    flexAlign: 'center',
    textPadding: 'md:pr-20',
    images: [
      '/assets/images/media__1782994185981.jpg',
      '/assets/images/media__1782994186481.jpg',
      '/assets/images/media__1782994186665.png',
    ],
  },
];

/**
 * Carrossel de fundo: só avança quando visível na viewport;
 * pré-carrega a imagem atual e a próxima.
 */
function CarouselBackground({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;

    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || images.length <= 1) return undefined;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images, visible]);

  // Pré-carrega atual + próxima (reduz flash e requests extras no meio da animação)
  useEffect(() => {
    if (!images.length) return;
    const next = images[(currentIndex + 1) % images.length];
    const preload = (src) => {
      const img = new Image();
      img.src = src;
    };
    preload(images[currentIndex]);
    if (next && next !== images[currentIndex]) preload(next);
  }, [currentIndex, images]);

  const current = images[currentIndex];
  const nextIdx = (currentIndex + 1) % images.length;

  return (
    <div ref={rootRef} className="absolute inset-0 w-full h-full">
      {/* Imagens reais: o browser gerencia decode/cache melhor que só backgroundImage */}
      {images.map((src, i) => {
        const isCurrent = i === currentIndex;
        const isNear = i === nextIdx;
        if (!isCurrent && !isNear && i !== 0) return null;
        return (
          <img
            key={src}
            src={src}
            alt=""
            decoding="async"
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={isCurrent ? 'high' : 'low'}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
              isCurrent ? 'opacity-100' : 'opacity-0'
            }`}
          />
        );
      })}

      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-0"
          aria-hidden
        />
      </AnimatePresence>
    </div>
  );
}

export default function DiamondHero({ activeCategory, onCategorySelect }) {
  const handlePanelClick = (id) => {
    if (onCategorySelect) onCategorySelect(id);
    // O scroll fica a cargo da HomePage (selectCategory + shouldScrollRef).
    // Mantemos um fallback leve se a home não rolar por algum motivo:
    setTimeout(() => {
      const element = document.getElementById('content-area');
      if (!element) return;
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }, 120);
  };

  return (
    <div className="w-full h-[80vh] md:h-[75vh] flex flex-col md:flex-row overflow-hidden bg-brand-dark">
      {panels.map((panel, idx) => {
        const isActive = activeCategory === panel.id;
        return (
          <div
            key={panel.id}
            onClick={() => handlePanelClick(panel.id)}
            className={`
              relative flex-1 group overflow-hidden border-b-4 md:border-b-0 md:border-r-[6px] border-white
              cursor-pointer
              md:-skew-x-[20deg]
              ${idx === 0 ? 'md:-ml-[10%]' : ''}
              ${idx === panels.length - 1 ? 'md:-mr-[10%] md:border-r-0' : ''}
              transition-all duration-700 ease-in-out
              md:hover:flex-[1.5]
              ${isActive ? 'md:flex-[1.5] ring-inset ring-4 ring-brand-blue/50' : 'opacity-90 hover:opacity-100'}
            `}
          >
            <div className="absolute inset-0 md:skew-x-[20deg] md:w-[150%] md:-ml-[25%] transition-transform duration-700 group-hover:scale-105">
              <CarouselBackground images={panel.images} />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              <div
                className={`absolute bottom-0 left-0 w-full p-4 md:p-12 text-white flex flex-col justify-end h-full text-${panel.align} items-${panel.flexAlign} ${panel.textPadding || ''}`}
              >
                <h2 className="text-xl md:text-4xl font-black uppercase tracking-tight mb-1 md:mb-2 drop-shadow-lg leading-tight">
                  {panel.title}
                </h2>
                <p className="text-sm md:text-lg font-medium text-white/80 drop-shadow-md max-w-xs whitespace-pre-line leading-snug">
                  {panel.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}