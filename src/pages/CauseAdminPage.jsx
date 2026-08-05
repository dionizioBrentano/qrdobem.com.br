import { useEffect, useState } from 'react';
import { HeartHandshake, Upload, Check, X, Printer, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { spacesApi, causesApi, mediaApi, qrBatchesApi } from '../services/api';

/**
 * CauseAdminPage — painel da causa: vitrine, mídia e QR em lote.
 * Fase 3, T2-R03 a T2-R05 do PLANO_TRILHAS_2026-08.md.
 *
 * Reúne numa tela só as três coisas que o líder da causa faz:
 *   1. contar a história e prestar contas (vitrine)
 *   2. aprovar as fotos que vão para a vitrine (moderação)
 *   3. gerar e imprimir as etiquetas da campanha (lote)
 *
 * A moderação fica aqui, e não escondida num painel de admin, porque quem
 * responde pela causa é quem precisa decidir o que aparece com o nome dela.
 */
export default function CauseAdminPage() {
  const [spaces, setSpaces] = useState([]);
  const [spaceId, setSpaceId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [media, setMedia] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [form, setForm] = useState({
    headline: '', story: '', category: '', city: '', state: '',
    goal_amount: '', accountability: '',
  });

  const [batchForm, setBatchForm] = useState({ quantity: 24, label: '' });

  useEffect(() => {
    spacesApi.list()
      .then((res) => {
        const causes = (res.spaces || []).filter((s) => s.type === 'cause');
        setSpaces(causes);
        if (causes.length) setSpaceId(causes[0].id);
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
      const [detailRes, mediaRes, batchRes] = await Promise.all([
        spacesApi.show(spaceId),
        mediaApi.list(spaceId),
        qrBatchesApi.list(spaceId),
      ]);

      setDetail(detailRes.space);
      setMedia(mediaRes.media || []);
      setBatches(batchRes.batches || []);

      const cause = detailRes.space?.cause;
      if (cause) {
        setForm((prev) => ({
          ...prev,
          headline: cause.headline || '',
          goal_amount: cause.goal_amount || '',
        }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const flash = (message) => {
    setOk(message);
    setTimeout(() => setOk(''), 3000);
  };

  const handleSaveShowcase = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await causesApi.update(spaceId, {
        ...form,
        goal_amount: form.goal_amount === '' ? null : Number(form.goal_amount),
      });
      flash('Vitrine salva.');
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async (publish) => {
    setBusy(true);
    setError('');
    try {
      const res = await causesApi.publish(spaceId, publish);
      flash(res.message);
      await loadAll();
    } catch (err) {
      // A mensagem do backend diz o que falta (chamada, história).
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError('');
    try {
      await mediaApi.upload(spaceId, file);
      flash('Arquivo enviado. Aguarda revisão.');
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const handleModerate = async (mediaId, approve) => {
    setError('');
    try {
      await mediaApi.moderate(mediaId, approve);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await qrBatchesApi.create(
        spaceId,
        Number(batchForm.quantity),
        batchForm.label || null
      );
      flash(res.message);
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Carregando...</div>;

  if (!spaces.length) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
        Você ainda não tem nenhuma causa. Crie um espaço do tipo "Causa" para
        começar — não é preciso CNPJ.
      </div>
    );
  }

  const pending = media.filter((m) => m.status === 'pending');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <HeartHandshake className="w-6 h-6" />
          Minha causa
        </h1>

        {spaces.length > 1 && (
          <select
            value={spaceId || ''}
            onChange={(e) => setSpaceId(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {ok && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded p-3 text-sm">
          {ok}
        </div>
      )}

      {/* Vitrine */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Vitrine pública</h2>

          <button
            onClick={() => handlePublish(!detail?.cause?.is_published)}
            disabled={busy}
            className={`text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ${
              detail?.cause?.is_published
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {detail?.cause?.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {detail?.cause?.is_published ? 'Publicada' : 'Despublicada'}
          </button>
        </div>

        <form onSubmit={handleSaveShowcase} className="space-y-3">
          <input
            type="text" required maxLength={255}
            placeholder="Chamada curta (ex.: Resgate e cuidado de animais atropelados)"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />

          <textarea
            rows={4} maxLength={5000}
            placeholder="A história da causa: o que vocês fazem, para quem, desde quando."
            value={form.story}
            onChange={(e) => setForm({ ...form, story: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />

          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="text" maxLength={50} placeholder="Categoria"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              type="text" maxLength={120} placeholder="Cidade"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              type="text" maxLength={2} placeholder="UF"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              type="number" min="0" step="0.01" placeholder="Meta (R$)"
              value={form.goal_amount}
              onChange={(e) => setForm({ ...form, goal_amount: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <textarea
            rows={4} maxLength={10000}
            placeholder="Prestação de contas: o que foi feito com o que foi arrecadado."
            value={form.accountability}
            onChange={(e) => setForm({ ...form, accountability: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />

          <button
            type="submit" disabled={busy}
            className="bg-brand-blue text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {busy ? 'Salvando...' : 'Salvar vitrine'}
          </button>
        </form>
      </section>

      {/* Mídia e moderação */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">
            Fotos e vídeos
            {pending.length > 0 && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {pending.length} aguardando revisão
              </span>
            )}
          </h2>

          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
            <Upload className="w-4 h-4" />
            Enviar
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Tudo passa por revisão antes de aparecer na vitrine. Confira se não
          há rosto de criança sem autorização, endereço ou documento visível
          ao fundo.
        </p>

        {media.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum arquivo enviado.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {media.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {item.status === 'approved' ? (
                  item.is_video
                    ? <video src={item.url} className="w-full aspect-square object-cover" />
                    : <img src={item.url} alt="" className="w-full aspect-square object-cover" />
                ) : (
                  // Pendente e reprovada não são exibidas nem para quem
                  // modera pela miniatura pública: a rota só serve aprovada.
                  <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-xs text-gray-500 text-center p-2">
                    {item.status === 'pending' ? 'Aguardando revisão' : 'Reprovada'}
                  </div>
                )}

                <div className="p-2 flex items-center justify-between gap-1">
                  <span className="text-xs text-gray-500 truncate">
                    {(item.size_bytes / 1024 / 1024).toFixed(1)} MB
                  </span>

                  {item.status === 'pending' && (
                    <span className="flex gap-1">
                      <button
                        onClick={() => handleModerate(item.id, true)}
                        className="text-emerald-600 p-1"
                        title="Aprovar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleModerate(item.id, false)}
                        className="text-red-600 p-1"
                        title="Reprovar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* QR em lote */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 mb-3">QR Codes em lote</h2>

        <form onSubmit={handleCreateBatch} className="flex flex-wrap gap-2 items-end mb-4">
          <label className="text-sm">
            <span className="block font-bold text-gray-700 mb-1">Quantidade</span>
            <input
              type="number" min="1" max="500" required
              value={batchForm.quantity}
              onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 w-28 text-sm"
            />
          </label>

          <label className="text-sm flex-1 min-w-[180px]">
            <span className="block font-bold text-gray-700 mb-1">Identificação</span>
            <input
              type="text" maxLength={255} placeholder="Ex.: Campanha outubro"
              value={batchForm.label}
              onChange={(e) => setBatchForm({ ...batchForm, label: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
            />
          </label>

          <button
            type="submit" disabled={busy}
            className="bg-brand-blue text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            Gerar lote
          </button>
        </form>

        {batches.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum lote gerado.</p>
        ) : (
          <ul className="space-y-2">
            {batches.map((b) => (
              <li key={b.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <span>
                  <strong>{b.label || `Lote ${b.id}`}</strong> — {b.quantity} etiquetas
                </span>
                {/* A folha de impressão abre em aba nova, e aba nova não
                    leva o header Authorization. O middleware FirebaseAuth
                    aceita o token por query (`id_token`) justamente para
                    este caso — ver app/Http/Middleware/FirebaseAuth.php. */}
                <a
                  href={`${b.print_url}?id_token=${encodeURIComponent(localStorage.getItem('firebase_token') || '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-blue font-bold flex items-center gap-1"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
