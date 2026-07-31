import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, ChevronUp, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function GiantFan({ scenarios }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = descer, -1 = subir

  const nextScenario = () => {
    if (expanded) return;
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % scenarios.length);
  };

  const prevScenario = () => {
    if (expanded) return;
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + scenarios.length) % scenarios.length);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Suporte a scroll/roda do mouse (wheel)
  useEffect(() => {
    const handleWheel = (e) => {
      if (expanded) return;
      if (e.deltaY > 50) {
        nextScenario();
      } else if (e.deltaY < -50) {
        prevScenario();
      }
    };
    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [expanded]);

  // Framer motion variants para a ilusão de Leque Girando
  // Agora usamos APENAS rotação ao redor do eixo distante, sem translação Y (sem "voar" por baixo)
  const sliceVariants = {
    initial: (dir) => ({
      rotate: dir > 0 ? 45 : -45, // Entra girando 45 graus a partir do eixo
      opacity: 0,
    }),
    animate: {
      rotate: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 60, damping: 20 }
    },
    exit: (dir) => ({
      rotate: dir < 0 ? 45 : -45, // Sai girando 45 graus para o outro lado
      opacity: 0,
      transition: { duration: 0.4 }
    })
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden flex items-center">
      
      {/* Controles Virtuais caso o usuário não use o Scroll do mouse */}
      {!expanded && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-8 opacity-40 hover:opacity-100 transition-opacity">
          <button onClick={prevScenario} className="p-4 bg-slate-800 rounded-full hover:bg-slate-700 text-white">
            <ChevronUp className="w-8 h-8" />
          </button>
          <button onClick={nextScenario} className="p-4 bg-slate-800 rounded-full hover:bg-slate-700 text-white">
            <ChevronDown className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* O Leque Curvo / Tela Expandida */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={activeIndex}
          custom={direction}
          variants={sliceVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0 w-full h-full flex items-center justify-end"
          // Ponto de giro na esquerda extrema (270º), coincidindo perfeitamente com o centro do clip-path (-150%)
          style={{ transformOrigin: '-150% 50%' }}
        >
          {/* A Fatia Real (A Pizza Visível) */}
          <motion.div 
            className="h-full relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-pointer"
            onClick={!expanded ? toggleExpand : undefined}
            animate={{
              width: expanded ? '95vw' : '85vw', // Na expansão preenche tudo menos 5%
              clipPath: expanded 
                ? 'circle(300% at 50% 50%)' // Círculo gigante que cobre toda a tela
                : 'circle(250% at -150% 50%)' // Centro muito mais deslocado para a esquerda (270º) com raio gigantesco
            }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          >
            
            {/* Fundo Limpo e Gradiente (Sem fotos de Auditório) */}
            <div className={cn(
              "absolute inset-0 w-full h-full bg-gradient-to-br",
              scenarios[activeIndex].id === 'emergency' ? 'from-slate-900 to-red-950' :
              scenarios[activeIndex].id === 'pets' ? 'from-slate-900 to-emerald-950' :
              scenarios[activeIndex].id === 'people' ? 'from-slate-900 to-blue-950' :
              'from-slate-900 to-orange-950'
            )} />

            {/* Conteúdo da Fatia */}
            <div className="absolute inset-0 p-16 md:p-24 flex flex-col justify-center max-w-6xl mx-auto">
              
              {/* Botão Fechar (Orelha Esquerda Visual) */}
              {expanded && (
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
                  className="absolute top-12 left-12 p-4 bg-slate-800/80 hover:bg-slate-700 rounded-full backdrop-blur z-50 text-white"
                >
                  <X className="w-8 h-8" />
                </button>
              )}

              <h2 className={cn("text-6xl md:text-7xl font-black mb-6 drop-shadow-2xl", scenarios[activeIndex].color.replace('bg-', 'text-'))}>
                {scenarios[activeIndex].title}
              </h2>
              <p className="text-2xl md:text-3xl text-slate-200 max-w-4xl mb-16 leading-relaxed font-light">
                {scenarios[activeIndex].description}
              </p>

              {/* Episódios/Cards que pulam na tela */}
              <div className="flex flex-col md:flex-row gap-6 w-full">
                {scenarios[activeIndex].episodes.map((ep, idx) => (
                  <motion.div 
                    key={ep.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl flex-1 hover:bg-slate-800 transition-colors"
                  >
                    <PlayCircle className={cn("w-12 h-12 mb-6", scenarios[activeIndex].color.replace('bg-', 'text-'))} />
                    <h4 className="text-2xl font-bold text-white mb-4">{ep.title}</h4>
                    {expanded && (
                      <p className="text-slate-400 mt-4 border-t border-slate-700 pt-4">
                        (Simulação do Vídeo Aqui)
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
            
            {!expanded && (
              <div className="absolute bottom-12 right-12 text-slate-400 font-bold tracking-widest text-sm animate-pulse">
                CLIQUE NA TELA PARA MERGULHAR NO CENÁRIO
              </div>
            )}
            
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
