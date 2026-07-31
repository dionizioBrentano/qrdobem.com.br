import React from 'react';
import { motion } from 'framer-motion';
import { HeartHandshake, Dog, Package, ShieldAlert, ArrowRight } from 'lucide-react';

const features = [
  {
    id: 'elderly',
    title: 'Melhor Idade & Saúde',
    description: 'Segurança absoluta para idosos com Alzheimer ou comorbidades. Um escaneamento revela o histórico médico e contatos de emergência instantaneamente.',
    icon: HeartHandshake,
    imageUrl: 'https://images.unsplash.com/photo-1544098281-073ae35c98b0?q=80&w=800', // Idoso
    colSpan: 'lg:col-span-2',
    color: 'bg-brand-sand',
  },
  {
    id: 'pets',
    title: 'Tutores de Pets',
    description: 'Coleiras inteligentes. Quem encontrar seu pet perdido terá acesso imediato aos seus contatos com um simples scan.',
    icon: Dog,
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800', // Cachorro
    colSpan: 'lg:col-span-1',
    color: 'bg-brand-earth',
  },
  {
    id: 'children',
    title: 'Proteção Infantil',
    description: 'Tranquilidade em locais lotados. Pulseiras com QR Code para localizar pais imediatamente se a criança se perder.',
    icon: HeartHandshake,
    imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800', // Mulher/Criança
    colSpan: 'lg:col-span-1',
    color: 'bg-brand-blue',
  },
  {
    id: 'logistics',
    title: 'Logística & Viagem',
    description: 'Rastreie malas extraviadas em aeroportos ou garanta a entrega de encomendas.',
    icon: Package,
    imageUrl: 'https://images.unsplash.com/photo-1565084888279-aca607fccece?q=80&w=800', // Mala
    colSpan: 'lg:col-span-1',
    color: 'bg-brand-dark',
  },
  {
    id: 'adventure',
    title: 'Aventureiros',
    description: 'Fichas médicas táticas para paramédicos em acidentes com esportes radicais.',
    icon: ShieldAlert,
    imageUrl: 'https://images.unsplash.com/photo-1587570498715-db8ecaa8a5f8?q=80&w=800', // Acidente
    colSpan: 'lg:col-span-1',
    color: 'bg-brand-olive',
  }
];

export default function BentoFeatures() {
  return (
    <section id="solucoes" className="w-full py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-brand-dark mb-6 tracking-tight">
            Uma solução para cada necessidade
          </h2>
          <p className="text-xl text-brand-dark/70 font-light">
            Não importa o que você precisa proteger. Se pode receber um QR Code, o <span className="font-semibold text-brand-olive">Qrdobem</span> pode cuidar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {features.map((feature, idx) => (
            <motion.div 
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className={`relative overflow-hidden rounded-[2rem] group cursor-pointer ${feature.colSpan} bg-brand-cream/30 border border-brand-sand/30 shadow-lg hover:shadow-2xl transition-all duration-500 h-[400px] flex flex-col justify-end`}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${feature.imageUrl})` }}
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/60 to-transparent" />

              {/* Content */}
              <div className="relative z-10 p-8 flex flex-col gap-4">
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center text-white mb-2 shadow-lg`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-3xl font-bold text-white">{feature.title}</h3>
                <p className="text-white/80 text-lg leading-relaxed max-w-xl">
                  {feature.description}
                </p>
                <div className="flex items-center gap-2 text-white font-semibold mt-2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  Ver simulação <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
