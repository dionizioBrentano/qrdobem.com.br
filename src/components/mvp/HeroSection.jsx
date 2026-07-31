import React from 'react';
import { QrCode, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen pt-32 pb-20 px-6 flex items-center overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
        
        {/* Text Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-8"
        >
          <div className="inline-flex items-center gap-3 bg-brand-sand/20 text-brand-olive px-4 py-2 rounded-full w-fit font-semibold text-sm">
            <QrCode className="w-4 h-4" />
            <span>O primeiro sistema de QR Code Universal</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-brand-dark leading-[1.1] tracking-tight">
            A sua segurança a um <span className="text-brand-blue">escaneamento</span> de distância.
          </h1>
          
          <p className="text-xl md:text-2xl text-brand-dark/70 font-light leading-relaxed max-w-xl">
            Proteja quem você ama, recupere objetos perdidos e facilite resgates. Uma única plataforma unindo a comunidade para cuidar de pessoas, pets e veículos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button className="flex items-center justify-center gap-2 bg-brand-blue text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-brand-blue/90 hover:scale-105 transition-all shadow-xl shadow-brand-blue/25">
              Criar QR Code Grátis
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="flex items-center justify-center gap-2 bg-brand-sand/20 text-brand-dark px-8 py-4 rounded-full text-lg font-bold hover:bg-brand-sand/30 transition-all">
              Como funciona
            </button>
          </div>
        </motion.div>

        {/* Visual Element (Mockup/Abstract) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-[600px] rounded-3xl overflow-hidden bg-brand-sand/10 border-2 border-brand-sand/20 flex items-center justify-center shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-cream to-transparent" />
          
          {/* Mock Smartphone Frame */}
          <div className="relative w-72 h-[550px] bg-white rounded-[3rem] shadow-2xl border-[12px] border-brand-dark flex flex-col items-center justify-center overflow-hidden">
             {/* Notch */}
             <div className="absolute top-0 w-32 h-6 bg-brand-dark rounded-b-xl z-20" />
             
             {/* Screen Content */}
             <div className="w-full h-full bg-brand-cream/30 p-8 flex flex-col items-center justify-center text-center gap-6">
                <QrCode className="w-32 h-32 text-brand-blue" />
                <h3 className="text-xl font-bold text-brand-dark">João, 75 anos</h3>
                <p className="text-sm text-brand-dark/60 font-medium bg-white px-4 py-2 rounded-full shadow-sm">
                  Medicamentos Ativos
                </p>
                <button className="w-full bg-brand-danger text-white py-3 rounded-2xl font-bold mt-4 shadow-lg">
                  Notificar Família
                </button>
             </div>
          </div>
        </motion.div>

      </div>
      
      {/* Background Shapes */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-sand/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />
    </section>
  );
}
