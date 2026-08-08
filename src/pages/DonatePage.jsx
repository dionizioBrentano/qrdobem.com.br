import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Heart, Repeat, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { donationsApi, causesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PublicShell from '../components/layout/PublicShell';

/**
 * DonatePage — doação avulsa ou recorrente. PÚBLICA (guest checkout).
 * Fase 4, T4-R01 a T4-R04 do PLANO_TRILHAS_2026-08.md.
 *
 * DOAR NÃO EXIGE CONTA
 * O doador se identifica na própria doação (nome, e-mail, CPF — dados que os
 * meios de pagamento exigem) e consente com o uso desses dados. Login é só
 * conveniência: quando há sessão, os campos de identidade somem porque o
 * backend usa o perfil autenticado. A mesma chamada (/donations) atende os
 * dois casos — com token vira doação da conta, sem token vira guest.
 *
 * FLUXO DO CAPITAL, EXPLICADO AO DOADOR
 * O dinheiro vai para a OSCIP gestora do QR do Bem, que distribui e presta
 * contas. O bloco "Para onde vai o valor" mostra o rateio (12% sobre o bruto
 * + meio de pagamento à parte) ANTES de confirmar, via /donations/preview.
 *
 * SEM BENEFÍCIO DE IRPF
 * Modalidade ativa é doação com recibo da OSCIP; não há incentivo homologado.
 * O texto fiscal é orientativo e muda conforme o doador se declara PF ou PJ.
 */

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const FISCAL_PROFILES = [
  { value: 'pf', label: 'Pessoa física' },
  { value: 'pj_lucro_real', label: 'Empresa — lucro real' },
  { value: 'pj_outro', label: 'Empresa — outro regime' },
];

const FISCAL_TEXT = {
  pf: 'Doação solidária. Este recibo NÃO reduz o seu Imposto de Renda como incentivo de Fundo da Criança (FIA), Rouanet ou Esporte — esses precisam de projeto homologado, que não é o caso aqui.',
  pj_lucro_real:
    'Recibo emitido pela OSCIP gestora. Empresa tributada pelo lucro real pode, em geral, lançar como despesa dedutível até 2% do lucro operacional (o resultado da atividade-fim, antes do IR). Confirme o enquadramento com o contador do doador.',
  pj_outro:
    'Doação bem-vinda. Fora do lucro real (Simples ou presumido), esse abatimento específico de até 2% do lucro operacional em geral NÃO se aplica. O recibo da OSCIP continua valendo para a contabilidade da empresa.',
};

// Cálculo local ESPELHO da regra canônica (12% sobre o bruto + flags). Só
// entra em cena se o preview da API falhar — a fonte de verdade é o backend.
function localBreakdown(amount, coverFees, extra) {
  const gross = round2(amount);
  const feePercent = 12;
  const platformFee = round2((gross * feePercent) / 100);
  const paymentFee = 0;
  const amountToCause = coverFees ? gross : round2(gross - platformFee - paymentFee);
  const totalToPay = coverFees
    ? round2(gross + platformFee + paymentFee + extra)
    : round2(gross + extra);

  return {
    amount_gross: gross,
    platform_fee_percent: feePercent,
    platform_fee_amount: platformFee,
    payment_fee_amount: paymentFee,
    extra_platform_support: round2(extra),
    cover_fees: coverFees,
    amount_to_cause: amountToCause < 0 ? 0 : amountToCause,
    total_to_pay: totalToPay,
  };
}

export default function DonatePage() {
  const [searchParams] = useSearchParams();
  const { user, tenant } = useAuth();
  const isGuest = !user;

  const [causes, setCauses] = useState([]);
  const [mine, setMine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    amount: '50',
    payment_method: 'pix',
    cause_slug: searchParams.get('causa') || '',
    show_name: true, // publicidade em "Quem apoia esta causa" (inverso de anônimo)
    message: '',
    recurring: false,
    cover_fees: false,
  });

  // Identificação do doador. Sem sessão, é obrigatória; com sessão, o backend
  // usa o perfil e estes campos nem aparecem.
  const [payer, setPayer] = useState({ name: '', email: '', cpf: '' });
  const [consentLgpd, setConsentLgpd] = useState(false);

  // Apoio extra voluntário à plataforma (fora dos 12%).
  const [supportOn, setSupportOn] = useState(false);
  const [extraChoice, setExtraChoice] = useState('5'); // '5' | '10' | '25' | 'outro'
  const [extraCustom, setExtraCustom] = useState('');

  const [fiscalProfile, setFiscalProfile] = useState('pf');

  const [breakdown, setBreakdown] = useState(null);
  const [breakdownBusy, setBreakdownBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      causesApi.list().catch(() => ({ causes: [] })),
      // "Minhas doações" só existe logado; guest recebe 401 e seguimos sem.
      donationsApi.mine().catch(() => null),
    ])
      .then(([causesRes, mineRes]) => {
        setCauses(causesRes.causes || []);
        setMine(mineRes);
      })
      .finally(() => setLoading(false));
  }, []);

  // Prefill dos dados do doador logado (conveniência; os campos ficam ocultos,
  // mas mantemos o estado coerente).
  useEffect(() => {
    if (tenant) {
      setPayer((p) => ({
        ...p,
        name: p.name || tenant.name || '',
        email: p.email || tenant.email || '',
      }));
    }
  }, [tenant]);

  // Apoio extra e cobrir taxas só valem para doação avulsa: a assinatura
  // recorrente do Mercado Pago (Prompt 1) ainda não recebe esses campos.
  const effectiveCover = form.recurring ? false : form.cover_fees;
  const effectiveExtra = form.recurring || !supportOn
    ? 0
    : extraChoice === 'outro'
      ? round2(extraCustom)
      : Number(extraChoice);

  // Preview do rateio (debounce). Consome /donations/preview; se falhar (rede
  // ou 429), cai no espelho local para o bloco nunca sumir na frente do doador.
  useEffect(() => {
    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      setBreakdown(null);
      return;
    }

    let cancelled = false;
    setBreakdownBusy(true);

    const timer = setTimeout(() => {
      donationsApi
        .preview({
          amount,
          cover_fees: effectiveCover,
          extra_platform_support: effectiveExtra,
          payment_method: form.payment_method,
        })
        .then((res) => { if (!cancelled) setBreakdown(res); })
        .catch(() => {
          if (!cancelled) setBreakdown(localBreakdown(amount, effectiveCover, effectiveExtra));
        })
        .finally(() => { if (!cancelled) setBreakdownBusy(false); });
    }, 350);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.amount, form.payment_method, effectiveCover, effectiveExtra]);

  // Erros do backend em PT-BR, com tratamento amigável do limite de taxa.
  const friendlyError = (err) => {
    if (err?.status === 429) {
      return 'Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.';
    }
    return err?.message || 'Não foi possível iniciar a doação.';
  };

  const validateGuest = () => {
    if (!payer.name.trim()) return 'Informe o seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payer.email)) return 'Informe um e-mail válido.';
    if (payer.cpf.replace(/\D/g, '').length !== 11) return 'Informe um CPF válido (11 dígitos).';
    if (!consentLgpd) return 'É preciso autorizar o uso dos dados para concluir a doação.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Guest precisa se identificar e consentir antes de disparar o pagamento.
    if (isGuest) {
      const problem = validateGuest();
      if (problem) { setError(problem); return; }
    }

    setBusy(true);

    try {
      const payload = {
        amount: Number(form.amount),
        cause_slug: form.cause_slug || null,
      };

      let res;

      if (form.recurring) {
        res = await donationsApi.subscribe(payload);
      } else {
        const body = {
          ...payload,
          payment_method: form.payment_method,
          // Publicidade é o inverso de anônimo: o backend só conhece
          // is_anonymous, então a intenção positiva é traduzida aqui.
          is_anonymous: !form.show_name,
          message: form.message || null,
          cover_fees: effectiveCover,
          extra_platform_support: effectiveExtra,
        };

        // Sem sessão: anexa identidade + consentimento LGPD. Com sessão, o
        // backend usa o perfil e ignora estes campos.
        if (isGuest) {
          body.payer_name = payer.name.trim();
          body.payer_email = payer.email.trim();
          body.payer_cpf = payer.cpf;
          body.consent_lgpd = true;
        }

        res = await donationsApi.create(body);
      }

      // O Mercado Pago devolve o ponto de checkout. `init_point` é a URL
      // de produção; `sandbox_init_point` só existe no ambiente de teste.
      const checkoutUrl = res.checkout?.init_point || res.checkout?.sandbox_init_point;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      setError('Pagamento iniciado, mas não recebemos o link do Mercado Pago. Confira o seu e-mail.');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const money = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // O botão mostra o TOTAL A PAGAR (com taxa/apoio quando o doador escolhe
  // cobrir), não o bruto digitado — para não surpreender no Mercado Pago.
  const totalToPay = breakdown ? breakdown.total_to_pay : Number(form.amount);
  const feePercentLabel = breakdown
    ? Number(breakdown.platform_fee_percent).toLocaleString('pt-BR')
    : '12';

  const status = searchParams.get('status');

  return (
    <PublicShell>
      <div className="bg-gray-50 flex-1 w-full">

      <div className="max-w-2xl mx-auto p-4 py-8 space-y-6">
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



        {loading ? (
          <div className="text-gray-500 py-8">Carregando...</div>
        ) : (
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

          {/* Doação mensal recorrente exige conta (a assinatura é vinculada a
              um tenant). Para o guest, o campo fica desabilitado com o convite
              a entrar — nada de deixá-lo marcar e frustrar com erro depois. */}
          <label className={`flex items-center gap-2 text-sm ${isGuest ? 'text-gray-400' : ''}`}>
            <input
              type="checkbox"
              disabled={isGuest}
              checked={form.recurring}
              onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
            />
            <Repeat className="w-4 h-4" />
            Repetir todo mês
            {isGuest && (
              <span className="text-xs">
                (requer <Link to="/login" className="text-brand-blue underline">entrar</Link>)
              </span>
            )}
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

          {/* Identificação do doador — só sem sessão. Os meios de pagamento
              exigem nome, e-mail e CPF; o consentimento LGPD é obrigatório. */}
          {isGuest && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <p className="text-sm font-bold text-gray-700">Seus dados</p>
              <input
                type="text"
                placeholder="Nome completo"
                autoComplete="name"
                value={payer.name}
                onChange={(e) => setPayer({ ...payer, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="E-mail (para o recibo)"
                autoComplete="email"
                value={payer.email}
                onChange={(e) => setPayer({ ...payer, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="CPF"
                value={payer.cpf}
                onChange={(e) => setPayer({ ...payer, cpf: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <label className="flex items-start gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={consentLgpd}
                  onChange={(e) => setConsentLgpd(e.target.checked)}
                />
                <span>
                  Autorizo o uso destes dados para processar o pagamento, emitir
                  o recibo e conciliar a doação.
                </span>
              </label>
            </div>
          )}

          {!isGuest && tenant && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-blue" />
              Doando como <strong>{tenant.name}</strong>.
            </p>
          )}

          {/* Opções de rateio — só na doação avulsa (a recorrente ainda não as
              recebe no backend). */}
          {!form.recurring && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.cover_fees}
                  onChange={(e) => setForm({ ...form, cover_fees: e.target.checked })}
                />
                <span>
                  Quero que o valor que digitei vá <strong>100% para a causa</strong>{' '}
                  — acrescento a taxa operacional e o meio de pagamento.
                </span>
              </label>

              <div className="text-sm">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={supportOn}
                    onChange={(e) => setSupportOn(e.target.checked)}
                  />
                  <span>Quero apoiar o QR do Bem além da taxa (contribuição voluntária).</span>
                </label>

                {supportOn && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
                    {['5', '10', '25'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setExtraChoice(v)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition ${
                          extraChoice === v
                            ? 'border-brand-blue bg-brand-blue-soft text-brand-blue'
                            : 'border-gray-300 hover:border-brand-blue'
                        }`}
                      >
                        {money(Number(v))}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setExtraChoice('outro')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition ${
                        extraChoice === 'outro'
                          ? 'border-brand-blue bg-brand-blue-soft text-brand-blue'
                          : 'border-gray-300 hover:border-brand-blue'
                      }`}
                    >
                      Outro
                    </button>
                    {extraChoice === 'outro' && (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="R$"
                        value={extraCustom}
                        onChange={(e) => setExtraCustom(e.target.value)}
                        className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                      />
                    )}
                  </div>
                )}
              </div>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.show_name}
                  onChange={(e) => setForm({ ...form, show_name: e.target.checked })}
                />
                <span>
                  Pode mostrar meu nome / razão social em{' '}
                  <strong>"Quem apoia esta causa"</strong>.
                </span>
              </label>

              <input
                type="text"
                maxLength={500}
                placeholder="Mensagem (opcional)"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* Bloco "Para onde vai o valor" — rateio sempre visível ANTES de
              confirmar. Fonte: /donations/preview (espelho local como reserva). */}
          {breakdown && (
            <div className="bg-brand-blue-soft/60 border border-brand-blue/20 rounded-xl p-4 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800">Para onde vai o valor</span>
                {breakdownBusy && <span className="text-xs text-gray-500">calculando…</span>}
              </div>

              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Valor da doação</dt>
                  <dd className="font-medium text-gray-800">{money(breakdown.amount_gross)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Taxa operacional QR do Bem / OSCIP ({feePercentLabel}%)</dt>
                  <dd className="font-medium text-gray-800">{money(breakdown.platform_fee_amount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Meio de pagamento</dt>
                  <dd className="font-medium text-gray-800">
                    {breakdown.payment_fee_amount > 0
                      ? money(breakdown.payment_fee_amount)
                      : 'conforme a operadora'}
                  </dd>
                </div>
                {breakdown.extra_platform_support > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Apoio voluntário ao QR do Bem</dt>
                    <dd className="font-medium text-gray-800">{money(breakdown.extra_platform_support)}</dd>
                  </div>
                )}

                <div className="flex justify-between border-t border-brand-blue/20 pt-2 mt-1">
                  <dt className="font-bold text-brand-blue">Destinado a esta causa</dt>
                  <dd className="font-black text-brand-blue">{money(breakdown.amount_to_cause)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-bold text-gray-800">Total a pagar{form.recurring ? ' / mês' : ''}</dt>
                  <dd className="font-black text-gray-900">{money(breakdown.total_to_pay)}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Orientação fiscal — autodeclarada, porque o cadastro não distingue
              PF de PJ. Nada de promessa de redução de IRPF. */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <label className="block">
              <span className="block font-bold text-gray-700 mb-1 text-sm">Perfil do doador (orientação fiscal)</span>
              <select
                value={fiscalProfile}
                onChange={(e) => setFiscalProfile(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {FISCAL_PROFILES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 flex gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
              <span>{FISCAL_TEXT[fiscalProfile]}</span>
            </p>
          </div>

          {status === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-sm">
              Doação concluída. Obrigado! O recibo vai para o e-mail informado; a confirmação pode levar alguns minutos.
            </div>
          )}

          {status === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
              Pagamento pendente. Assim que for compensado, enviamos o recibo por e-mail.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white font-black py-4 rounded-lg text-lg disabled:opacity-50"
          >
            {busy
              ? 'Abrindo pagamento...'
              : `Doar ${money(totalToPay)}${form.recurring ? ' / mês' : ''}`}
          </button>
        </form>
        )}

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
      </div>
    </PublicShell>
  );
}
