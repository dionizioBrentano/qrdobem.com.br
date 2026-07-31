import React, { useState } from 'react';
import TopBar from '../components/layout/TopBar';
import MainMenu from '../components/layout/MainMenu';
import DiamondHero from '../components/layout/DiamondHero';
import ContentArea from '../components/layout/ContentArea';
import Footer from '../components/layout/Footer';

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('pessoas');

  return (
    <div className="w-full min-h-screen bg-brand-cream font-sans m-0 p-0 flex flex-col">
      <TopBar onCategorySelect={setActiveCategory} />
      <DiamondHero activeCategory={activeCategory} onCategorySelect={setActiveCategory} />
      <MainMenu activeCategory={activeCategory} onCategorySelect={setActiveCategory} />
      <ContentArea activeCategory={activeCategory} />
      <Footer />
    </div>
  );
}
