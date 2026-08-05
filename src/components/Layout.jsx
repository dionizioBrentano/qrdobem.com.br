import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Layout — moldura das telas autenticadas (painel).
 *
 * Requisito TX-R01 (PLANO_TRILHAS_2026-08.md, item 0.7):
 * "Identificação clara de quem está logado, em todas as telas do painel,
 *  sem ambiguidade: nome, apelido, e-mail da conta ativa e papel."
 *
 * Contexto do requisito: o proprietário opera mais de uma conta (e-mails
 * diferentes, mesmo CPF). A versão anterior deste arquivo exibia apenas
 * `tenant.name` num <span> truncado no topo — com o mesmo nome nas várias
 * contas, o painel ficava indistinguível. O e-mail é o campo que de fato
 * separa uma conta da outra, por isso ele é exibido de forma permanente.
 *
 * Estrutura da identificação:
 *   1. Barra de identidade fixa abaixo da navegação, visível em toda tela
 *      e em qualquer largura (desktop e mobile). É o que garante o "sem
 *      clicar em nada" do critério de aceite.
 *   2. Bloco de identidade no menu desktop (avatar + nome + e-mail).
 *   3. Bloco de identidade no topo do menu mobile.
 *
 * Reservado para a Fase 0 posterior: quando `spaces` existir (item 0.1),
 * o badge do espaço ativo entra na barra de identidade, no ponto marcado
 * com o comentário ESPACO_ATIVO.
 */
export default function Layout() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSuperAdmin = tenant?.role === 'superadmin';

  /**
   * E-mail da conta ativa.
   * Preferimos o e-mail do tenant (backend, fonte de verdade). O e-mail
   * guardado pelo Firebase no localStorage é o fallback para o intervalo
   * entre o login e a resposta do /auth/me.
   */
  const activeEmail = tenant?.email || user?.email || '';

  /** Nome de exibição: apelido tem precedência por ser o que o usuário escolheu. */
  const displayName = tenant?.nickname || tenant?.name || 'Conta sem nome';

  /** Inicial para o avatar. Cai para '?' enquanto o tenant não carregou. */
  const initial = (displayName || '?').trim().charAt(0).toUpperCase();

  /** Rótulo do papel em português. Papéis desconhecidos são exibidos como vieram. */
  const roleLabels = {
    superadmin: 'Superadmin',
    admin: 'Administrador',
    ngo: 'Organização',
    company: 'Empresa',
    manager: 'Gestor',
    affiliate: 'Afiliado',
  };
  const roleLabel = tenant?.role ? (roleLabels[tenant.role] || tenant.role) : null;

  /** Perfil ainda incompleto (Gate 1 não concluído) — sinalizado na barra. */
  const isIncomplete = tenant?.profile_status && tenant.profile_status !== 'active';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="w-full bg-brand-blue shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/painel" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <ShieldCheck className="w-8 h-8 text-white" />
            <span className="text-2xl font-black text-white tracking-tight">Qrdobem</span>
          </Link>

          {/* Menu desktop */}
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-white">
            <Link to="/painel" className="hover:text-brand-cream transition-colors">
              Painel de Controle
            </Link>
            <Link to="/messages" className="hover:text-brand-cream transition-colors">
              Mensagens
            </Link>
            <Link to="/familia" className="hover:text-brand-cream transition-colors">
              Família
            </Link>
            <Link to="/saude" className="hover:text-brand-cream transition-colors">
              Saúde
            </Link>
            <Link to="/causa" className="hover:text-brand-cream transition-colors">
              Causa
            </Link>
            <Link to="/doacoes" className="hover:text-brand-cream transition-colors">
              Doações
            </Link>
            <Link to="/profile" className="hover:text-brand-cream transition-colors">
              Perfil
            </Link>
            {isSuperAdmin && (
              <Link to="/admin" className="hover:text-brand-cream transition-colors">
                Admin
              </Link>
            )}

            {/* Bloco de identidade (desktop) — avatar + nome + e-mail da conta ativa.
                Leva a "Minhas contas e vínculos": quem opera várias contas
                clica aqui justamente para trocar. */}
            <Link
              to="/contas"
              className="flex items-center gap-2 pl-4 border-l border-white/20 hover:opacity-90 transition-opacity"
              title={`Conta ativa: ${displayName} (${activeEmail}) — ver minhas contas`}
            >
              <span
                className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-cream text-brand-blue font-black text-base shrink-0"
                aria-hidden="true"
              >
                {initial}
              </span>
              <span className="flex flex-col leading-tight text-left">
                <span className="text-white truncate max-w-[160px]">{displayName}</span>
                <span className="text-brand-cream/90 font-normal text-xs truncate max-w-[160px]">
                  {activeEmail}
                </span>
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded transition"
            >
              Sair
            </button>
          </div>

          {/* Hambúrguer (mobile) */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {/* Menu mobile */}
        {isOpen && (
          <div className="md:hidden bg-brand-blue border-t border-brand-blue px-6 py-4 flex flex-col gap-4 font-bold text-white shadow-xl absolute w-full">
            {/* Bloco de identidade (mobile) */}
            <div className="flex items-center gap-3 pb-3 border-b border-brand-cream/20">
              <span
                className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-cream text-brand-blue font-black shrink-0"
                aria-hidden="true"
              >
                {initial}
              </span>
              <span className="flex flex-col leading-tight min-w-0">
                <span className="text-white truncate">{displayName}</span>
                <span className="text-brand-cream/90 font-normal text-xs truncate">{activeEmail}</span>
                {roleLabel && (
                  <span className="text-brand-cream/70 font-normal text-xs">{roleLabel}</span>
                )}
              </span>
            </div>

            <Link to="/painel" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Painel de Controle
            </Link>
            <Link to="/messages" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Mensagens
            </Link>
            <Link to="/profile" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Perfil
            </Link>
            <Link to="/familia" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Família
            </Link>
            <Link to="/saude" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Saúde
            </Link>
            <Link to="/mapa" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Mapa de calor
            </Link>
            <Link to="/causa" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Causa
            </Link>
            <Link to="/doacoes" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Doações
            </Link>
            <Link to="/repasses" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Repasses
            </Link>
            <Link to="/contas" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Minhas contas
            </Link>
            <Link to="/seguranca" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
              Segurança (2FA)
            </Link>
            {isSuperAdmin && (
              <Link to="/admin" onClick={() => setIsOpen(false)} className="hover:text-brand-cream transition-colors block py-1">
                Admin
              </Link>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 mt-2 rounded transition w-full text-center"
            >
              Sair
            </button>
          </div>
        )}
      </nav>

      {/*
        Barra de identidade permanente (TX-R01).
        Fica fora do <nav> para permanecer visível mesmo com o menu mobile
        fechado, e é renderizada em qualquer largura de tela.
      */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-gray-500">Conectado como</span>
          <span className="font-bold text-gray-900 truncate max-w-[220px]">{displayName}</span>
          <span className="text-gray-300" aria-hidden="true">|</span>
          <span className="text-gray-700 truncate max-w-[260px]">{activeEmail}</span>

          {roleLabel && (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
              {roleLabel}
            </span>
          )}

          {isIncomplete && (
            <Link
              to="/profile"
              className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium hover:bg-amber-200 transition"
            >
              Perfil incompleto
            </Link>
          )}

          {/* ESPACO_ATIVO — badge do espaço entra aqui na entrega 0.1 (spaces). */}
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
