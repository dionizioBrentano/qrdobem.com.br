import { useEffect, useState } from 'react';
import { PackageCheck, Plus, UserPlus, Copy, Check, AlertCircle } from 'lucide-react';
import { spacesApi, beneficiariesApi, disbursementsApi, causeProductsApi } from '../services/api';

/**
 * DisbursementsPage — gestão de beneficiários e repasses.
 * Fase 4, T4-R03, T4-R05, T4-R06 e T4-R08 do PLANO_TRILHAS_2026-08.md.
 *
 * A tela segue a máquina de estados do backend:
 *   requested → approved → sent → confirmed
 * Os botões vêm de `next_states`, devolvido pela API. O frontend não
 * decide o que pode ser feito — ele obedece. Duplicar a regra aqui é como
 * as duas versões divergem e um repasse pula uma etapa.
 *
 * `confirmed` NUNCA aparece como botão: esse estado só se alcança pela
 * contraprova do beneficiário, na URL única dele. É o ponto todo da
 * trilha, e abrir uma porta aqui destruiria a garantia.
 */

const STATUS_LABELS = {
  requested: 'Solicitado',
  approved:  'Aprovado',
  sent:      'Enviado',
  confirmed: 'Confirmado pelo beneficiário',
  disputed:  'Contestado',
};

const STATUS_CLASSES = {
  requested: 'bg-gray-100 text-gray-700',
  approved:  'bg-blue-100 text-blue-800',
  sent:      'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  disputed:  'bg-red-100 text-red-700',
};

const ACTION_LABELS = {
  approved: 'Aprovar',
  sent:     'Marcar como enviado',
  disputed: 'Contestar',
};

