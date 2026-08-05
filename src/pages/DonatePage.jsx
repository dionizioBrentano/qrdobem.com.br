import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, Repeat, AlertCircle } from 'lucide-react';
import { donationsApi, causesApi } from '../services/api';

/**
 * DonatePage — doação avulsa ou recorrente.
 * Fase 4, T4-R01 a T4-R04 do PLANO_TRILHAS_2026-08.md.
 *
 * FLUXO DO CAPITAL, EXPLICADO AO DOADOR
 * O doador escolhe a causa; o dinheiro vai para a OSCIP gestora do QR do
 * Bem, que operacionaliza a distribuição. Isso está escrito na tela, e não
 * escondido: quem doa tem o direito de saber por onde o recurso passa —
 * e é essa transparência que sustenta a prestação de contas da trilha.
 */
export default function DonatePage() {
  const [searchParams] = useSearchParams();

  const [causes, setCauses] = useState([]);
  const [mine, setMine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    amount: '50',
    payment_method: 'pix',
    cause_slug: searchParams.get('causa') || '',
    is_anonymous: false,
    message: '',
    recurring: false,
  });

  useEffect(() => {
    Promise.all([
      causesApi.list().catch(() => ({ causes: [] })),
      donationsApi.mine().catch(() => null),
    ])
      .then(([causesRes, mineRes]) => {
        setCauses(causesRes.causes || []);
        setMine(mineRes);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const payload = {
        amount: Number(form.amount),
        cause_slug: form.cause_slug || null,
      };

      const res = form.recurring
        ? await donationsApi.subscribe(payload)
        : await donationsApi.create({
            ...payload,
            payment_method: form.payment_method,
            is_anonymous: form.is_anonymous,
            message: form.message || null,
          });

      // O Mercado Pago devolve o ponto de checkout. `init_point` é a URL
      // de produção; `sandbox_init_point` só existe no ambiente de teste.
      const checkoutUrl = res.checkout?.init_point || res.checkout?.sandbox_init_point;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      setError('Pagamento iniciado, mas não recebemos o link do Mercado Pago. Confira em "Minhas doações".');
    } catch (err) {
      setError(err.message || 'Não foi possível iniciar a doação.');
    } finally {
      setBusy(false);
    }
  };

  const money = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) return <div className="text-gray-500 py-8">Carregando...</div>;

  const status = searchParams.get('status');

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Heart className="w-6 h-6" />
          Doar
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Escolha uma causa. A doação vai para a OSCIP gestora do QR do Bem,
          que faz a distribuição e presta contas.
        </p>
      </header>

      {status === 'success' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-sm">
          Doação concluída. Obrigado! A confirmação pode levar alguns minutos
          para aparecer.
        </div>
      )}

      {status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          Pagamento pendente. Assim que for compensado, a doação aparece aqui.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <label className="block">
          <span className="block font-bold text-gray-700 mb-1 text-sm">Causa</span>
          <select
            value={form.cause_slug}
            onChange={(e) => setForm({ ...form, cause_slug: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Onde for mais necessário</option>
            {causes.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block font-bold text-gray-700 mb-1 text-sm">Valor</span>
          <input
            type="number"
            min="1"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-3 text-lg font-bold"
          />
        </label>

        {/* Valores sugeridos: reduzem o atrito de decidir quanto doar. */}
        <div className="flex flex-wrap gap-2">
          {[20, 50, 100, 200].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setForm({ ...form, amount: String(v) })}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold hover:border-brand-blue"
            >
              {money(v)}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.recurring}
            onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
          />
          <Repeat className="w-4 h-4" />
          Repetir todo mês
        </label>

        {/* Assinatura recorrente no Mercado Pago é sempre por cartão — não
            faz sentido oferecer Pix aqui e frustrar na tela seguinte. */}
        {!form.recurring && (
          <label className="block">
            <span className="block font-bold text-gray-700 mb-1 text-sm">Forma de pagamento</span>
            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="pix">Pix</option>
              <option value="credit_card">Cartão de crédito</option>
              <option value="citizen_card">Cartão Cidadão</option>
            </select>
          </label>
        )}

        {!form.recurring && (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_anonymous}
                onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
              />
              Doar anonimamente
            </label>

            <input
              type="text"
              maxLength={500}
              placeholder="Mensagem (opcional)"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-brand-blue text-white font-black py-4 rounded-lg text-lg disabled:opacity-50"
        >
          {busy ? 'Abrindo pagamento...' : `Doar ${money(form.amount)}`}
        </button>
      </form>

      {mine?.donations?.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-gray-900 mb-1">Minhas doações</h2>
          <p className="text-sm text-gray-500 mb-3">
            Total doado: <strong>{money(mine.total_donated)}</strong>
          </p>

          <ul className="space-y-2">
            {mine.donations.map((d) => (
              <li key={d.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <span>
                  {money(d.amount)}
                  {d.cause && <span className="text-gray-500"> — {d.cause.name}</span>}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  d.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : d.status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-800'
                }`}>
                  {d.status === 'paid' ? 'Confirmada' : d.status === 'failed' ? 'Falhou' : 'Pendente'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
