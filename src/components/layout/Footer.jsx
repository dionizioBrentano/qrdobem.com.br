import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-brand-dark text-white flex flex-col mt-auto">
      {/* 4 Columns Area */}
      <div className="w-full max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Column 1: Logo & Info */}
        <div className="flex flex-col gap-4 border-l-4 border-brand-blue pl-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo-mini.svg"
              alt="QR do Bem"
              className="w-9 h-9 object-contain"
              width="36"
              height="36"
              loading="lazy"
            />
            <span className="text-2xl font-black tracking-tight">Qrdobem</span>
          </div>
          <p className="text-white/60 text-sm mt-2">
            Conectando quem precisa ser encontrado a quem pode ajudar, de forma rápida, segura e universal.
          </p>
        </div>

        {/* Column 2: Menus */}
        <div className="flex flex-col gap-3">
          <h4 className="text-brand-cream font-bold mb-2">Plataforma</h4>
          <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">Para você</a>
          <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">Para seu grupo</a>
          <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">Como funciona</a>
        </div>

        {/* Column 3: Informações */}
        <div className="flex flex-col gap-3">
          <h4 className="text-brand-cream font-bold mb-2">Suporte</h4>
          <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">Central de Ajuda</a>
          <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">Privacidade</a>
          <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">Termos de Uso</a>
        </div>

        {/* Column 4: Institucional */}
        <div className="flex flex-col gap-3">
          <h4 className="text-brand-cream font-bold mb-2">Sobre Nós</h4>
          <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">Nossa História</a>
          <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">Trabalhe Conosco</a>
          <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">Imprensa</a>
        </div>
      </div>

      {/* Bottom Bar Beige */}
      <div className="w-full bg-brand-cream text-brand-dark py-4 text-center font-semibold text-sm shadow-[0_-4px_6px_rgba(0,0,0,0.1)]">
        &copy; Copyrights 2026 Qrdobem.
      </div>
    </footer>
  );
}
