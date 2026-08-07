import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { HandHeart, Plus, Check, Camera, AlertCircle } from 'lucide-react';
import { beneficiariesApi } from '../services/api';

/**
 * BeneficiaryPage — a URL única do beneficiário.
 * Fase 4, T4-R05, T4-R06 e T4-R07 do PLANO_TRILHAS_2026-08.md.
 *
 * O requisito é literal: o beneficiário OBRIGATORIAMENTE usa esta URL para
 *   1. solicitar suas necessidades
 *   2. comprovar o recebimento (contraprova)
 *   3. registrar provas sociais de agradecimento
 *
 * Página pública, sem login: o beneficiário não tem conta no sistema. A
 * credencial é a combinação do link (que só ele tem) com o fator de
 * contraprova (que só ele ou o tutor sabem).
 *
 * DESENHO DA TELA
 * Texto grande, poucos campos, um passo por vez. O público desta página
 * pode estar usando um celular emprestado, com pressa, sem intimidade com
 * formulário. Cada campo a mais é uma chance de o repasse não se confirmar.
 */
export default function BeneficiaryPage() {
  const { uniqueCode } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const [showNeedForm, setShowNeedForm] = useState(false);
  const [need, setNeed] = useState({ title: '', description: '', kind: 'product' });

  // Confirmação em andamento: guarda o repasse e a senha digitada.
  const [confirming, setConfirming] = useState(null);
  const [password, setPassword] = useState('');

  useEffect(() => { load(); }, [uniqueCode]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await beneficiariesApi.publicShow(uniqueCode));
    } catch (err) {
      setError(err.message || 'Página não encontrada.');
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg) => {
    setOk(msg);
    setTimeout(() => setOk(''), 4000);
  };

  const handleCreateNeed = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await beneficiariesApi.createNeed(uniqueCode, need);
      setNeed({ title: '', description: '', kind: 'product' });
      setShowNeedForm(false);
      flash('Pedido registrado.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      await beneficiariesApi.confirmReceipt(
        uniqueCode,
        confirming.id,
        'password',
        password
      );
      setConfirming(null);
      setPassword('');
      flash('Recebimento confirmado. Obrigado!');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleProof = async (disbursementId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError('');
    try {
      await beneficiariesApi.sendProof(uniqueCode, disbursementId, file);
      flash('Obrigado! A foto passará por revisão.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando...</div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center text-gray-700">
        {error || 'Página não encontrada.'}
      </div>
    );
  }

  const { beneficiary, needs, pending_confirmation } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-4 space-y-4 pt-8">

        <header className="bg-white rounded-2xl shadow-xl p-6 text-center">
          <HandHeart className="w-10 h-10 text-brand-blue mx-auto mb-2" />
          <h1 className="text-xl font-black text-gray-900">Olá, {beneficiary.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Esta é a sua página. Aqui você pede o que precisa e confirma o que recebeu.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {ok && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-sm">
            {ok}
          </div>
        )}

        {/* Confirmação pendente vem PRIMEIRO: é a ação mais importante da
            página, e o requisito trata a contraprova como crítica. */}
        {pending_confirmation?.length > 0 && (
          <section className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 space-y-3">
            <h2 className="font-black text-amber-900">Você recebeu?</h2>
            <p className="text-sm text-amber-800">
              Confirme o recebimento abaixo. É assim que quem doou fica sabendo
              que chegou até você.
            </p>

            {pending_confirmation.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4 space-y-2">
                <p className="font-bold text-gray-900">{item.description}</p>

                {confirming?.id === item.id ? (
                  <form onSubmit={handleConfirm} className="space-y-2">
                    <label className="block text-sm">
                      <span className="block font-bold text-gray-700 mb-1">Sua senha</span>
                      <input
                        type="password"
                        required
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-3 text-lg"
                      />
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={busy}
                        className="flex-1 bg-emerald-600 text-white font-black py-3 rounded-lg disabled:opacity-50"
                      >
                        {busy ? 'Confirmando...' : 'CONFIRMAR'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setConfirming(null); setPassword(''); }}
                        className="px-4 border border-gray-300 rounded-lg text-sm font-bold text-gray-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setConfirming(item)}
                    className="w-full bg-emerald-600 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    JÁ RECEBI
                  </button>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Pedidos */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">O que você precisa</h2>
            <button
              onClick={() => setShowNeedForm(!showNeedForm)}
              className="bg-brand-accent hover:bg-brand-accent-strong text-white text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Pedir
            </button>
          </div>

          {showNeedForm && (
            <form onSubmit={handleCreateNeed} className="space-y-2 mb-4">
              <input
                type="text"
                required
                maxLength={255}
                placeholder="O que você precisa?"
                value={need.title}
                onChange={(e) => setNeed({ ...need, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-3"
              />

              <textarea
                rows={3}
                maxLength={2000}
                placeholder="Conte um pouco mais (opcional)"
                value={need.description}
                onChange={(e) => setNeed({ ...need, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />

              <select
                value={need.kind}
                onChange={(e) => setNeed({ ...need, kind: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="product">Produto (alimento, roupa, remédio...)</option>
                <option value="service">Serviço (consulta, transporte, conserto...)</option>
                <option value="money">Dinheiro</option>
              </select>

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white font-bold py-3 rounded-lg disabled:opacity-50"
              >
                {busy ? 'Enviando...' : 'Enviar pedido'}
              </button>
            </form>
          )}

          {needs.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum pedido no momento.</p>
          ) : (
            <ul className="space-y-2">
              {needs.map((n) => (
                <li key={n.id} className="border border-gray-200 rounded-lg p-3">
                  <p className="font-bold text-gray-900">{n.title}</p>
                  {n.description && <p className="text-sm text-gray-600">{n.description}</p>}
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                    n.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {n.status === 'in_progress' ? 'A caminho' : 'Aguardando'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Prova social: só aparece para o que já foi confirmado. */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">Agradecer com foto</h2>
          <p className="text-sm text-gray-500 mb-3">
            Se quiser, envie uma foto ou vídeo. Quem doou vai poder ver.
          </p>

          <label className="cursor-pointer w-full bg-gray-100 hover:bg-gray-200 py-3 rounded-lg font-bold text-gray-700 flex items-center justify-center gap-2">
            <Camera className="w-5 h-5" />
            Enviar foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4"
              className="hidden"
              onChange={(e) => {
                // Vincula à última confirmação: é a única para a qual o
                // backend aceita prova social.
                const target = pending_confirmation?.[0]?.id;
                if (target) return handleProof(target, e);
                setError('Confirme um recebimento antes de enviar a foto.');
                e.target.value = '';
              }}
            />
          </label>
        </section>

        <p className="text-center text-xs text-gray-400 py-4">QR do Bem</p>
      </div>
    </div>
  );
}
