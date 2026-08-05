import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/**
 * Registro do service worker — habilita a instalação como app (PWA).
 * Requisito T1-R07: o Botão de Pânico funciona como alarme dentro do app
 * instalado. Ver front/public/sw.js.
 *
 * Registrado depois do `load` de propósito: durante o carregamento inicial
 * ele competiria por banda com o próprio bundle.
 *
 * Falha no registro é silenciosa: navegador sem suporte, ou servido por
 * HTTP em teste local, deve continuar funcionando como site normal.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
