import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Heart, Repeat, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { donationsApi, causesApi, creditsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PublicShell from '../components/layout/PublicShell';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

const money = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const feePercentLabel = '12';

const FISCAL_PROFILES = [
  { value: 'pf', label: 'Pessoa física' },
  { value: 'pj', label: 'Pessoa jurídica (Empresa)' }
];

const FISCAL_TEXT = {
  pf: 'Doação solidária. Este recibo NÃO reduz o seu Imposto de Renda como incentivo de Fundo da Criança (FIA), Rouanet ou Esporte — esses precisam de projeto homologado, que não é o caso aqui.',
  pj: 'A doação pode ser lançada como Despesa Operacional (até 2% do Lucro Operacional) para empresas no Lucro Real, reduzindo IRPJ/CSLL, conforme Lei 9.249/95 (se a OSCIP for qualificada). O recibo será emitido em nome da sua empresa.'
};

export default function DonatePage() {
  const [searchParams] = useSearchParams();
  const { user, tenant } = useAuth();
  const isGuest = !user;
  const status = searchParams.get('status');

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
  const [pixData, setPixData] = useState(null);
  const [orderId, setOrderId] = useState(null);

  const effectiveCover = form.cover_fees;
  const effectiveExtra = !supportOn ? 0 : extraChoice === 'outro' ? parseFloat(extraCustom) || 0 : Number(extraChoice);

  const totalToPay = breakdown ? breakdown.total_to_pay : Number(form.amount);

  const initialization = useMemo(() => ({ amount: totalToPay }), [totalToPay]);
  const customization = useMemo(() => ({
    paymentMethods: {
      creditCard: 'all',
      debitCard: 'all',
    },
  }), []);

  useEffect(() => {
    Promise.all([
      causesApi.list(),
      !isGuest ? donationsApi.mine() : Promise.resolve(null)
    ])
      .then(([causesRes, mineRes]) => {
        const causesArray = Array.isArray(causesRes) 
          ? causesRes 
          : (causesRes?.data && Array.isArray(causesRes.data) ? causesRes.data : []);
        setCauses(causesArray);
        setMine(mineRes);
      })
      .catch((err) => {
        console.error('Erro ao carregar dados:', err);
      })
      .finally(() => setLoading(false));
  }, [isGuest]);

  useEffect(() => {
    creditsApi.mpPublicConfig()
      .then((res) => {
        if (res.public_key) {
          initMercadoPago(res.public_key, { locale: res.locale || 'pt-BR' });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const val = Number(form.amount);
    if (!val || val <= 0) {
      setBreakdown(null);
      return;
    }
    let cancelled = false;
    setBreakdownBusy(true);
    const timer = setTimeout(() => {
      donationsApi
        .preview({
          amount: val,
          cover_fees: effectiveCover,
          extra_platform_support: effectiveExtra,
          payment_method: 'credit_card',
        })
        .then((res) => { if (!cancelled) setBreakdown(res); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setBreakdownBusy(false); });
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.amount, effectiveCover, effectiveExtra]);

  const friendlyError = (err) => {
    if (err?.status === 429) return 'Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.';
    return err?.message || 'Não foi possível iniciar a doação.';
  };

  const validateGuest = () => {
    if (!payer.name.trim()) return 'Informe o seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payer.email)) return 'Informe um e-mail válido.';
    if (payer.cpf.replace(/\D/g, '').length !== 11) return 'Informe um CPF válido (11 dígitos).';
    if (!consentLgpd) return 'É preciso autorizar o uso dos dados para concluir a doação.';
    return null;
  };

  const handleSubmitPix = async (e) => {
    e.preventDefault();
    setError('');
    if (isGuest) {
      const problem = validateGuest();
      if (problem) { setError(problem); return; }
    }
    setBusy(true);
    try {
      const payload = {
        amount: Number(form.amount),
        cause_slug: form.cause_slug || null,
        payment_method: 'pix',
        is_anonymous: !form.show_name,
        message: form.message || null,
        cover_fees: effectiveCover,
        extra_platform_support: effectiveExtra,
      };
      if (isGuest) {
        payload.payer_name = payer.name.trim();
        payload.payer_email = payer.email.trim();
        payload.payer_cpf = payer.cpf;
        payload.consent_lgpd = true;
      }
      const res = form.recurring ? await donationsApi.subscribe(payload) : await donationsApi.create(payload);
      if (res.pix) {
        setPixData(res.pix);
        setOrderId(res.public_token);
      } else {
        setError('Pagamento não pôde ser iniciado.');
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const onSubmitCard = async ({ formData }) => {
    setError('');
    if (isGuest) {
      const problem = validateGuest();
      if (problem) { throw new Error(problem); }
    }
    setBusy(true);
    try {
      const body = {
        amount: Number(form.amount),
        cause_slug: form.cause_slug || null,
        is_anonymous: !form.show_name,
        message: form.message || null,
        cover_fees: effectiveCover,
        extra_platform_support: effectiveExtra,
        token: formData.token,
        payment_method_id: formData.payment_method_id,
        installments: formData.installments,
        issuer_id: formData.issuer_id,
      };
      if (isGuest) {
        body.payer_name = payer.name.trim();
        body.payer_email = payer.email.trim();
        body.payer_cpf = payer.cpf;
        body.consent_lgpd = true;
      }
      const res = await donationsApi.createCard(body);
      if (res.status === 'approved' || res.status === 'paid' || res.status === 'pending') {
        setOrderId(res.public_token);
      } else {
        throw new Error('Pagamento recusado: ' + (res.message || res.status));
      }
    } catch (err) {
      setError(friendlyError(err));
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!orderId) return;
    try {
      const statusRes = await donationsApi.status(orderId);
      if (statusRes.status === 'paid') {
         window.location.href = '/?status=success';
      } else {
         alert('Pagamento ainda não confirmado. Aguarde mais alguns instantes.');
      }
    } catch (e) {
      alert('Erro ao verificar status.');
    }
  };

  const copyToClipboard = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      alert('Código PIX copiado!');
    }
  };

  useEffect(() => {
    let intervalId;
    let attempts = 0;
    const MAX_ATTEMPTS = 24;
    if (orderId) {
      intervalId = setInterval(async () => {
        try {
          attempts++;
          const statusRes = await donationsApi.status(orderId);
          if (statusRes.status === 'paid') {
            clearInterval(intervalId);
            window.location.href = '/?status=success';
          } else if (attempts >= MAX_ATTEMPTS) {
            clearInterval(intervalId);
          }
        } catch (e) { console.error('Polling error', e); }
      }, 5000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [orderId]);

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
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
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

          {!form.recurring && (
            <div className="block">
              <span className="block font-bold text-gray-700 mb-2 text-sm">Forma de pagamento</span>
              <div className="flex border-b mb-4">
                <button 
                  type="button"
                  onClick={() => { setForm({ ...form, payment_method: 'pix' }); setError(''); }}
                  className={`flex-1 py-2 font-medium text-sm transition-colors ${form.payment_method === 'pix' ? 'border-b-2 border-brand-accent text-brand-accent' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  PIX
                </button>
                <button 
                  type="button"
                  onClick={() => { setForm({ ...form, payment_method: 'credit_card' }); setError(''); }}
                  className={`flex-1 py-2 font-medium text-sm transition-colors ${form.payment_method === 'credit_card' ? 'border-b-2 border-brand-accent text-brand-accent' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Cartão de crédito
                </button>
              </div>
            </div>
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
                  <dt className="text-gray-600">Taxa operacional QR do Bem / OSCIP (12%)</dt>
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

          {orderId && !pixData && form.payment_method === 'credit_card' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6 text-center">
                 <h2 className="text-xl font-semibold text-gray-900 mb-4">Processando Pagamento</h2>
                 <p className="text-gray-600 mb-6">Aguardando confirmação do cartão...</p>
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto" />
                 <p className="text-xs text-gray-400 mt-4">Isso pode levar alguns instantes.</p>
              </div>
            </div>
          )}

          {pixData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Pagamento PIX</h2>
                  <button onClick={() => setPixData(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                </div>
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                  <p className="text-gray-600 text-sm mb-2">
                    Pague com PIX no app do seu banco. A doação entra automaticamente após a confirmação.
                  </p>
                  {pixData.qr_code_base64 && (
                    <img 
                      src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                      alt="QR Code PIX" 
                      className="w-48 h-48 border rounded-lg p-2 bg-white"
                    />
                  )}
                  <div className="w-full mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">PIX Copia e Cola</label>
                    <div className="flex">
                      <input 
                        type="text" 
                        readOnly 
                        value={pixData.qr_code} 
                        className="w-full px-3 py-2 border rounded-l-lg bg-gray-50 text-xs focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={copyToClipboard}
                        className="bg-brand-blue hover:bg-brand-blue-strong text-white px-4 py-2 rounded-r-lg text-sm font-medium transition"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={handleCheckStatus}
                    className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition"
                  >
                    Já paguei — atualizar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total a pagar:</span>
            <span className="text-xl font-bold text-gray-900">{money(totalToPay)}{form.recurring ? ' / mês' : ''}</span>
          </div>

          {form.payment_method === 'pix' || form.recurring ? (
            <button
              type="button"
              onClick={handleSubmitPix}
              disabled={busy}
              className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white font-black py-4 rounded-lg text-lg disabled:opacity-50"
            >
              {busy
                ? 'Processando...'
                : (form.recurring 
                    ? `Assinar com Checkout Pro` 
                    : `Gerar PIX`)}
            </button>
          ) : (
            <div className="mt-4">
              <Payment
                key={totalToPay}
                initialization={initialization}
                customization={customization}
                onSubmit={onSubmitCard}
                onError={(err) => console.error('Brick Error:', err)}
              />
            </div>
          )}
        </div>
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
