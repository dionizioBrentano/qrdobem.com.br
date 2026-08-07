import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, Copy, AlertCircle, Check } from 'lucide-react';
import { twoFactorApi } from '../services/api';

/**
 * TwoFactorPage — verificação em duas etapas por aplicativo autenticador.
 * Fase 1, entrega 1.5 do PLANO_TRILHAS_2026-08.md (T1-R05).
 *
 * FLUXO EM DUAS ETAPAS, ESPELHANDO O BACKEND
 *   1. "Ativar"   → o servidor gera o segredo e devolve o otpauth://
 *   2. "Confirmar"→ o usuário digita um código do app; só aí ativa, e os
 *                   códigos de recuperação aparecem UMA vez.
 *
 * Sem a etapa 2, quem fecha a tela antes de escanear fica trancado fora da
 * conta com um segredo que não guardou.
 *
 * O QR é montado pela própria API do sistema (`/entities/.../qrcode` é para
 * entidades, então aqui exibimos o segredo em texto e o link otpauth://).
 * Digitar o segredo à mão é caminho oficial em todos os apps autenticadores
 * — e evita depender de uma biblioteca de QR no frontend só para esta tela.
 */
export default function TwoFactorPage() {
  const [status, setStatus] = useState(null);
  const [setupData, setSetupData] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadStatus(); }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      setStatus(await twoFactorApi.status());
    } catch (err) {
      setError(err.message || 'Não foi possível carregar o status.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setBusy(true);
    setError('');
    try {
      setSetupData(await twoFactorApi.setup());
    } catch (err) {
      setError(err.message || 'Não foi possível iniciar a configuração.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await twoFactorApi.confirm(code);
      setRecoveryCodes(res.recovery_codes);
      setSetupData(null);
      setCode('');
      await loadStatus();
    } catch (err) {
      setError(err.message || 'Código inválido.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await twoFactorApi.disable(code);
      setCode('');
      setRecoveryCodes(null);
      await loadStatus();
    } catch (err) {
      setError(err.message || 'Não foi possível desativar.');
    } finally {
      setBusy(false);
    }
  };

  const copySecret = () => {
    if (!setupData?.secret) return;
    navigator.clipboard?.writeText(setupData.secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  if (loading) {
    return <div className="text-gray-500 py-8">Carregando...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          {status?.enabled ? <ShieldCheck className="w-6 h-6 text-emerald-600" /> : <ShieldOff className="w-6 h-6 text-gray-400" />}
          Verificação em duas etapas
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Opcional. Funciona com Google Authenticator, Authy e Microsoft Authenticator.
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Códigos de recuperação — exibidos uma única vez. */}
      {recoveryCodes && (
        <div className="border-2 border-amber-400 bg-amber-50 rounded-xl p-4">
          <h2 className="font-black text-amber-900 mb-2">Guarde estes códigos agora</h2>
          <p className="text-sm text-amber-800 mb-3">
            Eles servem para entrar se você perder o celular. <strong>Não serão exibidos de novo.</strong>
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {recoveryCodes.map((c) => (
              <div key={c} className="bg-white border border-amber-200 rounded px-2 py-1">{c}</div>
            ))}
          </div>
        </div>
      )}

      {/* Estado: ativo */}
      {status?.enabled && !recoveryCodes && (
        <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 space-y-3">
          <p className="text-sm text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Ativa nesta conta. Códigos de recuperação restantes: <strong>{status.recovery_codes_left}</strong>
          </p>

          <form onSubmit={handleDisable} className="flex flex-wrap gap-2 items-end">
            <label className="text-sm">
              <span className="block font-bold text-gray-700 mb-1">
                Para desativar, digite um código do app
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 font-mono tracking-widest w-40"
                placeholder="000000"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Desativar
            </button>
          </form>
        </div>
      )}

      {/* Estado: configurando */}
      {setupData && (
        <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-4">
          <div>
            <h2 className="font-bold text-gray-900 mb-1">1. Cadastre no aplicativo</h2>
            <p className="text-sm text-gray-600 mb-2">
              Abra o app autenticador e escolha "inserir chave manualmente".
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 rounded px-3 py-2 font-mono text-sm break-all">
                {setupData.secret}
              </code>
              <button
                onClick={copySecret}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                title="Copiar"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <a
              href={setupData.provisioning_uri}
              className="text-xs text-brand-blue underline mt-2 inline-block"
            >
              Ou toque aqui para abrir direto no aplicativo
            </a>
          </div>

          <form onSubmit={handleConfirm}>
            <h2 className="font-bold text-gray-900 mb-1">2. Confirme com um código</h2>
            <p className="text-sm text-gray-600 mb-2">
              Digite o código de 6 dígitos que aparece no app.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 font-mono tracking-widest w-40"
                placeholder="000000"
              />
              <button
                type="submit"
                disabled={busy}
                className="bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {busy ? 'Verificando...' : 'Ativar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Estado: desativado */}
      {!status?.enabled && !setupData && (
        <button
          onClick={handleSetup}
          disabled={busy}
          className="bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-5 py-3 rounded-lg disabled:opacity-50"
        >
          {busy ? 'Gerando...' : 'Ativar verificação em duas etapas'}
        </button>
      )}
    </div>
  );
}
