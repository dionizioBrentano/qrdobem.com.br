import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer — rodapé do site público.
 *
 * CORREÇÃO DE 06/08/2026: todos os links eram `href="#"`. Nenhum levava a
 * lugar nenhum — inclusive o "Central de Ajuda", que é o primeiro lugar
 * onde alguém com dúvida clica.
 *
 * Agora só existe link para o que existe de fato. Item sem destino foi
 * removido em vez de virar link morto: link que não leva a nada custa mais
 * confiança do que a ausência dele.
 *
 * Privacidade e Termos de Uso ficaram de fora de propósito — as páginas
 * ainda não foram redigidas. Um sistema que guarda dado de saúde precisa
 * das duas, e o texto é jurídico, não de programação.
 */

/**
 * Leva à home e abre a trilha correspondente.
 * A home controla a seção exibida por estado interno; o parâmetro na URL é
 * lido pelo TopBar/HomePage para abrir a seção certa vinda de outra página.
 */
const trailLink = (trail) => `/?trilha=${trail}`;

export default function Footer() {
  return (
    <footer className="w-full bg-brand-dark text-white flex flex-col mt-auto">
      <div className="w-full max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Coluna 1: marca */}
        <div className="flex flex-col gap-4 border-l-4 border-brand-blue pl-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <img
              src="/logo-mini.svg"
              alt="QR do Bem"
              className="w-9 h-9 object-contain"
              width="36"
              height="36"
              loading="lazy"
            />
            <span className="text-2xl font-black tracking-tight">Qrdobem</span>
          </Link>
          <p className="text-white/60 text-sm mt-2">
            Conectando quem precisa ser encontrado a quem pode ajudar, de forma rápida, segura e universal.
          </p>
        </div>

        {/* Coluna 2: trilhas */}
        <div className="flex flex-col gap-3">
          <h4 className="text-brand-cream font-bold mb-2">Plataforma</h4>
          <Link to={trailLink('familia')} className="text-white/70 hover:text-white transition-colors text-sm">
            Para sua família
          </Link>
          <Link to={trailLink('grupo')} className="text-white/70 hover:text-white transition-colors text-sm">
            Grupos e causas
          </Link>
          <Link to={trailLink('empresa')} className="text-white/70 hover:text-white transition-colors text-sm">
            Empresas
          </Link>
          <Link to={trailLink('doacoes')} className="text-white/70 hover:text-white transition-colors text-sm">
            Doações
          </Link>
        </div>

        {/* Coluna 3: suporte */}
        <div className="flex flex-col gap-3">
          <h4 className="text-brand-cream font-bold mb-2">Suporte</h4>
          <Link to="/ajuda" className="text-white/70 hover:text-white transition-colors text-sm">
            Central de Ajuda
          </Link>
          <Link to={trailLink('contato')} className="text-white/70 hover:text-white transition-colors text-sm">
            Fale com a equipe
          </Link>
          <a
            href="mailto:contato@qrdobem.com.br"
            className="text-white/70 hover:text-white transition-colors text-sm"
          >
            contato@qrdobem.com.br
          </a>
        </div>

        {/* Coluna 4: acesso */}
        <div className="flex flex-col gap-3">
          <h4 className="text-brand-cream font-bold mb-2">Sua conta</h4>
          <Link to="/login" className="text-white/70 hover:text-white transition-colors text-sm">
            Entrar
          </Link>
          <Link to="/register" className="text-white/70 hover:text-white transition-colors text-sm">
            Criar conta
          </Link>
        </div>
      </div>

      <div className="w-full bg-brand-cream text-brand-dark py-4 text-center font-semibold text-sm shadow-[0_-4px_6px_rgba(0,0,0,0.1)]">
        &copy; Copyrights 2026 Qrdobem.
      </div>
    </footer>
  );
}