export default function DisbursementsPage() {
  const [spaces, setSpaces] = useState([]);
  const [spaceId, setSpaceId] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalConfirmed, setTotalConfirmed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const [showBeneficiaryForm, setShowBeneficiaryForm] = useState(false);
  const [beneficiaryForm, setBeneficiaryForm] = useState({ name: '', city: '', state: '', phone: '' });

  const [showDisbursementForm, setShowDisbursementForm] = useState(false);
  const [disbursementForm, setDisbursementForm] = useState({
    beneficiary_id: '', kind: 'product', description: '', amount: '',
  });

  const [showNeedFormFor, setShowNeedFormFor] = useState(null);
  const [needForm, setNeedForm] = useState({
    cause_product_id: '', quantity: '', accepts_substitute: true, period_starts_on: '', period_ends_on: '', title: ''
  });

  useEffect(() => {
    spacesApi.list()
      .then((res) => {
        const list = (res.spaces || []).filter((s) => ['cause', 'donation'].includes(s.type));
        setSpaces(list);
        if (list.length) setSpaceId(list[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!spaceId) return;
    loadAll();
  }, [spaceId]);

  const loadAll = async () => {
    setError('');
    try {
      const [bRes, dRes, pRes] = await Promise.all([
        beneficiariesApi.list(spaceId),
        disbursementsApi.list(spaceId),
        causeProductsApi.list(spaceId).catch(() => ({ products: [] })),
      ]);
      setBeneficiaries(bRes.beneficiaries || []);
      setDisbursements(dRes.disbursements || []);
      setProducts(pRes.products || []);
      setTotalConfirmed(dRes.total_confirmed || 0);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateBeneficiary = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await beneficiariesApi.create(spaceId, beneficiaryForm);
      setBeneficiaryForm({ name: '', city: '', state: '', phone: '' });
      setShowBeneficiaryForm(false);
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateDisbursement = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await disbursementsApi.create(spaceId, {
        ...disbursementForm,
        beneficiary_id: Number(disbursementForm.beneficiary_id),
        amount: disbursementForm.amount === '' ? null : Number(disbursementForm.amount),
      });
      setDisbursementForm({ beneficiary_id: '', kind: 'product', description: '', amount: '' });
      setShowDisbursementForm(false);
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleTransition = async (id, status) => {
    setError('');
    try {
      await disbursementsApi.transition(id, status);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetPassword = async (beneficiaryId) => {
    const password = window.prompt('Senha de comprovação (entregue de viva voz ao beneficiário):');
    if (!password) return;

    setError('');
    try {
      await beneficiariesApi.setProofPassword(beneficiaryId, password);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateNeedFor = async (e, beneficiary) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    
    try {
      const payload = {
        title: needForm.title,
        cause_product_id: needForm.cause_product_id ? Number(needForm.cause_product_id) : null,
        quantity: needForm.quantity ? Number(needForm.quantity) : null,
        accepts_substitute: needForm.accepts_substitute,
        period_starts_on: needForm.period_starts_on || null,
        period_ends_on: needForm.period_ends_on || null,
        kind: 'product'
      };
      
      await beneficiariesApi.createNeed(beneficiary.unique_code, payload);
      setShowNeedFormFor(null);
      setNeedForm({
        cause_product_id: '', quantity: '', accepts_substitute: true, period_starts_on: '', period_ends_on: '', title: ''
      });
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copyUrl = (id, url) => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  };

  const money = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) return <div className="text-gray-500 py-8">Carregando...</div>;

  if (!spaces.length) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
        Você precisa de um espaço do tipo Causa para gerir repasses.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <PackageCheck className="w-6 h-6" />
            Repasses
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Confirmado pelos beneficiários: <strong>{money(totalConfirmed)}</strong>
          </p>
        </div>

        {spaces.length > 1 && (
          <select
            value={spaceId || ''}
            onChange={(e) => setSpaceId(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Beneficiários */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Beneficiários ({beneficiaries.length})</h2>
          <button
            onClick={() => setShowBeneficiaryForm(!showBeneficiaryForm)}
            className="bg-brand-accent hover:bg-brand-accent-strong text-white text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4" />
            Novo
          </button>
        </div>

        {showBeneficiaryForm && (
          <form onSubmit={handleCreateBeneficiary} className="grid gap-2 md:grid-cols-4 mb-4">
            <input
              type="text" required maxLength={255} placeholder="Nome"
              value={beneficiaryForm.name}
              onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, name: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-2"
            />
            <input
              type="text" maxLength={120} placeholder="Cidade"
              value={beneficiaryForm.city}
              onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, city: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              type="text" maxLength={2} placeholder="UF"
              value={beneficiaryForm.state}
              onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, state: e.target.value.toUpperCase() })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <button
              type="submit" disabled={busy}
              className="bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-4 py-2 rounded text-sm md:col-span-4 disabled:opacity-50"
            >
              Cadastrar beneficiário
            </button>
          </form>
        )}

        {beneficiaries.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum beneficiário cadastrado.</p>
        ) : (
          <ul className="space-y-2">
            {beneficiaries.map((b) => (
              <li key={b.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-500">
                      {[b.city, b.state].filter(Boolean).join(' — ')}
                      {b.open_needs > 0 && ` · ${b.open_needs} pedido(s) aberto(s)`}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowNeedFormFor(showNeedFormFor === b.id ? null : b.id)}
                      className="text-xs border border-gray-300 px-2 py-1 rounded bg-brand-accent text-white font-bold"
                    >
                      + Pedido
                    </button>
                    
                    <button
                      onClick={() => copyUrl(b.id, b.url)}
                      className="text-xs border border-gray-300 px-2 py-1 rounded flex items-center gap-1"
                      title="Copiar a URL única do beneficiário"
                    >
                      {copiedId === b.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Link
                    </button>

                    <button
                      onClick={() => handleSetPassword(b.id)}
                      className="text-xs border border-gray-300 px-2 py-1 rounded"
                    >
                      Definir senha
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  Confirmação por: {b.factors.join(', ')}
                </p>

                {showNeedFormFor === b.id && (
                  <form onSubmit={(e) => handleCreateNeedFor(e, b)} className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700">Título do Pedido (se não houver produto)</label>
                      <input type="text" value={needForm.title} onChange={e => setNeedForm(p => ({ ...p, title: e.target.value }))} className="w-full border p-2 rounded text-sm mt-1" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700">Produto do Catálogo</label>
                      <select value={needForm.cause_product_id} onChange={e => setNeedForm(p => ({ ...p, cause_product_id: e.target.value }))} className="w-full border p-2 rounded text-sm mt-1">
                        <option value="">-- Nenhum --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700">Quantidade</label>
                      <input type="number" step="0.01" value={needForm.quantity} onChange={e => setNeedForm(p => ({ ...p, quantity: e.target.value }))} className="w-full border p-2 rounded text-sm mt-1" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700">Período de Início</label>
                      <input type="date" value={needForm.period_starts_on} onChange={e => setNeedForm(p => ({ ...p, period_starts_on: e.target.value }))} className="w-full border p-2 rounded text-sm mt-1" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700">Período de Fim</label>
                      <input type="date" value={needForm.period_ends_on} onChange={e => setNeedForm(p => ({ ...p, period_ends_on: e.target.value }))} className="w-full border p-2 rounded text-sm mt-1" />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input type="checkbox" id={`sub-${b.id}`} checked={needForm.accepts_substitute} onChange={e => setNeedForm(p => ({ ...p, accepts_substitute: e.target.checked }))} />
                      <label htmlFor={`sub-${b.id}`} className="text-sm">Aceita Produto Similar</label>
                    </div>
                    <div className="md:col-span-2 text-right">
                      <button type="submit" disabled={busy} className="bg-emerald-600 text-white font-bold px-4 py-2 rounded text-sm disabled:opacity-50">
                        Vincular Pedido
                      </button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Repasses */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Repasses ({disbursements.length})</h2>
          <button
            onClick={() => setShowDisbursementForm(!showDisbursementForm)}
            disabled={!beneficiaries.length}
            className="bg-brand-accent hover:bg-brand-accent-strong text-white text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Novo
          </button>
        </div>

        {showDisbursementForm && (
          <form onSubmit={handleCreateDisbursement} className="grid gap-2 md:grid-cols-4 mb-4">
            <select
              required
              value={disbursementForm.beneficiary_id}
              onChange={(e) => setDisbursementForm({ ...disbursementForm, beneficiary_id: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">Beneficiário...</option>
              {beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>

            <select
              value={disbursementForm.kind}
              onChange={(e) => setDisbursementForm({ ...disbursementForm, kind: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="product">Produto</option>
              <option value="service">Serviço</option>
              <option value="money">Dinheiro</option>
            </select>

            <input
              type="text" required maxLength={500} placeholder="Descrição"
              value={disbursementForm.description}
              onChange={(e) => setDisbursementForm({ ...disbursementForm, description: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />

            <input
              type="number" min="0" step="0.01" placeholder="Valor (opcional)"
              value={disbursementForm.amount}
              onChange={(e) => setDisbursementForm({ ...disbursementForm, amount: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />

            <button
              type="submit" disabled={busy}
              className="bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-4 py-2 rounded text-sm md:col-span-4 disabled:opacity-50"
            >
              Registrar repasse
            </button>
          </form>
        )}

        {disbursements.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum repasse registrado.</p>
        ) : (
          <ul className="space-y-2">
            {disbursements.map((d) => (
              <li key={d.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{d.description}</p>
                    <p className="text-xs text-gray-500">
                      {d.beneficiary_name}
                      {d.amount && ` · ${money(d.amount)}`}
                    </p>
                  </div>

                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CLASSES[d.status]}`}>
                    {STATUS_LABELS[d.status] || d.status}
                  </span>
                </div>

                {/* Botões vêm de `next_states`, do backend. `confirmed` não
                    aparece: só o beneficiário confirma, pela URL dele. */}
                {d.next_states?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {d.next_states
                      .filter((s) => s !== 'confirmed')
                      .map((s) => (
                        <button
                          key={s}
                          onClick={() => handleTransition(d.id, s)}
                          className="text-xs border border-gray-300 px-3 py-1 rounded font-bold hover:border-brand-blue"
                        >
                          {ACTION_LABELS[s] || s}
                        </button>
                      ))}
                  </div>
                )}

                {d.status === 'sent' && (
                  <p className="text-xs text-amber-700 mt-2">
                    Aguardando o beneficiário confirmar pela URL dele.
                  </p>
                )}

                {d.confirmed_at && (
                  <p className="text-xs text-emerald-700 mt-2">
                    Confirmado em {new Date(d.confirmed_at).toLocaleString('pt-BR')}
                    {d.proof_factor === 'tutor' && ' (pelo tutor)'}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
