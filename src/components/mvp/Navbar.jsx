import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="w-full fixed top-0 z-50 bg-brand-olive text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-brand-blue" />
          <span className="text-2xl font-black text-brand-dark tracking-tight">Qrdobem</span>
        </div>
        <div className="flex flex-wrap gap-4 md:gap-8 items-center font-medium">
          <a href="#voce" className="hover:text-brand-cream transition-colors">Para você</a>
          <a href="#familia" className="hover:text-brand-cream transition-colors">Para sua Família</a>
          <a href="#grupo" className="hover:text-brand-cream transition-colors">Para seu grupo</a>
          <a href="#empresa" className="hover:text-brand-cream transition-colors">Para sua empresa</a>
          <button className="bg-brand-cream text-brand-dark px-4 py-2 rounded-full hover:bg-white shadow-lg transition-all font-semibold text-sm md:text-base">
            Contato
          </button>
        </div>
      </div>
    </nav>
  );
}
